import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";
import {
  ensureUsersTable,
  isAdminEmail,
  listAccessUsers,
} from "../../../db/users";
import type { UserRole, UserStatus } from "../../../db/users";

type AccessRequestPayload = {
  fullName?: string;
  email?: string;
  phone?: string;
  role?: string;
  company?: string;
  message?: string;
  source?: string;
  website?: string;
};

type ReviewPayload = {
  id?: string;
  status?: string;
};

const validRoles = new Set<UserRole>(["client", "employee", "ambassador"]);
const validStatuses = new Set<UserStatus>(["approved", "rejected"]);

export async function POST(request: Request) {
  const payload = (await request.json()) as AccessRequestPayload;
  if (payload.website) {
    return Response.json({ ok: true });
  }

  const fullName = String(payload.fullName ?? "").trim();
  const email = String(payload.email ?? "").trim().toLowerCase();
  const phone = String(payload.phone ?? "").trim();
  const role = String(payload.role ?? "") as UserRole;
  const company = String(payload.company ?? "").trim();
  const message = String(payload.message ?? "").trim();
  const source = String(payload.source ?? "website").trim();

  if (
    fullName.length < 2 ||
    !email.includes("@") ||
    phone.length < 7 ||
    !validRoles.has(role)
  ) {
    return Response.json(
      { error: "Please complete all required fields." },
      { status: 400 },
    );
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  if (env.DB) {
    await ensureUsersTable();
    await env.DB.prepare(
      `INSERT INTO users (
        id, email, full_name, phone, requested_role, approved_role,
        company, message, auth_provider, status, source, created_at,
        updated_at, reviewed_at, reviewed_by
      ) VALUES (?, ?, ?, ?, ?, NULL, ?, ?, NULL, 'pending', ?, ?, ?, NULL, NULL)
      ON CONFLICT(email) DO UPDATE SET
        full_name = excluded.full_name,
        phone = excluded.phone,
        requested_role = excluded.requested_role,
        company = excluded.company,
        message = excluded.message,
        status = 'pending',
        source = excluded.source,
        updated_at = excluded.updated_at,
        reviewed_at = NULL,
        reviewed_by = NULL`,
    )
      .bind(
        id,
        email,
        fullName,
        phone,
        role,
        company || null,
        message || null,
        source,
        now,
        now,
      )
      .run();
  }

  const notificationSent = await notifyAdmin({
    id,
    fullName,
    email,
    phone,
    role,
    company,
    message,
    origin: new URL(request.url).origin,
  });

  return Response.json({
    ok: true,
    requestId: id,
    status: "pending",
    notificationSent,
    preview: !env.DB,
  });
}

export async function GET() {
  const user = await getChatGPTUser();
  if (!user || !isAdminEmail(user.email)) {
    return Response.json({ error: "Not authorised" }, { status: 403 });
  }

  return Response.json({ users: await listAccessUsers() });
}

export async function PATCH(request: Request) {
  const user = await getChatGPTUser();
  if (!user || !isAdminEmail(user.email) || !env.DB) {
    return Response.json({ error: "Not authorised" }, { status: 403 });
  }

  const payload = (await request.json()) as ReviewPayload;
  const id = String(payload.id ?? "");
  const status = String(payload.status ?? "") as UserStatus;
  if (!id || !validStatuses.has(status)) {
    return Response.json({ error: "Invalid review request" }, { status: 400 });
  }

  await ensureUsersTable();
  const reviewedAt = new Date().toISOString();
  const result = await env.DB.prepare(
    `UPDATE users
     SET
       status = ?,
       approved_role = CASE WHEN ? = 'approved' THEN requested_role ELSE NULL END,
       reviewed_at = ?,
       reviewed_by = ?,
       updated_at = ?
     WHERE id = ?`,
  )
    .bind(status, status, reviewedAt, user.email, reviewedAt, id)
    .run();

  if (!result.meta.changes) {
    return Response.json({ error: "Request not found" }, { status: 404 });
  }

  return Response.json({ ok: true, id, status });
}

async function notifyAdmin(input: {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  company: string;
  message: string;
  origin: string;
}) {
  const runtimeEnv = env as typeof env & {
    RESEND_API_KEY?: string;
    RESEND_FROM_EMAIL?: string;
    ADMIN_NOTIFICATION_EMAIL?: string;
  };
  if (!runtimeEnv.RESEND_API_KEY || !runtimeEnv.RESEND_FROM_EMAIL) return false;

  const recipient =
    runtimeEnv.ADMIN_NOTIFICATION_EMAIL ?? "admin@crestamarine.com";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${runtimeEnv.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: runtimeEnv.RESEND_FROM_EMAIL,
      to: [recipient],
      subject: `Cresta ${input.role} access request — ${input.fullName}`,
      text: [
        `A new ${input.role} access request is ready for review.`,
        "",
        `Name: ${input.fullName}`,
        `Email: ${input.email}`,
        `Phone: ${input.phone}`,
        `Company / department: ${input.company || "Not provided"}`,
        `Message: ${input.message || "Not provided"}`,
        `Request ID: ${input.id}`,
        "",
        `Review: ${input.origin}/admin/access-requests`,
      ].join("\n"),
    }),
  });

  return response.ok;
}
