import { env } from "cloudflare:workers";

export type UserRole = "client" | "employee" | "ambassador";
export type UserStatus = "pending" | "approved" | "rejected";

export type AccessUser = {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  requestedRole: UserRole;
  approvedRole: UserRole | null;
  company: string | null;
  message: string | null;
  authProvider: string | null;
  status: UserStatus;
  source: string;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
};

export async function ensureUsersTable() {
  if (!env.DB) return;

  await env.DB.batch([
    env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        full_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        requested_role TEXT NOT NULL,
        approved_role TEXT,
        company TEXT,
        message TEXT,
        auth_provider TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        source TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        reviewed_at TEXT,
        reviewed_by TEXT
      )`,
    ),
    env.DB.prepare(
      "CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users (email)",
    ),
  ]);
}

export async function listAccessUsers(): Promise<AccessUser[]> {
  if (!env.DB) return [];
  await ensureUsersTable();

  const result = await env.DB.prepare(
    `SELECT
      id,
      email,
      full_name AS fullName,
      phone,
      requested_role AS requestedRole,
      approved_role AS approvedRole,
      company,
      message,
      auth_provider AS authProvider,
      status,
      source,
      created_at AS createdAt,
      updated_at AS updatedAt,
      reviewed_at AS reviewedAt,
      reviewed_by AS reviewedBy
    FROM users
    ORDER BY
      CASE status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
      created_at DESC`,
  ).all<AccessUser>();

  return result.results;
}

export async function listManagedAccounts(): Promise<AccessUser[]> {
  const users = await listAccessUsers();
  return users.filter(
    (user) =>
      user.requestedRole === "client" || user.requestedRole === "ambassador",
  );
}

export async function getAccessUserByEmail(
  email: string,
): Promise<AccessUser | null> {
  if (!env.DB) return null;
  await ensureUsersTable();

  return env.DB.prepare(
    `SELECT
      id,
      email,
      full_name AS fullName,
      phone,
      requested_role AS requestedRole,
      approved_role AS approvedRole,
      company,
      message,
      auth_provider AS authProvider,
      status,
      source,
      created_at AS createdAt,
      updated_at AS updatedAt,
      reviewed_at AS reviewedAt,
      reviewed_by AS reviewedBy
    FROM users
    WHERE email = ?
    LIMIT 1`,
  )
    .bind(email.trim().toLowerCase())
    .first<AccessUser>();
}

export function isAdminEmail(email: string) {
  const runtimeEnv = env as typeof env & { ADMIN_EMAILS?: string };
  const configured = runtimeEnv.ADMIN_EMAILS ?? "admin@crestamarine.com";
  return configured
    .split(",")
    .map((value: string) => value.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}

export async function canManageAccounts(email: string) {
  if (isAdminEmail(email)) return true;
  const accessUser = await getAccessUserByEmail(email);
  return (
    accessUser?.status === "approved" &&
    accessUser.approvedRole === "employee"
  );
}
