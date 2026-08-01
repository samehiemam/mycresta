<?php
/**
 * Account administration: approvals, role changes and staff creation.
 * Employees may review; only admins may grant roles or create staff.
 */

declare(strict_types=1);

$libCandidates = [
    __DIR__ . '/../../portal/lib',    // portal/ beside the project root (dev)
    __DIR__ . '/../../../portal/lib', // portal/ beside public_html (most secure)
    __DIR__ . '/../portal/lib',       // portal/ inside the web root (deployed by the build)
];
foreach ($libCandidates as $lib) {
    if (is_dir($lib)) {
        require_once $lib . '/bootstrap.php';
        break;
    }
}
if (!function_exists('db')) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'ok' => false,
        'error' => 'The portal is not installed on this server yet. '
            . 'Upload the portal folder and create portal/config.php — see DEPLOY-PORTAL.md.',
    ]);
    exit;
}

$action = $_GET['action'] ?? 'list';

if ($action === 'list') {
    require_role(['employee', 'admin']);
    $rows = db_all(
        "SELECT * FROM users
         ORDER BY CASE status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
                  created_at DESC
         LIMIT 500"
    );
    json_out(['ok' => true, 'users' => array_map('public_user', $rows)]);
}

require_method('POST');
require_csrf();
$data = body();

switch ($action) {

    /** Approve or reject a pending registration, optionally granting a role. */
    case 'review': {
        $actor = require_role(['employee', 'admin']);
        $id = field($data, 'id', 32);
        $decision = field($data, 'decision', 20);
        $grantRole = field($data, 'role', 20);

        if (!in_array($decision, ['approved', 'rejected', 'disabled'], true)) {
            fail('Unknown decision.', 422);
        }

        $target = find_user($id);
        if (!$target) {
            fail('Account not found.', 404);
        }
        if ($target['role'] === 'admin' && $actor['role'] !== 'admin') {
            fail('Only an admin can change an admin account.', 403);
        }

        // Employees can approve, but only an admin may hand out roles.
        $role = $target['role'];
        if ($grantRole !== '') {
            if ($actor['role'] !== 'admin') {
                fail('Only an admin can change a role.', 403);
            }
            if (!in_array($grantRole, ROLES, true)) {
                fail('Unknown role.', 422);
            }
            $role = $grantRole;
        } elseif ($decision === 'approved' && in_array($target['requested_role'], SELF_SERVICE_ROLES, true)) {
            // Approving an ambassador request grants that role.
            $role = $target['requested_role'];
        }

        db_run(
            'UPDATE users SET status = ?, role = ?, reviewed_by = ?, reviewed_at = ?, updated_at = ?
             WHERE id = ?',
            [$decision, $role, $actor['id'], now(), now(), $id]
        );

        // Without an SMS gateway the customer cannot receive a code, so staff
        // confirm the number out of band. Approving records that check.
        $smsDriver = cresta_config()['sms']['driver'] ?? 'manual';
        if ($decision === 'approved' && $smsDriver !== 'http' && empty($target['phone_verified_at'])) {
            db_run('UPDATE users SET phone_verified_at = ? WHERE id = ?', [now(), $id]);
            audit($actor['id'], 'phone_confirmed_manually', 'user', $id, ['phone' => $target['phone']]);
        }
        audit($actor['id'], 'account_' . $decision, 'user', $id, ['role' => $role]);

        if ($decision === 'approved') {
            send_email(
                $target['email'],
                'Your My Cresta account is approved',
                "Hello {$target['full_name']},\n\nYour My Cresta account has been approved. "
                . "You can now sign in at " . rtrim(cresta_config()['site_url'], '/') . "/login\n\nCresta Marine"
            );
        }

        json_out(['ok' => true]);
    }

    /** Admin-only: create an employee or ambassador account directly. */
    case 'create': {
        $actor = require_role(['admin']);
        $email = normalise_email(field($data, 'email'));
        $name  = field($data, 'fullName');
        $phone = normalise_phone(field($data, 'phone', 32));
        $role  = field($data, 'role', 20);

        if ($name === '' || !valid_email($email) || !valid_phone($phone)) {
            fail('Name, a valid email address and a valid mobile number are required.', 422);
        }
        if (!in_array($role, ['employee', 'ambassador', 'customer'], true)) {
            fail('Unknown role.', 422);
        }
        if (find_user_by_email($email)) {
            fail('An account with that email already exists.', 409);
        }

        $id = new_id();
        db_run(
            'INSERT INTO users
              (id, email, password_hash, full_name, phone, role, requested_role, status,
               email_verified_at, created_at, updated_at)
             VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?)',
            [$id, $email, $name, $phone, $role, $role, 'approved', now(), now(), now()]
        );

        // No password is chosen here — the new user sets their own.
        $token = bin2hex(random_bytes(32));
        db_run(
            'INSERT INTO password_resets (id, user_id, token_hash, created_at, expires_at)
             VALUES (?, ?, ?, ?, ?)',
            [new_id(), $id, hash('sha256', $token), now(), minutes_from_now(60 * 48)]
        );
        $url = rtrim(cresta_config()['site_url'], '/') . '/reset-password?token=' . urlencode($token);
        send_email(
            $email,
            'Your Cresta Marine account',
            "Hello {$name},\n\nAn account has been created for you at Cresta Marine.\n\n"
            . "Set your password here (valid for 48 hours):\n\n    {$url}\n\n"
            . "You will be asked to confirm your mobile number when you first sign in.\n\nCresta Marine"
        );
        audit($actor['id'], 'account_created', 'user', $id, ['role' => $role]);

        json_out(['ok' => true, 'id' => $id]);
    }

    default:
        fail('Unknown action.', 404);
}
