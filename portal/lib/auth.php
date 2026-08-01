<?php
/** Accounts, sessions, verification codes and role checks. */

declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/http.php';

const ROLES = ['customer', 'employee', 'ambassador', 'admin'];
const SELF_SERVICE_ROLES = ['customer', 'ambassador']; // staff are created by an admin
const SESSION_DAYS = 30;
const CODE_TTL_MINUTES = 15;
const RESET_TTL_MINUTES = 60;

// ------------------------------------------------------------- validation ---

function normalise_email(string $email): string
{
    return mb_strtolower(trim($email));
}

function valid_email(string $email): bool
{
    return (bool) filter_var($email, FILTER_VALIDATE_EMAIL);
}

/** Keeps a leading + and digits only, so numbers compare consistently. */
function normalise_phone(string $phone): string
{
    $trimmed = trim($phone);
    $plus = str_starts_with($trimmed, '+');
    $digits = preg_replace('/\D+/', '', $trimmed) ?? '';
    if ($digits === '') {
        return '';
    }
    return ($plus ? '+' : '') . $digits;
}

function valid_phone(string $phone): bool
{
    $digits = preg_replace('/\D+/', '', $phone) ?? '';
    return strlen($digits) >= 8 && strlen($digits) <= 15;
}

/**
 * Deliberately simple: length is what matters most. No composition rules that
 * push people towards predictable substitutions.
 */
function password_problem(string $password): ?string
{
    if (strlen($password) < 10) {
        return 'Use at least 10 characters.';
    }
    if (strlen($password) > 200) {
        return 'That password is too long.';
    }
    if (preg_match('/^\s+$/', $password)) {
        return 'Please choose a real password.';
    }
    return null;
}

// ------------------------------------------------------------------ users ---

function find_user_by_email(string $email): ?array
{
    return db_one('SELECT * FROM users WHERE email = ? LIMIT 1', [normalise_email($email)]);
}

function find_user(string $id): ?array
{
    return db_one('SELECT * FROM users WHERE id = ? LIMIT 1', [$id]);
}

/** The shape sent to the browser. Never includes the hash. */
function public_user(array $user): array
{
    return [
        'id'            => $user['id'],
        'email'         => $user['email'],
        'fullName'      => $user['full_name'],
        'phone'         => $user['phone'],
        'role'          => $user['role'],
        'requestedRole' => $user['requested_role'],
        'status'        => $user['status'],
        'company'       => $user['company'],
        'emailVerified' => !empty($user['email_verified_at']),
        'phoneVerified' => !empty($user['phone_verified_at']),
        'createdAt'     => $user['created_at'],
    ];
}

/** True once both channels are confirmed and an admin has approved the account. */
function is_active(array $user): bool
{
    return $user['status'] === 'approved'
        && !empty($user['email_verified_at'])
        && !empty($user['phone_verified_at']);
}

// --------------------------------------------------------------- sessions ---

function create_session(string $userId): string
{
    $token = bin2hex(random_bytes(32));
    db_run(
        'INSERT INTO sessions (id, user_id, ip, user_agent, created_at, last_seen_at, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
            hash('sha256', $token),
            $userId,
            client_ip(),
            mb_substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 255),
            now(),
            now(),
            gmdate('Y-m-d H:i:s', time() + SESSION_DAYS * 86400),
        ]
    );

    start_session();
    session_regenerate_id(true); // new id on privilege change, stops fixation
    $_SESSION['token'] = $token;
    return $token;
}

function destroy_session(): void
{
    start_session();
    $token = $_SESSION['token'] ?? null;
    if (is_string($token)) {
        db_run('DELETE FROM sessions WHERE id = ?', [hash('sha256', $token)]);
    }
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
    }
    session_destroy();
}

/** The signed-in user, or null. */
function current_user(): ?array
{
    start_session();
    $token = $_SESSION['token'] ?? null;
    if (!is_string($token) || $token === '') {
        return null;
    }

    $row = db_one(
        'SELECT u.* FROM sessions s
         JOIN users u ON u.id = s.user_id
         WHERE s.id = ? AND s.expires_at > ? LIMIT 1',
        [hash('sha256', $token), now()]
    );
    if (!$row) {
        return null;
    }
    if ($row['status'] === 'disabled') {
        return null;
    }

    db_run('UPDATE sessions SET last_seen_at = ? WHERE id = ?', [now(), hash('sha256', $token)]);
    return $row;
}

function require_user(): array
{
    $user = current_user();
    if (!$user) {
        fail('Please sign in.', 401);
    }
    return $user;
}

/** Requires a signed-in, verified, approved account in one of $roles. */
function require_role(array $roles): array
{
    $user = require_user();
    if (!is_active($user)) {
        fail('Your account is not active yet.', 403);
    }
    if (!in_array($user['role'], $roles, true)) {
        fail('You do not have access to this.', 403);
    }
    return $user;
}

// ---------------------------------------------------- verification codes ---

function issue_code(string $userId, string $channel, string $destination): string
{
    // 6 digits, generated from a CSPRNG.
    $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

    // Any earlier unused code for this channel stops working.
    db_run(
        'UPDATE verifications SET used_at = ? WHERE user_id = ? AND channel = ? AND used_at IS NULL',
        [now(), $userId, $channel]
    );
    db_run(
        'INSERT INTO verifications (id, user_id, channel, destination, code_hash, sent_at, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
            new_id(),
            $userId,
            $channel,
            $destination,
            password_hash($code, PASSWORD_DEFAULT),
            now(),
            minutes_from_now(CODE_TTL_MINUTES),
        ]
    );
    return $code;
}

/** Checks a submitted code. Returns true and marks it used on success. */
function consume_code(string $userId, string $channel, string $code): bool
{
    $row = db_one(
        'SELECT * FROM verifications
         WHERE user_id = ? AND channel = ? AND used_at IS NULL AND expires_at > ?
         ORDER BY sent_at DESC LIMIT 1',
        [$userId, $channel, now()]
    );
    if (!$row) {
        return false;
    }
    if ((int) $row['attempts'] >= 6) {
        return false; // burn it rather than allow guessing
    }

    db_run('UPDATE verifications SET attempts = attempts + 1 WHERE id = ?', [$row['id']]);

    if (!password_verify($code, $row['code_hash'])) {
        return false;
    }

    db_run('UPDATE verifications SET used_at = ? WHERE id = ?', [now(), $row['id']]);
    $column = $channel === 'email' ? 'email_verified_at' : 'phone_verified_at';
    db_run("UPDATE users SET {$column} = ?, updated_at = ? WHERE id = ?", [now(), now(), $userId]);
    return true;
}
