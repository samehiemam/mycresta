-- My Cresta — ambassador commission.
--
-- One row per delivered deal, created at delivery and never recalculated.
-- The rate and the base are copied in rather than looked up, because a
-- commission is a statement about what was agreed at the time: changing the
-- global rate next year must not quietly restate what somebody is owed for a
-- boat delivered this year.
--
-- FR-COMM-010  1.5% finder, 2.5% closer
-- FR-COMM-030  payable only at Delivered, never at signature or deposit
-- FR-COMM-040  no residual on service, parts or accessories — this table only
--              ever holds the one-time fee on a boat sale
-- FR-COMM-050  pending -> approved -> paid, the payout itself happening
--              outside the portal
-- FR-COMM-060  an admin may override the amount or the rate, with a reason

CREATE TABLE IF NOT EXISTS commissions (
  id             CHAR(32)     NOT NULL PRIMARY KEY,
  lead_id        CHAR(32)     NOT NULL,
  ambassador_id  CHAR(32)     NOT NULL,

  -- finder | closer. Which one was earned is a judgement staff record at
  -- close, so it is stored rather than inferred.
  attribution    VARCHAR(10)  NOT NULL DEFAULT 'finder',

  -- Snapshots. The base excludes shipping and VAT (FR-COMM-010).
  base_minor     BIGINT       NOT NULL DEFAULT 0,
  currency       CHAR(3)      NOT NULL DEFAULT 'EUR',
  rate           DECIMAL(6,4) NOT NULL,
  amount_minor   BIGINT       NOT NULL DEFAULT 0,

  -- Set only when an admin departs from the calculation.
  override_minor BIGINT       NULL,
  override_rate  DECIMAL(6,4) NULL,
  override_reason VARCHAR(500) NULL,
  overridden_by  CHAR(32)     NULL,

  -- pending | approved | paid | cancelled
  status         VARCHAR(12)  NOT NULL DEFAULT 'pending',
  approved_by    CHAR(32)     NULL,
  approved_at    DATETIME     NULL,
  paid_at        DATETIME     NULL,
  -- Free text: a transfer reference, a payroll run, whatever settles it.
  payout_ref     VARCHAR(120) NULL,
  note           TEXT         NULL,

  created_at     DATETIME     NOT NULL,
  updated_at     DATETIME     NOT NULL,

  -- One commission per deal. A second delivery event must not mint a second.
  UNIQUE KEY commissions_lead (lead_id),
  KEY commissions_ambassador (ambassador_id, status),
  KEY commissions_status (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
