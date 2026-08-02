-- One-time codes for setting a password.
--
-- An admin creating an account, or resetting one, never chooses the password
-- and never learns it. A code goes to the person's own email and they set
-- their own — so a compromised admin session cannot walk away with working
-- credentials, and nobody has to say a password out loud.
--
-- Only the hash is stored. A leaked database gives an attacker nothing to
-- type, and a lost code is reissued rather than looked up.

CREATE TABLE IF NOT EXISTS password_otps (
  id          CHAR(32)     NOT NULL PRIMARY KEY,
  user_id     CHAR(32)     NOT NULL,
  -- SHA-256 of the six digits.
  code_hash   CHAR(64)     NOT NULL,
  -- invite | reset — only wording differs, but it belongs in the audit trail
  purpose     VARCHAR(16)  NOT NULL DEFAULT 'reset',
  issued_by   CHAR(32)     NULL,
  -- Guesses so far. A short numeric code needs a hard ceiling: six digits is
  -- a million possibilities, which is nothing to a script left running.
  attempts    INT          NOT NULL DEFAULT 0,
  expires_at  DATETIME     NOT NULL,
  used_at     DATETIME     NULL,
  created_at  DATETIME     NOT NULL,
  KEY password_otps_user (user_id, used_at),
  KEY password_otps_expiry (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
