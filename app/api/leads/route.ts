import { env } from "cloudflare:workers";

type LeadPayload = {
  name?: string;
  email?: string;
  phone?: string;
  provider?: string;
  configuration?: unknown;
};

async function ensureTables() {
  const db = env.DB;
  if (!db) return;

  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        auth_provider TEXT,
        role TEXT NOT NULL DEFAULT 'prospect',
        status TEXT NOT NULL DEFAULT 'quote_requested',
        created_at TEXT NOT NULL
      )`,
    )
    .run();

  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS boat_configurations (
        id TEXT PRIMARY KEY,
        lead_id TEXT NOT NULL,
        model TEXT NOT NULL,
        configuration_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (lead_id) REFERENCES leads(id)
      )`,
    )
    .run();
}

export async function POST(request: Request) {
  const payload = (await request.json()) as LeadPayload;
  const name = String(payload.name ?? "").trim();
  const email = String(payload.email ?? "").trim().toLowerCase();
  const phone = String(payload.phone ?? "").trim();

  if (!name || !email || !phone || !payload.configuration) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const leadId = crypto.randomUUID();
  const configurationId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const configuration = payload.configuration as { model?: string };

  if (env.DB) {
    await ensureTables();
    await env.DB.batch([
      env.DB
        .prepare(
          `INSERT INTO leads
           (id, name, email, phone, auth_provider, role, status, created_at)
           VALUES (?, ?, ?, ?, ?, 'prospect', 'quote_requested', ?)`,
        )
        .bind(
          leadId,
          name,
          email,
          phone,
          String(payload.provider ?? ""),
          createdAt,
        ),
      env.DB
        .prepare(
          `INSERT INTO boat_configurations
           (id, lead_id, model, configuration_json, created_at)
           VALUES (?, ?, ?, ?, ?)`,
        )
        .bind(
          configurationId,
          leadId,
          String(configuration.model ?? "Kumbra"),
          JSON.stringify(payload.configuration),
          createdAt,
        ),
    ]);
  }

  return Response.json({
    ok: true,
    leadId,
    configurationId,
    preview: !env.DB,
  });
}

