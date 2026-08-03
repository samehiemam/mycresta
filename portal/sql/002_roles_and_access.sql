-- My Cresta — phase 1, slice 1: scoped roles, provisioning, platform settings.
--
-- The FRD names five roles; the build brief names seven. Both are the same
-- system read at different depths, so roles stay coarse and a scope says which
-- part of the business a member of staff works in (FR-EMP-020, "one or more
-- scoped roles ... Sales, Service, Finance, Marketing"):
--
--   admin                        -> Founder
--   employee + scope 'sales'     -> Advisor
--   employee + scope 'finance'   -> Finance
--   employee + scope 'boat_staff'-> Boat Staff  (account and permissions only;
--                                                the FR-BOAT tools are P2)
--   ambassador, customer         -> unchanged
--
-- Adding a role later is a row, not a migration.

-- ------------------------------------------------------------- scopes ---
-- A staff member may hold several. Ambassadors and customers hold none.
CREATE TABLE IF NOT EXISTS user_scopes (
  user_id     CHAR(32)    NOT NULL,
  scope       VARCHAR(32) NOT NULL,
  granted_by  CHAR(32)    NULL,
  created_at  DATETIME    NOT NULL,
  PRIMARY KEY (user_id, scope),
  KEY user_scopes_scope (scope)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------- invitations ---
-- FR-AUTH-020: staff and ambassadors never self-register. An admin creates the
-- account and the invitee sets their own password from an emailed link, so no
-- password is ever transported or known to the person who issued it.
CREATE TABLE IF NOT EXISTS invitations (
  id           CHAR(32)     NOT NULL PRIMARY KEY,
  user_id      CHAR(32)     NOT NULL,
  -- SHA-256 of the token. The plaintext exists only inside the email.
  token_hash   CHAR(64)     NOT NULL,
  invited_by   CHAR(32)     NOT NULL,
  expires_at   DATETIME     NOT NULL,
  accepted_at  DATETIME     NULL,
  revoked_at   DATETIME     NULL,
  created_at   DATETIME     NOT NULL,
  UNIQUE KEY invitations_token (token_hash),
  KEY invitations_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------- settings ---
-- Admin-editable platform values. Kept as rows rather than constants because
-- the brief requires VAT and the commission rates to be edited without a
-- deploy, and because every one of them is a number someone will argue about.
CREATE TABLE IF NOT EXISTS settings (
  setting_key VARCHAR(64)  NOT NULL PRIMARY KEY,
  value       TEXT         NOT NULL,
  updated_by  CHAR(32)     NULL,
  updated_at  DATETIME     NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Defaults. INSERT IGNORE so re-running never overwrites an edited value.
-- vat_rate is 0.14 for Egypt, not the 21% carried in the shipyard price lists.
INSERT IGNORE INTO settings (setting_key, value, updated_at) VALUES
  ('vat_rate',                '0.14',  UTC_TIMESTAMP()),
  ('commission_finder_rate',  '0.01',  UTC_TIMESTAMP()),
  ('commission_closer_rate',  '0.02',  UTC_TIMESTAMP()),
  ('base_currency',           'EUR',   UTC_TIMESTAMP()),
  ('active_currencies',       'EUR,USD,EGP', UTC_TIMESTAMP()),
  ('fx_rate_usd',             '1.08',  UTC_TIMESTAMP()),
  ('fx_rate_egp',             '54.00', UTC_TIMESTAMP()),
  ('document_max_bytes',      '26214400', UTC_TIMESTAMP());

-- --------------------------------------------- per-ambassador overrides ---
-- FR-EMP-030: rates are global, with a per-agreement override. NULL means
-- "use the global rate", which is different from an override that happens to
-- equal it — the distinction matters when the global rate later changes.
CREATE TABLE IF NOT EXISTS ambassador_terms (
  user_id      CHAR(32)      NOT NULL PRIMARY KEY,
  finder_rate  DECIMAL(6,4)  NULL,
  closer_rate  DECIMAL(6,4)  NULL,
  payout_ref   VARCHAR(255)  NULL,
  photo_path   VARCHAR(255)  NULL,
  agreed_at    DATETIME      NULL,
  note         TEXT          NULL,
  updated_by   CHAR(32)      NULL,
  updated_at   DATETIME      NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
