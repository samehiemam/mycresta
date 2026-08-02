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
    $config = [
        'db' => [
            'host' => $env('CRESTA_DB_HOST', $db['host'] ?? 'localhost'),
            'name' => $env('CRESTA_DB_NAME', $db['name'] ?? ''),
            'user' => $env('CRESTA_DB_USER', $db['user'] ?? ''),
            'pass' => $env('CRESTA_DB_PASS', $db['pass'] ?? ''),
        ],
        'storage_path' => $file['storage_path'] ?? __DIR__ . '/../storage',
        'mail' => [
            'from'      => $env('CRESTA_MAIL_FROM', $file['mail']['from'] ?? 'no-reply@localhost'),
            'from_name' => $file['mail']['from_name'] ?? 'Cresta Marine',
            'admin'     => $env('CRESTA_MAIL_ADMIN', $file['mail']['admin'] ?? ''),
        ],
        'sms' => [
            'driver'   => $env('CRESTA_SMS_DRIVER', $file['sms']['driver'] ?? 'manual'),
            'endpoint' => $env('CRESTA_SMS_ENDPOINT', $file['sms']['endpoint'] ?? ''),
            'token'    => $env('CRESTA_SMS_TOKEN', $file['sms']['token'] ?? ''),
            'sender'   => $env('CRESTA_SMS_SENDER', $file['sms']['sender'] ?? 'CrestaMarine'),
        ],
        'admin_emails' => array_filter(array_map(
            'trim',
            explode(',', $env('CRESTA_ADMIN_EMAILS', implode(',', $file['admin_emails'] ?? [])) ?? '')
        )),
        'site_url' => $env('CRESTA_SITE_URL', $file['site_url'] ?? ''),
        // Temporary bootstrap — see autoconfirm_admin_if_enabled().
        // The generated config stores this as a real boolean, so normalise it
        // before handing it to $env(), which only accepts a string fallback.
        'admin_autoconfirm' => (bool) $env(
            'CRESTA_ADMIN_AUTOCONFIRM',
            empty($file['admin_autoconfirm']) ? '' : '1'
        ),
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

/**
 * Creates the portal tables on first use.
 *
 * Saves the operator a manual phpMyAdmin step, and keeps a fresh install from
 * failing with a confusing SQL error. The check is a cheap lookup; the schema
 * only runs when the tables are genuinely absent.
 */
function ensure_schema(): void
{
    static $checked = false;
    if ($checked) {
        return;
    }
    $checked = true;

    try {
        db()->query('SELECT 1 FROM users LIMIT 1');
        return; // already installed
    } catch (Throwable) {
        // table missing — fall through and install
    }

    $sql = file_get_contents(__DIR__ . '/../sql/001_auth.sql');
    if ($sql === false) {
        return;
    }

    // Strip comment lines FIRST, then split. Splitting first would attach each
    // heading comment to the statement below it and discard the pair.
    $withoutComments = implode("\n", array_filter(
        preg_split('/\R/', $sql) ?: [],
        static fn(string $line): bool => !str_starts_with(ltrim($line), '--')
    ));

    $statements = array_filter(
        array_map('trim', explode(';', $withoutComments)),
        static fn(string $s): bool => $s !== ''
    );

    foreach ($statements as $statement) {
        try {
            db()->exec($statement);
        } catch (Throwable $e) {
            error_log('Cresta portal schema statement failed: ' . $e->getMessage());
        }
    }
}
