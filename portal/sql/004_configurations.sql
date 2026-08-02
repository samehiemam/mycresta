-- My Cresta — phase 1, slice 3: saved configurations.
--
-- A configuration snapshots what it quoted. Its lines carry their own name,
-- price and currency rather than pointing at catalog rows, so a price rise or
-- a re-imported list never rewrites a quote that has already been sent. The
-- catalog id is kept alongside, but only so compatibility can be re-checked
-- and the option traced back — never to re-read the price.

CREATE TABLE IF NOT EXISTS configurations (
  id                CHAR(32)     NOT NULL PRIMARY KEY,
  model_id          CHAR(32)     NOT NULL,
  lead_id           CHAR(32)     NULL,
  -- Who built it, and which ambassador it counts for. They differ when an
  -- Advisor builds on behalf of an ambassador's lead.
  created_by        CHAR(32)     NOT NULL,
  ambassador_id     CHAR(32)     NULL,
  -- The prospect it was shared with, which is what grants them sight of it.
  shared_with       CHAR(32)     NULL,
  -- draft | shared | approved | superseded
  status            VARCHAR(20)  NOT NULL DEFAULT 'draft',
  name              VARCHAR(160) NULL,

  -- Founder-only commercials. shipping_minor stays NULL until set, which is
  -- what "To be confirmed" reads from; zero would mean "included".
  discount_minor    BIGINT       NOT NULL DEFAULT 0,
  discount_currency CHAR(3)      NOT NULL DEFAULT 'EUR',
  discount_reason   VARCHAR(255) NULL,
  shipping_minor    BIGINT       NULL,
  shipping_currency CHAR(3)      NOT NULL DEFAULT 'EUR',

  -- The rate in force when the quote was made. A later change to the platform
  -- setting must not silently restate a quote already in a customer's hands.
  vat_rate          DECIMAL(6,4) NOT NULL DEFAULT 0.1400,

  notes             TEXT         NULL,
  shared_at         DATETIME     NULL,
  approved_at       DATETIME     NULL,
  created_at        DATETIME     NOT NULL,
  updated_at        DATETIME     NOT NULL,
  KEY configurations_model (model_id),
  KEY configurations_lead (lead_id),
  KEY configurations_owner (ambassador_id, status),
  KEY configurations_shared (shared_with)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS configuration_items (
  id                CHAR(32)     NOT NULL PRIMARY KEY,
  configuration_id  CHAR(32)     NOT NULL,
  -- base | option | service | shipping
  kind              VARCHAR(16)  NOT NULL,
  -- The catalog row this came from, for compatibility checks and tracing.
  -- Never re-read for price: the snapshot below is the quoted figure.
  source_id         CHAR(32)     NULL,
  name              VARCHAR(255) NOT NULL,
  group_name        VARCHAR(255) NULL,
  amount_minor      BIGINT       NOT NULL DEFAULT 0,
  currency          CHAR(3)      NOT NULL DEFAULT 'EUR',
  on_request        TINYINT(1)   NOT NULL DEFAULT 0,
  sort_order        INT          NOT NULL DEFAULT 0,
  KEY configuration_items_config (configuration_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- FR-PROS-040: a prospect's comments and change requests, routed back to
-- whoever owns the configuration.
CREATE TABLE IF NOT EXISTS configuration_comments (
  id                CHAR(32)     NOT NULL PRIMARY KEY,
  configuration_id  CHAR(32)     NOT NULL,
  author_id         CHAR(32)     NOT NULL,
  body              TEXT         NOT NULL,
  created_at        DATETIME     NOT NULL,
  KEY configuration_comments_config (configuration_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
