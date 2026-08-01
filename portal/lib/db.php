<?php
/** Database handle and small query helpers. */

declare(strict_types=1);

function cresta_config(): array
{
    static $config = null;
    if ($config === null) {
        $path = __DIR__ . '/../config.php';
        if (!is_file($path)) {
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode(['error' => 'Portal is not configured yet.']);
            exit;
        }
        $config = require $path;
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
            // Never surface credentials, paths or SQL to the browser.
            error_log('Cresta portal DB connection failed: ' . $e->getMessage());
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode(['ok' => false, 'error' => 'Service temporarily unavailable.']);
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
