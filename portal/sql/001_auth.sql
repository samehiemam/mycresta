-- Cresta Marine — My Cresta portal, phase 1: identity and access.
--
-- Run once against the Hostinger MySQL database (hPanel → phpMyAdmin → SQL).
-- Safe to re-run: every statement is IF NOT EXISTS.

-- ---------------------------------------------------------------- users ---
CREATE TABLE IF NOT EXISTS users (
  id              CHAR(32)     NOT NULL PRIMARY KEY,
  email           VARCHAR(255) NOT NULL,
  -- Hash only. Plaintext passwords are never stored or logged.
  password_hash   VARCHAR(255) NULL,
  full_name       VARCHAR(255) NOT NULL,
  phone           VARCHAR(32)  NOT NULL,
  -- customer | employee | ambassador | admin
  role            VARCHAR(20)  NOT NULL DEFAULT 'customer',
  -- what the visitor asked for at sign-up; role is what was granted
  requested_role  VARCHAR(20)  NOT NULL DEFAULT 'customer',
  -- pending | approved | rejected | disabled
  status          VARCHAR(20)  NOT NULL DEFAULT 'pending',
  company         VARCHAR(255) NULL,
  message         TEXT         NULL,
  email_verified_at DATETIME   NULL,
  phone_verified_at DATETIME   NULL,
  last_login_at   DATETIME     NULL,
  reviewed_by     CHAR(32)     NULL,
  reviewed_at     DATETIME     NULL,
  created_at      DATETIME     NOT NULL,
  updated_at      DATETIME     NOT NULL,
  UNIQUE KEY users_email_unique (email),
  KEY users_role_status (role, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------- sessions ---
-- Only a hash of the session token is stored, so a database leak cannot be
-- replayed as a login. Lets the user sign out of every device.
CREATE TABLE IF NOT EXISTS sessions (
  id           CHAR(64)     NOT NULL PRIMARY KEY,
  user_id      CHAR(32)     NOT NULL,
  ip           VARCHAR(45)  NULL,
  user_agent   VARCHAR(255) NULL,
  created_at   DATETIME     NOT NULL,
  last_seen_at DATETIME     NOT NULL,
  expires_at   DATETIME     NOT NULL,
  KEY sessions_user (user_id),
  KEY sessions_expiry (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------- verification + reset ---
-- One table for both channels; `channel` is 'email' or 'phone'.
-- Codes are stored hashed and are single-use.
CREATE TABLE IF NOT EXISTS verifications (
  id          CHAR(32)    NOT NULL PRIMARY KEY,
  user_id     CHAR(32)    NOT NULL,
  channel     VARCHAR(10) NOT NULL,
  -- the address/number the code was sent to, so changing it invalidates the code
  destination VARCHAR(255) NOT NULL,
  code_hash   VARCHAR(255) NOT NULL,
  attempts    INT          NOT NULL DEFAULT 0,
  sent_at     DATETIME     NOT NULL,
  expires_at  DATETIME     NOT NULL,
  used_at     DATETIME     NULL,
  KEY verifications_user_channel (user_id, channel),
  KEY verifications_expiry (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS password_resets (
  id         CHAR(32)     NOT NULL PRIMARY KEY,
  user_id    CHAR(32)     NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  created_at DATETIME     NOT NULL,
  expires_at DATETIME     NOT NULL,
  used_at    DATETIME     NULL,
  KEY password_resets_user (user_id),
  KEY password_resets_expiry (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------- rate limiting ---
-- Throttles login, registration and code sending per identifier and per IP.
CREATE TABLE IF NOT EXISTS auth_attempts (
  id         BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  action     VARCHAR(32)  NOT NULL,
  identifier VARCHAR(255) NOT NULL,
  ip         VARCHAR(45)  NULL,
  successful TINYINT(1)   NOT NULL DEFAULT 0,
  created_at DATETIME     NOT NULL,
  KEY auth_attempts_lookup (action, identifier, created_at),
  KEY auth_attempts_ip (action, ip, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------ audit log ---
-- Who did what: approvals, role changes and (later) commission decisions.
CREATE TABLE IF NOT EXISTS audit_log (
  id         BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  actor_id   CHAR(32)     NULL,
  action     VARCHAR(64)  NOT NULL,
  entity     VARCHAR(64)  NULL,
  entity_id  VARCHAR(64)  NULL,
  meta       TEXT         NULL,
  ip         VARCHAR(45)  NULL,
  created_at DATETIME     NOT NULL,
  KEY audit_actor (actor_id, created_at),
  KEY audit_entity (entity, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
