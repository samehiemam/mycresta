<?php
/** Request/response helpers, CSRF and rate limiting. */

declare(strict_types=1);

require_once __DIR__ . '/db.php';

function json_out(array $payload, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function fail(string $message, int $status = 400, array $extra = []): never
{
    json_out(array_merge(['ok' => false, 'error' => $message], $extra), $status);
}

function body(): array
{
    $raw = file_get_contents('php://input') ?: '';
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function field(array $data, string $key, int $max = 255): string
{
    $value = $data[$key] ?? '';
    if (!is_string($value)) {
        return '';
    }
    return mb_substr(trim($value), 0, $max);
}

function require_method(string $method): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== $method) {
        fail('Method not allowed.', 405);
    }
}

/**
 * Session cookie: HttpOnly so JavaScript cannot read it, SameSite=Lax so it is
 * not sent on cross-site POSTs, Secure whenever the request is over HTTPS.
 */
function start_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/',
        'httponly' => true,
        'secure'   => $https,
        'samesite' => 'Lax',
    ]);
    session_name('cresta_portal');
    session_start();
}

function csrf_token(): string
{
    start_session();
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf'];
}

function require_csrf(): void
{
    start_session();
    $sent = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    $known = $_SESSION['csrf'] ?? '';
    if (!is_string($sent) || $known === '' || !hash_equals($known, $sent)) {
        fail('Your session expired. Please refresh and try again.', 419);
    }
}

/**
 * Simple sliding-window throttle. Counts recent attempts for an action against
 * both the identifier (email/phone) and the caller's IP.
 */
function throttle(string $action, string $identifier, int $limit, int $windowMinutes): void
{
    $since = gmdate('Y-m-d H:i:s', time() - $windowMinutes * 60);

    $byId = db_one(
        'SELECT COUNT(*) AS c FROM auth_attempts
         WHERE action = ? AND identifier = ? AND created_at > ?',
        [$action, $identifier, $since]
    );
    $byIp = db_one(
        'SELECT COUNT(*) AS c FROM auth_attempts
         WHERE action = ? AND ip = ? AND created_at > ?',
        [$action, client_ip(), $since]
    );

    if ((int) ($byId['c'] ?? 0) >= $limit || (int) ($byIp['c'] ?? 0) >= $limit * 3) {
        fail('Too many attempts. Please wait a few minutes and try again.', 429);
    }
}

function record_attempt(string $action, string $identifier, bool $successful): void
{
    db_run(
        'INSERT INTO auth_attempts (action, identifier, ip, successful, created_at)
         VALUES (?, ?, ?, ?, ?)',
        [$action, $identifier, client_ip(), $successful ? 1 : 0, now()]
    );
}

/** Removes expired sessions, codes and old attempt records. */
function prune_expired(): void
{
    db_run('DELETE FROM sessions WHERE expires_at < ?', [now()]);
    db_run('DELETE FROM verifications WHERE expires_at < ? AND used_at IS NULL', [now()]);
    db_run('DELETE FROM password_resets WHERE expires_at < ? AND used_at IS NULL', [now()]);
    db_run('DELETE FROM auth_attempts WHERE created_at < ?', [gmdate('Y-m-d H:i:s', time() - 86400)]);
}
