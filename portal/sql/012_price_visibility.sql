-- Who may see a price, and named configurations.
--
-- Price visibility is deliberately NOT a role. The brief is that it is off for
-- everyone by default and switched on per person by a Founder — a particular
-- customer or a particular ambassador, not "customers" or "ambassadors". A role
-- cannot express that, so it is a grant on the account.
--
-- Three separate things can reveal a price, checked in this order:
--
--   1. The account is an admin (Founder). Always.
--   2. The account has been granted price visibility by a Founder.
--   3. The configuration is approved and shared with this customer. Somebody
--      who has been quoted has already seen the number; hiding it afterwards
--      helps nobody. Scoped to that one configuration and grants nothing else.
--
-- Every statement here is its own ALTER on purpose. The migration runner records
-- a file as applied even when a statement fails, on the assumption that the
-- statements are idempotent — true of CREATE TABLE IF NOT EXISTS, false of
-- ALTER TABLE. Grouped into one ALTER, a single failure would lose every column
-- in it and still be marked done. Split, each column stands or falls alone, and
-- a re-run fails with a harmless "duplicate column" per statement.

ALTER TABLE users ADD COLUMN can_see_prices TINYINT(1) NOT NULL DEFAULT 0;
-- Kept so "who approved this, and when" is still answerable a year later.
ALTER TABLE users ADD COLUMN prices_granted_by CHAR(32) NULL;
ALTER TABLE users ADD COLUMN prices_granted_at DATETIME NULL;

-- ------------------------------------------------------ configurations ----
-- `name` already exists. A description is what makes a saved configuration
-- reusable rather than a mystery: "good for El Gouna day trips" is the part a
-- salesperson actually needs.
ALTER TABLE configurations ADD COLUMN description VARCHAR(600) NULL;

-- A template is a configuration kept to offer to customers rather than one
-- belonging to a deal. Same shape, so the configurator needs no second path.
ALTER TABLE configurations ADD COLUMN is_template TINYINT(1) NOT NULL DEFAULT 0;

-- The configurator identifies a boat by '34' | '36' | '43', which is what the
-- price rows are keyed by. The imported catalog uses its own row ids, and the
-- two have never been reconciled.
ALTER TABLE configurations ADD COLUMN model_key VARCHAR(8) NULL;

-- model_id was NOT NULL because a configuration could only come from the
-- imported catalog. One now arrives from the configurator, which knows a model
-- by key and has no catalog row to point at, so the column has to admit that.
ALTER TABLE configurations MODIFY COLUMN model_id CHAR(32) NULL;

-- Templates are listed constantly and belong to nobody, so they get their own
-- index rather than being filtered out of every other query by hand.
ALTER TABLE configurations ADD KEY configurations_template (is_template, model_key);
