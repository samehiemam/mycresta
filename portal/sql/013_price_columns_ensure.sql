-- Makes certain the price-visibility columns exist.
--
-- 012 added them with plain ALTER TABLE, which is not idempotent, and the
-- migration runner records a file as applied even when one of its statements
-- fails — a deliberate choice that keeps a broken migration from replaying on
-- every request, but which means a failure there is silent and permanent.
--
-- So this file does not assume 012 worked. Each column is added only if
-- information_schema says it is missing, which makes the whole file safe to run
-- against a database where 012 succeeded, partly succeeded, or did nothing.
--
-- Written as SET / PREPARE / EXECUTE rather than ADD COLUMN IF NOT EXISTS
-- because that shorthand is MariaDB's and not MySQL's, and this has to apply on
-- whichever the host happens to run.

SET @db := DATABASE();

-- users.can_see_prices
SET @n := (SELECT COUNT(*) FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'users' AND COLUMN_NAME = 'can_see_prices');
SET @s := IF(@n = 0,
  'ALTER TABLE users ADD COLUMN can_see_prices TINYINT(1) NOT NULL DEFAULT 0',
  'DO 0');
PREPARE st FROM @s;
EXECUTE st;
DEALLOCATE PREPARE st;

-- users.prices_granted_by
SET @n := (SELECT COUNT(*) FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'users' AND COLUMN_NAME = 'prices_granted_by');
SET @s := IF(@n = 0, 'ALTER TABLE users ADD COLUMN prices_granted_by CHAR(32) NULL', 'DO 0');
PREPARE st FROM @s;
EXECUTE st;
DEALLOCATE PREPARE st;

-- users.prices_granted_at
SET @n := (SELECT COUNT(*) FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'users' AND COLUMN_NAME = 'prices_granted_at');
SET @s := IF(@n = 0, 'ALTER TABLE users ADD COLUMN prices_granted_at DATETIME NULL', 'DO 0');
PREPARE st FROM @s;
EXECUTE st;
DEALLOCATE PREPARE st;

-- configurations.description
SET @n := (SELECT COUNT(*) FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'configurations' AND COLUMN_NAME = 'description');
SET @s := IF(@n = 0, 'ALTER TABLE configurations ADD COLUMN description VARCHAR(600) NULL', 'DO 0');
PREPARE st FROM @s;
EXECUTE st;
DEALLOCATE PREPARE st;

-- configurations.is_template
SET @n := (SELECT COUNT(*) FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'configurations' AND COLUMN_NAME = 'is_template');
SET @s := IF(@n = 0, 'ALTER TABLE configurations ADD COLUMN is_template TINYINT(1) NOT NULL DEFAULT 0', 'DO 0');
PREPARE st FROM @s;
EXECUTE st;
DEALLOCATE PREPARE st;

-- configurations.model_key
SET @n := (SELECT COUNT(*) FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'configurations' AND COLUMN_NAME = 'model_key');
SET @s := IF(@n = 0, 'ALTER TABLE configurations ADD COLUMN model_key VARCHAR(8) NULL', 'DO 0');
PREPARE st FROM @s;
EXECUTE st;
DEALLOCATE PREPARE st;

-- configurations.model_id must admit NULL: a configuration built in the
-- configurator has a model_key and no catalog row to point at.
SET @n := (SELECT COUNT(*) FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'configurations'
              AND COLUMN_NAME = 'model_id' AND IS_NULLABLE = 'NO');
SET @s := IF(@n = 1, 'ALTER TABLE configurations MODIFY COLUMN model_id CHAR(32) NULL', 'DO 0');
PREPARE st FROM @s;
EXECUTE st;
DEALLOCATE PREPARE st;
