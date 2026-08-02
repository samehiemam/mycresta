-- My Cresta — phase 1, slice 2: boat catalog, options, and priced services.
--
-- Money is stored as minor units in a named currency, never as a float. A
-- price is (amount_minor, currency) together and the pair travels everywhere:
-- the boat and its options are quoted in EUR from the shipyard list, flag
-- registration and marine agency in USD, and local services such as cleaning
-- in EGP. There is no single currency a configuration can be reduced to
-- without an explicit, admin-set rate, so nothing here assumes one.

-- ------------------------------------------------------------- brands ---
CREATE TABLE IF NOT EXISTS brands (
  id          CHAR(32)     NOT NULL PRIMARY KEY,
  slug        VARCHAR(64)  NOT NULL,
  name        VARCHAR(128) NOT NULL,
  active      TINYINT(1)   NOT NULL DEFAULT 1,
  sort_order  INT          NOT NULL DEFAULT 0,
  created_at  DATETIME     NOT NULL,
  updated_at  DATETIME     NOT NULL,
  UNIQUE KEY brands_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------- models ---
-- FR-CAT-050: status controls whether ambassadors and prospects see a model.
CREATE TABLE IF NOT EXISTS models (
  id             CHAR(32)     NOT NULL PRIMARY KEY,
  brand_id       CHAR(32)     NOT NULL,
  slug           VARCHAR(64)  NOT NULL,
  name           VARCHAR(128) NOT NULL,
  -- active | discontinued | coming_soon
  status         VARCHAR(20)  NOT NULL DEFAULT 'active',
  base_amount    BIGINT       NOT NULL DEFAULT 0,
  base_currency  CHAR(3)      NOT NULL DEFAULT 'EUR',
  summary        TEXT         NULL,
  hero_image     VARCHAR(255) NULL,
  sort_order     INT          NOT NULL DEFAULT 0,
  created_at     DATETIME     NOT NULL,
  updated_at     DATETIME     NOT NULL,
  UNIQUE KEY models_slug (slug),
  KEY models_brand_status (brand_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------- specs ---
-- FR-LOC-020 wants metric and imperial. Rather than store both and let them
-- drift, the convertible ones keep a number and a unit and are converted for
-- display; the rest keep the shipyard's own wording.
CREATE TABLE IF NOT EXISTS model_specs (
  id          CHAR(32)     NOT NULL PRIMARY KEY,
  model_id    CHAR(32)     NOT NULL,
  label       VARCHAR(128) NOT NULL,
  value_text  VARCHAR(128) NOT NULL,
  value_num   DECIMAL(12,3) NULL,
  -- m | kg | l | hp | kn | pax, or NULL when the value is not a measurement
  unit        VARCHAR(8)   NULL,
  sort_order  INT          NOT NULL DEFAULT 0,
  KEY model_specs_model (model_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Included in the base price, so listed but never priced.
CREATE TABLE IF NOT EXISTS model_standard_equipment (
  id          CHAR(32)     NOT NULL PRIMARY KEY,
  model_id    CHAR(32)     NOT NULL,
  label       VARCHAR(255) NOT NULL,
  sort_order  INT          NOT NULL DEFAULT 0,
  KEY model_std_model (model_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------ option groups ---
-- selection 'single' comes from the price lists' own wording, "only 1 option
-- can be selected"; everything else is multi-select.
CREATE TABLE IF NOT EXISTS option_groups (
  id          CHAR(32)     NOT NULL PRIMARY KEY,
  model_id    CHAR(32)     NOT NULL,
  parent_id   CHAR(32)     NULL,
  name        VARCHAR(255) NOT NULL,
  selection   VARCHAR(10)  NOT NULL DEFAULT 'multi',
  note        TEXT         NULL,
  sort_order  INT          NOT NULL DEFAULT 0,
  KEY option_groups_model (model_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------ options ---
-- price_on_request covers the list's own "On request" (the transport cradle):
-- shown as such rather than as zero, which would quietly understate a quote.
CREATE TABLE IF NOT EXISTS options (
  id                CHAR(32)     NOT NULL PRIMARY KEY,
  group_id          CHAR(32)     NOT NULL,
  model_id          CHAR(32)     NOT NULL,
  name              VARCHAR(255) NOT NULL,
  amount_minor      BIGINT       NOT NULL DEFAULT 0,
  currency          CHAR(3)      NOT NULL DEFAULT 'EUR',
  price_on_request  TINYINT(1)   NOT NULL DEFAULT 0,
  -- 'Outboard' / 'Inboard' and similar headings inside one group
  subgroup          VARCHAR(128) NULL,
  note              TEXT         NULL,
  active            TINYINT(1)   NOT NULL DEFAULT 1,
  sort_order        INT          NOT NULL DEFAULT 0,
  created_at        DATETIME     NOT NULL,
  updated_at        DATETIME     NOT NULL,
  KEY options_group (group_id),
  KEY options_model (model_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------- compatibility rules ---
-- FR-CAT-030. The source lists state these in prose — "not compatible with
-- inboard engines", "not compatible with shafts motorization" — so the import
-- records what it recognises and flags the rest for a Founder to confirm
-- rather than silently dropping a rule that affects a quote.
CREATE TABLE IF NOT EXISTS option_rules (
  id            CHAR(32)     NOT NULL PRIMARY KEY,
  option_id     CHAR(32)     NOT NULL,
  -- excludes | requires
  rule_type     VARCHAR(16)  NOT NULL DEFAULT 'excludes',
  -- option | subgroup | group
  target_kind   VARCHAR(16)  NOT NULL,
  target_value  VARCHAR(255) NOT NULL,
  -- the sentence the rule was read from, kept for review
  source_text   TEXT         NULL,
  confirmed     TINYINT(1)   NOT NULL DEFAULT 0,
  created_at    DATETIME     NOT NULL,
  KEY option_rules_option (option_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------- priced services ---
-- Everything quoted alongside a boat that is not part of the shipyard list,
-- each in the currency it is actually invoiced in: flag registration and
-- marine agency in USD, local services such as cleaning in EGP.
CREATE TABLE IF NOT EXISTS service_items (
  id            CHAR(32)     NOT NULL PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  -- registration | agency | logistics | maintenance | other
  category      VARCHAR(32)  NOT NULL DEFAULT 'other',
  amount_minor  BIGINT       NOT NULL DEFAULT 0,
  currency      CHAR(3)      NOT NULL DEFAULT 'USD',
  price_on_request TINYINT(1) NOT NULL DEFAULT 0,
  note          TEXT         NULL,
  active        TINYINT(1)   NOT NULL DEFAULT 1,
  sort_order    INT          NOT NULL DEFAULT 0,
  created_at    DATETIME     NOT NULL,
  updated_at    DATETIME     NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------- import runs ---
-- FR-CAT-040 with an audit trail: which file produced which catalog, so a
-- surprising price can be traced back to the spreadsheet it came from.
CREATE TABLE IF NOT EXISTS catalog_imports (
  id            CHAR(32)     NOT NULL PRIMARY KEY,
  model_id      CHAR(32)     NULL,
  filename      VARCHAR(255) NOT NULL,
  file_sha256   CHAR(64)     NOT NULL,
  imported_by   CHAR(32)     NULL,
  summary       TEXT         NULL,
  warnings      TEXT         NULL,
  created_at    DATETIME     NOT NULL,
  KEY catalog_imports_model (model_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
