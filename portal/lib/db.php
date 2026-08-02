<?php
/** Database handle and small query helpers. */

declare(strict_types=1);

/**
 * Portal settings, from portal/config.php or from environment variables.
 *
 * The environment route exists so the database password can be typed into the
 * host's own control panel instead of a file — nothing secret then lives in the
 * repository, the build, or a file anyone has to edit by hand. config.php still
 * wins when it is present.
 */
function cresta_config(): array
{
    static $config = null;
    if ($config !== null) {
        return $config;
    }

    $path = __DIR__ . '/../config.php';
    $file = is_file($path) ? require $path : [];

    $env = static function (string $key, ?string $fallback = null): ?string {
        $value = getenv($key);
        if ($value === false || $value === '') {
            $value = $_ENV[$key] ?? $_SERVER[$key] ?? null;
        }
        return ($value === false || $value === null || $value === '') ? $fallback : (string) $value;
    };

    $db = $file['db'] ?? [];

    /**
     * Reads one setting, letting config.php win over the environment.
     *
     * The generated file is written from the very same panel variables at build
     * time, so it is never staler than the environment — while the reverse is
     * not true. This host hands PHP an environment captured once and never
     * refreshed, so a setting changed in the panel keeps its old value there
     * for good. Letting the environment win pinned settings to whatever they
     * were on the first boot; the file is re-written by every deploy.
     */
    $pick = static function (array $source, string $key, string $envKey, string $default = ''): string {
        if (array_key_exists($key, $source)) {
            return (string) $source[$key];
        }
        $value = getenv($envKey);
        if ($value === false || $value === '') {
            $value = $_ENV[$envKey] ?? $_SERVER[$envKey] ?? null;
        }
        return ($value === false || $value === null || $value === '') ? $default : (string) $value;
    };

    $config = [
        'db' => [
            'host' => $pick($db, 'host', 'CRESTA_DB_HOST', 'localhost'),
            'name' => $pick($db, 'name', 'CRESTA_DB_NAME'),
            'user' => $pick($db, 'user', 'CRESTA_DB_USER'),
            'pass' => $pick($db, 'pass', 'CRESTA_DB_PASS'),
        ],
        'storage_path' => $file['storage_path'] ?? __DIR__ . '/../storage',
        'mail' => [
            'from'      => $pick($file['mail'] ?? [], 'from', 'CRESTA_MAIL_FROM', 'no-reply@localhost'),
            'from_name' => $file['mail']['from_name'] ?? 'Cresta Marine',
            'admin'     => $pick($file['mail'] ?? [], 'admin', 'CRESTA_MAIL_ADMIN'),
        ],
        'sms' => [
            'driver'   => $pick($file['sms'] ?? [], 'driver', 'CRESTA_SMS_DRIVER', 'manual'),
            'endpoint' => $pick($file['sms'] ?? [], 'endpoint', 'CRESTA_SMS_ENDPOINT'),
            'token'    => $pick($file['sms'] ?? [], 'token', 'CRESTA_SMS_TOKEN'),
            'sender'   => $pick($file['sms'] ?? [], 'sender', 'CRESTA_SMS_SENDER', 'CrestaMarine'),
        ],
        'admin_emails' => array_values(array_filter(array_map(
            'trim',
            explode(',', array_key_exists('admin_emails', $file)
                ? implode(',', (array) $file['admin_emails'])
                : (string) $env('CRESTA_ADMIN_EMAILS', ''))
        ))),
        'site_url' => $pick($file, 'site_url', 'CRESTA_SITE_URL'),
        // Temporary bootstrap — see autoconfirm_admin_if_enabled(). The file
        // stores a real boolean, so it is read directly rather than through
        // $pick(), which deals in strings.
        // Seeding demo accounts before anyone can sign in to do it.
        'demo_token' => $pick($file, 'demo_token', 'CRESTA_DEMO_TOKEN'),
        'admin_autoconfirm' => array_key_exists('admin_autoconfirm', $file)
            ? (bool) $file['admin_autoconfirm']
            : (bool) $env('CRESTA_ADMIN_AUTOCONFIRM', ''),
    ];

    if ($config['db']['name'] === '' || $config['db']['user'] === '') {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode([
            'ok' => false,
            'error' => 'The portal has no database settings yet. Add CRESTA_DB_NAME, '
                . 'CRESTA_DB_USER and CRESTA_DB_PASS in your hosting panel, or create portal/config.php.',
        ]);
        exit;
    }

    return $config;
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $c = cresta_config()['db'];
        try {
            $pdo = new PDO(
                "mysql:host={$c['host']};dbname={$c['name']};charset=utf8mb4",
                $c['user'],
                $c['pass'],
                [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                ]
            );
        } catch (Throwable $e) {
            error_log('Cresta portal DB connection failed: ' . $e->getMessage());

            // Say which setting is wrong without echoing the credentials
            // themselves — "temporarily unavailable" gives an operator nothing
            // to act on, and shared hosts rarely expose PHP's error log.
            $hint = match ((string) $e->getCode()) {
                '1045'         => 'the database user or password was rejected (check CRESTA_DB_USER and CRESTA_DB_PASS)',
                '1044', '1049' => 'that database name was not found or is not granted to this user (check CRESTA_DB_NAME)',
                '2002', '2005' => 'the database host could not be reached (try CRESTA_DB_HOST=127.0.0.1)',
                default        => 'the database refused the connection',
            };

            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode([
                'ok'    => false,
                'error' => 'Cannot reach the database: ' . $hint . '.',
            ]);
            exit;
        }
    }
    return $pdo;
}

function db_one(string $sql, array $params = []): ?array
{
    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    $row = $stmt->fetch();
    return $row === false ? null : $row;
}

function db_all(string $sql, array $params = []): array
{
    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll();
}

function db_run(string $sql, array $params = []): void
{
    $stmt = db()->prepare($sql);
    $stmt->execute($params);
}

function new_id(): string
{
    return bin2hex(random_bytes(16));
}

function now(): string
{
    return gmdate('Y-m-d H:i:s');
}

function minutes_from_now(int $minutes): string
{
    return gmdate('Y-m-d H:i:s', time() + $minutes * 60);
}

function client_ip(): ?string
{
    $ip = $_SERVER['REMOTE_ADDR'] ?? null;
    return is_string($ip) ? substr($ip, 0, 45) : null;
}

function audit(?string $actorId, string $action, ?string $entity = null, ?string $entityId = null, array $meta = []): void
{
    db_run(
        'INSERT INTO audit_log (actor_id, action, entity, entity_id, meta, ip, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
            $actorId,
            $action,
            $entity,
            $entityId,
            $meta ? json_encode($meta, JSON_UNESCAPED_UNICODE) : null,
            client_ip(),
            now(),
        ]
    );
}

/** Splits a migration file into executable statements. */
function sql_statements(string $sql): array
{
    // Strip comment lines FIRST, then split. Splitting first would attach each
    // heading comment to the statement below it and discard the pair.
    $withoutComments = implode("\n", array_filter(
        preg_split('/\R/', $sql) ?: [],
        static fn(string $line): bool => !str_starts_with(ltrim($line), '--')
    ));

    return array_values(array_filter(
        array_map('trim', explode(';', $withoutComments)),
        static fn(string $s): bool => $s !== ''
    ));
}

/**
 * Brings the database up to date on first use.
 *
 * Shared hosting gives us no shell and no migration step in the deploy, so the
 * application applies its own schema. Every file in sql/ runs once, in name
 * order, and is recorded — a new module ships a new file rather than editing an
 * old one, which is what makes it safe to re-run on every request.
 */
function ensure_schema(): void
{
    static $checked = false;
    if ($checked) {
        return;
    }
    $checked = true;

    try {
        db()->exec(
            'CREATE TABLE IF NOT EXISTS schema_migrations (
               filename    VARCHAR(128) NOT NULL PRIMARY KEY,
               applied_at  DATETIME     NOT NULL
             ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
        );
    } catch (Throwable $e) {
        error_log('Cresta portal: cannot create schema_migrations: ' . $e->getMessage());
        return;
    }

    $applied = [];
    foreach (db_all('SELECT filename FROM schema_migrations') as $row) {
        $applied[$row['filename']] = true;
    }

    // The first release installed 001 without recording it. Adopt that history
    // rather than replaying it: the statements are IF NOT EXISTS, but a replay
    // would still log a page of pointless errors on a live database.
    if (!$applied) {
        try {
            db()->query('SELECT 1 FROM users LIMIT 1');
            db_run(
                'INSERT IGNORE INTO schema_migrations (filename, applied_at) VALUES (?, ?)',
                ['001_auth.sql', now()]
            );
            $applied['001_auth.sql'] = true;
        } catch (Throwable) {
            // Genuinely empty database — let 001 run below like any other.
        }
    }

    $files = glob(__DIR__ . '/../sql/*.sql') ?: [];
    sort($files, SORT_STRING);

    foreach ($files as $path) {
        $name = basename($path);
        if (isset($applied[$name])) {
            continue;
        }
        $sql = file_get_contents($path);
        if ($sql === false) {
            continue;
        }

        $failed = false;
        foreach (sql_statements($sql) as $statement) {
            try {
                db()->exec($statement);
            } catch (Throwable $e) {
                $failed = true;
                error_log("Cresta portal: {$name} statement failed: " . $e->getMessage());
            }
        }

        // Recorded even on partial failure: the statements are idempotent, and
        // re-running a broken migration on every single request would bury the
        // one useful line in the error log.
        db_run(
            'INSERT IGNORE INTO schema_migrations (filename, applied_at) VALUES (?, ?)',
            [$name, now()]
        );
        if ($failed) {
            error_log("Cresta portal: {$name} applied with errors — review the log.");
        }
    }
}
