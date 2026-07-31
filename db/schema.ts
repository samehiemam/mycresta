import { sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const leads = sqliteTable("leads", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  authProvider: text("auth_provider"),
  role: text("role").notNull().default("prospect"),
  status: text("status").notNull().default("quote_requested"),
  createdAt: text("created_at").notNull(),
});

export const boatConfigurations = sqliteTable("boat_configurations", {
  id: text("id").primaryKey(),
  leadId: text("lead_id")
    .notNull()
    .references(() => leads.id),
  model: text("model").notNull(),
  configurationJson: text("configuration_json").notNull(),
  createdAt: text("created_at").notNull(),
});

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    fullName: text("full_name").notNull(),
    phone: text("phone").notNull(),
    requestedRole: text("requested_role").notNull(),
    approvedRole: text("approved_role"),
    company: text("company"),
    message: text("message"),
    authProvider: text("auth_provider"),
    status: text("status").notNull().default("pending"),
    source: text("source").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    reviewedAt: text("reviewed_at"),
    reviewedBy: text("reviewed_by"),
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email)],
);
