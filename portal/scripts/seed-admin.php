<?php
/**
 * Creates the first admin account — run once, from the command line.
 *
 *   php portal/scripts/seed-admin.php "admin@crestamarine.com" "Sameh Emam" "+201001000360"
 *
 * No password is set or asked for here. The account is created without one and
 * a single-use reset link is printed; open it to choose your own password.
 * That way no password is ever typed into a script, a log, or this repository.
 */

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit("This script may only be run from the command line.\n");
}

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/auth.php';

$email = normalise_email($argv[1] ?? '');
$name  = trim($argv[2] ?? '');
$phone = normalise_phone($argv[3] ?? '');

if (!valid_email($email) || $name === '' || !valid_phone($phone)) {
    exit("Usage: php seed-admin.php \"email\" \"Full Name\" \"+20…\"\n");
}

$existing = find_user_by_email($email);

if ($existing) {
    db_run(
        "UPDATE users SET role = 'admin', status = 'approved', updated_at = ? WHERE id = ?",
        [now(), $existing['id']]
    );
    $userId = $existing['id'];
    echo "Existing account promoted to admin: {$email}\n";
} else {
    $userId = new_id();
    db_run(
        'INSERT INTO users
          (id, email, password_hash, full_name, phone, role, requested_role, status,
           email_verified_at, phone_verified_at, created_at, updated_at)
         VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [$userId, $email, $name, $phone, 'admin', 'admin', 'approved', now(), now(), now(), now()]
    );
    echo "Admin account created: {$email}\n";
}

// Single-use link so the admin sets their own password.
$token = bin2hex(random_bytes(32));
db_run(
    'INSERT INTO password_resets (id, user_id, token_hash, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?)',
    [new_id(), $userId, hash('sha256', $token), now(), minutes_from_now(120)]
);

$site = rtrim(cresta_config()['site_url'], '/');
audit($userId, 'admin_seeded', 'user', $userId);

echo "\nOpen this link within 2 hours to set the password:\n\n";
echo "  {$site}/reset-password?token={$token}\n\n";
echo "Then delete this script from the server.\n";
