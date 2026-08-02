-- My Cresta — leads and the deal pipeline.
--
-- A lead and a deal are one record moving through stages, not two things: the
-- FRD's pipeline runs New Lead ... Delivered without changing what the record
-- is, and splitting it would mean deciding when to copy data across, which is
-- where ownership disputes are born.
--
-- Ownership is the rule that matters most here. The first ambassador to
-- register a lead owns it permanently — no time-based expiry, and only a
-- Founder may reassign (FR-LEAD-050, FR-LEAD-040). A lead with no ambassador
-- behind it is a house lead belonging to Cresta (FR-LEAD-030).

CREATE TABLE IF NOT EXISTS leads (
  id            CHAR(32)     NOT NULL PRIMARY KEY,

  full_name     VARCHAR(255) NOT NULL,
  email         VARCHAR(255) NULL,
  phone         VARCHAR(64)  NULL,
  -- The customer's own account, once they have one.
  customer_id   CHAR(32)     NULL,

  -- Ownership. NULL is not "unassigned" — it is a house lead, which is a
  -- deliberate state with an owner of its own in assigned_to.
  ambassador_id CHAR(32)     NULL,
  assigned_to   CHAR(32)     NULL,
  -- Kept for disputes: the first-to-register rule turns on this timestamp.
  claimed_at    DATETIME     NULL,

  -- new | config_shared | quote_sent | reserved | contract_signed
  -- | in_production | delivered | closed_lost
  stage         VARCHAR(24)  NOT NULL DEFAULT 'new',
  -- Where it came from: website, ambassador, referral, walk_in, other
  source        VARCHAR(32)  NOT NULL DEFAULT 'other',
  brand_slug    VARCHAR(64)  NULL,
  model_slug    VARCHAR(64)  NULL,

  -- The winning configuration, once there is one.
  configuration_id CHAR(32)  NULL,
  public_build_id  CHAR(32)  NULL,

  -- Snapshotted at delivery so a later price change cannot restate what the
  -- commission was calculated from.
  deal_value_minor BIGINT    NULL,
  deal_currency    CHAR(3)   NOT NULL DEFAULT 'EUR',

  notes         TEXT         NULL,
  lost_reason   VARCHAR(255) NULL,
  delivered_at  DATETIME     NULL,
  created_at    DATETIME     NOT NULL,
  updated_at    DATETIME     NOT NULL,

  KEY leads_stage (stage, updated_at),
  KEY leads_ambassador (ambassador_id, stage),
  KEY leads_assigned (assigned_to, stage),
  KEY leads_customer (customer_id),
  -- Contact lookups drive the first-to-register check, so they are indexed
  -- rather than scanned.
  KEY leads_email (email),
  KEY leads_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- FR-AMB-050: activity notes and follow-up reminders against a lead, and the
-- stage history that makes a pipeline auditable.
CREATE TABLE IF NOT EXISTS lead_events (
  id          CHAR(32)     NOT NULL PRIMARY KEY,
  lead_id     CHAR(32)     NOT NULL,
  author_id   CHAR(32)     NULL,
  -- note | stage | reassigned | reminder | system
  kind        VARCHAR(16)  NOT NULL DEFAULT 'note',
  body        TEXT         NULL,
  from_stage  VARCHAR(24)  NULL,
  to_stage    VARCHAR(24)  NULL,
  -- Set for a reminder; NULL for everything else.
  due_at      DATETIME     NULL,
  done_at     DATETIME     NULL,
  created_at  DATETIME     NOT NULL,
  KEY lead_events_lead (lead_id, created_at),
  KEY lead_events_due (due_at, done_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
