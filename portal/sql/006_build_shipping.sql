-- Shipping and handling against a client-built configuration.
--
-- NULL is a real state and the reason this is nullable rather than defaulted
-- to zero: it means nobody has priced the freight yet, which reads as "to be
-- confirmed". Zero would read as "included", and someone would quote it.
--
-- Portal-built configurations already carry this on `configurations`; this
-- brings the builds that arrive from the public site into line.

ALTER TABLE public_builds
  ADD COLUMN shipping_minor    BIGINT  NULL AFTER estimate_minor;

ALTER TABLE public_builds
  ADD COLUMN shipping_currency CHAR(3) NOT NULL DEFAULT 'EUR' AFTER shipping_minor;

ALTER TABLE public_builds
  ADD COLUMN shipping_set_by   CHAR(32) NULL AFTER shipping_currency;

ALTER TABLE public_builds
  ADD COLUMN shipping_set_at   DATETIME NULL AFTER shipping_set_by;
