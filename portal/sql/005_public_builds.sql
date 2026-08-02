-- My Cresta — client-built configurations from the public site.
--
-- A visitor who finishes a build on crestamarine.com and asks for a quote has
-- made a real sales artefact. It is stored structurally — the selections, not
-- a paragraph of prose — so staff can reopen the exact build in My Cresta with
-- prices, rather than reading a summary and rebuilding it by hand.
--
-- Kept apart from `configurations`, which are built inside the portal against
-- the imported price list. These come from the public catalog and belong to
-- nobody until an advisor picks them up.

CREATE TABLE IF NOT EXISTS public_builds (
  id            CHAR(32)     NOT NULL PRIMARY KEY,

  -- Whoever asked for the quote. No account is required to build one.
  full_name     VARCHAR(255) NULL,
  email         VARCHAR(255) NULL,
  phone         VARCHAR(64)  NULL,
  -- Set once the address matches a My Cresta account, so the customer can see
  -- their own build when they sign in.
  user_id       CHAR(32)     NULL,

  -- The selection, replayable by the same component that captured it.
  model_key     VARCHAR(8)   NOT NULL,
  engine_id     VARCHAR(64)  NOT NULL,
  ownership     VARCHAR(64)  NULL,
  diamond_stitching TINYINT(1) NOT NULL DEFAULT 0,
  finishes      TEXT         NOT NULL,   -- JSON: finish key => option id
  equipment     TEXT         NOT NULL,   -- JSON: array of equipment ids

  -- The price-list total at the moment of capture, so a later price change
  -- cannot silently restate what the customer was looking at.
  estimate_minor BIGINT      NOT NULL DEFAULT 0,
  currency      CHAR(3)      NOT NULL DEFAULT 'EUR',

  -- new | contacted | converted | closed
  status        VARCHAR(20)  NOT NULL DEFAULT 'new',
  -- The advisor or ambassador who picked it up.
  assigned_to   CHAR(32)     NULL,
  note          TEXT         NULL,

  created_at    DATETIME     NOT NULL,
  updated_at    DATETIME     NOT NULL,
  KEY public_builds_status (status, created_at),
  KEY public_builds_user (user_id),
  KEY public_builds_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
