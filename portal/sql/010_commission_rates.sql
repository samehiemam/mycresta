-- Commission rates become 1% finder and 2% closer.
--
-- The seed in 002 only ever runs on a fresh install (INSERT IGNORE), so a
-- database that already holds the old figures needs saying so explicitly.
--
-- Commissions already raised are untouched on purpose: each one stores the
-- rate it was calculated with, because it is a statement about what was
-- agreed at the time. A rate change applies to deals delivered from now on.

UPDATE settings SET value = '0.01', updated_at = UTC_TIMESTAMP()
 WHERE setting_key = 'commission_finder_rate';

UPDATE settings SET value = '0.02', updated_at = UTC_TIMESTAMP()
 WHERE setting_key = 'commission_closer_rate';
