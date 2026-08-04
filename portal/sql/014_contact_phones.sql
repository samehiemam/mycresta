-- Extra telephone numbers, for accounts and for leads alike.
--
-- One number per person was never enough here: a customer gives a mobile, a
-- WhatsApp number that is often a different line, and sometimes an office. The
-- single users.phone / leads.phone column forced whoever took the call to
-- overwrite one with another.
--
-- Those primary columns stay exactly as they are. They are what an account
-- signs up with and what the pipeline shows at a glance, and moving them here
-- would mean rewriting every query that reads a phone number to gain nothing.
-- This table is strictly additional.
--
-- Keyed by owner_type + owner_id rather than split into two tables, because a
-- lead and the account it later becomes are the same person to everyone except
-- the schema, and the rules for editing them differ only in who is allowed.

CREATE TABLE IF NOT EXISTS contact_phones (
  id          CHAR(32)    NOT NULL PRIMARY KEY,
  -- user | lead
  owner_type  VARCHAR(8)  NOT NULL,
  owner_id    CHAR(32)    NOT NULL,
  -- mobile | whatsapp | office | home | other. Free enough to be useful,
  -- closed enough that the list stays sortable.
  label       VARCHAR(16) NOT NULL DEFAULT 'mobile',
  phone       VARCHAR(64) NOT NULL,
  note        VARCHAR(120) NULL,
  created_by  CHAR(32)    NULL,
  created_at  DATETIME    NOT NULL,

  KEY contact_phones_owner (owner_type, owner_id),
  -- The same number twice against one person is a mistake every time.
  UNIQUE KEY contact_phones_unique (owner_type, owner_id, phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
