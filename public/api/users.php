<?php
/**
 * User administration. Admin only (section 3.2: User Management is Full for
 * Admin and None for everyone else).
 *
 * No endpoint here accepts a password. An admin grants access; the person
 * themselves chooses what they sign in with, via a one-time code sent to their
 * own address. That way a compromised admin session cannot walk off with
 * working credentials for anyone.
 */

declare(strict_types=1);

$libCandidates = [
    __DIR__ . '/../../portal/lib',
    __DIR__ . '/../../../portal/lib',
    __DIR__ . '/../portal/lib',
];
foreach ($libCandidates as $lib) {
    if (is_dir($lib)) {
        require_once $lib . '/bootstrap.php';
        require_once $lib . '/otp.php';
        break;
    }
}
if (!function_exists('db')) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['ok' => false, 'error' => 'The portal is not installed on this server yet.']);
    exit;
}

$action = $_GET['action'] ?? 'list';

if ($action !== 'list') {
    require_method('POST');
    require_csrf();
}
$data = body();

/** Every action here needs full User Management. */
$admin = require_can('user_management', 'full');

/** Admins still standing if this one is removed or demoted. */
function other_admin_count(string $excludingId): int
{
    $row = db_one(
        "SELECT COUNT(*) AS c FROM users
          WHERE role = 'admin' AND status = 'approved' AND id <> ?",
        [$excludingId]
    );
    return (int) ($row['c'] ?? 0);
}

/** One user, with everything the admin screen shows. */
function admin_user_row(array $u): array
{
    return [
        'id'            => $u['id'],
        'email'         => $u['email'],
        'fullName'      => $u['full_name'],
        'phone'         => $u['phone'],
        'role'          => $u['role'],
        'requestedRole' => $u['requested_role'],
        'status'        => $u['status'],
        'company'       => $u['company'],
        'message'       => $u['message'],
        'scopes'        => array_column(
            db_all('SELECT scope FROM user_scopes WHERE user_id = ?', [$u['id']]),
            'scope'
        ),
        'emailVerified' => $u['email_verified_at'] !== null,
        'hasPassword'   => !empty($u['password_hash']),
        'lastLoginAt'   => $u['last_login_at'],
        'createdAt'     => $u['created_at'],
        // Whether a code is currently outstanding, so the screen can say so
        // rather than an admin resending blindly.
        'otpPending'    => (bool) db_one(
            'SELECT id FROM password_otps WHERE user_id = ? AND used_at IS NULL AND expires_at > ?',
            [$u['id'], now()]
        ),
    ];
}

switch ($action) {
    case 'list': {
        $rows = db_all(
            "SELECT * FROM users
              ORDER BY CASE status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
                       created_at DESC
              LIMIT 1000"
        );
        json_out([
            'ok'     => true,
            'users'  => array_map('admin_user_row', $rows),
            'roles'  => ROLES,
            'scopes' => SCOPES,
            'me'     => $admin['id'],
        ]);
    }

    case 'create': {
        $email = normalise_email(field($data, 'email'));
        $name  = field($data, 'fullName');
        $phone = normalise_phone(field($data, 'phone', 32));
        $role  = field($data, 'role', 20);

        if ($name === '' || !valid_email($email)) {
            fail('A name and a valid email address are required.', 422);
        }
        if (!in_array($role, ROLES, true)) {
            fail('Unknown role.', 422);
        }
        if (find_user_by_email($email)) {
            fail('An account already uses that email address.', 409);
        }

        $id = new_id();
        db_run(
            'INSERT INTO users
               (id, email, password_hash, full_name, phone, role, requested_role, status,
                email_verified_at, created_at, updated_at)
             VALUES (?, ?, NULL, ?, ?, ?, ?, ?, NULL, ?, ?)',
            [$id, $email, $name, $phone, $role, $role, 'approved', now(), now()]
        );

        foreach (array_intersect((array) ($data['scopes'] ?? []), SCOPES) as $scope) {
            db_run(
                'INSERT INTO user_scopes (user_id, scope, granted_by, created_at) VALUES (?, ?, ?, ?)',
                [$id, $scope, $admin['id'], now()]
            );
        }

        audit($admin['id'], 'user_created', 'user', $id, ['role' => $role, 'email' => $email]);

        // No password is set here. The code is what turns this into a login.
        otp_issue(find_user($id), 'invite', $admin['id']);

        json_out(['ok' => true, 'user' => admin_user_row(find_user($id))]);
    }

    case 'update': {
        $id = field($data, 'id', 32);
        $target = find_user($id);
        if (!$target) {
            fail('That account does not exist.', 404);
        }

        $role = field($data, 'role', 20) ?: $target['role'];
        $status = field($data, 'status', 20) ?: $target['status'];

        if (!in_array($role, ROLES, true)) {
            fail('Unknown role.', 422);
        }
        if (!in_array($status, ['pending', 'approved', 'rejected', 'disabled'], true)) {
            fail('Unknown status.', 422);
        }

        // Locking yourself out is the classic way to lose a system. Both of
        // these are refused even for an admin acting on their own account.
        $losingAdmin = $target['role'] === 'admin'
            && ($role !== 'admin' || $status !== 'approved');
        if ($losingAdmin && other_admin_count($id) === 0) {
            fail('This is the last active admin. Promote someone else first.', 409);
        }

        db_run(
            'UPDATE users SET full_name = ?, phone = ?, role = ?, status = ?, updated_at = ? WHERE id = ?',
            [
                field($data, 'fullName') ?: $target['full_name'],
                normalise_phone(field($data, 'phone', 32)) ?: $target['phone'],
                $role, $status, now(), $id,
            ]
        );

        if (array_key_exists('scopes', $data)) {
            db_run('DELETE FROM user_scopes WHERE user_id = ?', [$id]);
            foreach (array_intersect((array) $data['scopes'], SCOPES) as $scope) {
                db_run(
                    'INSERT INTO user_scopes (user_id, scope, granted_by, created_at) VALUES (?, ?, ?, ?)',
                    [$id, $scope, $admin['id'], now()]
                );
            }
        }

        // A disabled account should not stay signed in on whatever it left open.
        if ($status !== 'approved') {
            db_run('DELETE FROM sessions WHERE user_id = ?', [$id]);
        }

        audit($admin['id'], 'user_updated', 'user', $id, [
            'role' => $role, 'status' => $status,
            'scopes' => array_values(array_intersect((array) ($data['scopes'] ?? []), SCOPES)),
        ]);

        json_out(['ok' => true, 'user' => admin_user_row(find_user($id))]);
    }

    case 'send-code': {
        $id = field($data, 'id', 32);
        $target = find_user($id);
        if (!$target) {
            fail('That account does not exist.', 404);
        }

        // Bounded so this cannot be used to bombard someone's inbox.
        throttle('otp_admin', $target['email'], 5, 30);
        record_attempt('otp_admin', $target['email'], true);

        otp_issue($target, empty($target['password_hash']) ? 'invite' : 'reset', $admin['id']);
        json_out(['ok' => true, 'user' => admin_user_row(find_user($id))]);
    }

    case 'delete': {
        $id = field($data, 'id', 32);
        $target = find_user($id);
        if (!$target) {
            fail('That account does not exist.', 404);
        }
        if ($id === $admin['id']) {
            fail('You cannot delete your own account.', 409);
        }
        if ($target['role'] === 'admin' && other_admin_count($id) === 0) {
            fail('This is the last active admin. Promote someone else first.', 409);
        }

        // Records belonging to the person go; records about the business stay.
        // The audit trail in particular outlives the account, because it is
        // what a dispute is settled from.
        db_run('DELETE FROM user_scopes WHERE user_id = ?', [$id]);
        db_run('DELETE FROM sessions WHERE user_id = ?', [$id]);
        db_run('DELETE FROM verifications WHERE user_id = ?', [$id]);
        db_run('DELETE FROM password_resets WHERE user_id = ?', [$id]);
        db_run('DELETE FROM password_otps WHERE user_id = ?', [$id]);
        db_run('DELETE FROM invitations WHERE user_id = ?', [$id]);
        db_run('UPDATE public_builds SET user_id = NULL WHERE user_id = ?', [$id]);
        db_run('UPDATE configurations SET shared_with = NULL WHERE shared_with = ?', [$id]);
        db_run('DELETE FROM users WHERE id = ?', [$id]);

        audit($admin['id'], 'user_deleted', 'user', $id, [
            'email' => $target['email'], 'role' => $target['role'],
        ]);

        json_out(['ok' => true]);
    }

    default:
        fail('Unknown action.', 404);
}
