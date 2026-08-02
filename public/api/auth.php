<?php
/**
 * My Cresta authentication API.
 *
 * Single entry point: POST /api/auth.php?action=<name> with a JSON body.
 * The portal library lives outside the web root; only this file is public.
 */

declare(strict_types=1);

// portal/ sits next to public_html on the server. Both layouts are tried so
// the same file works locally and on Hostinger.
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

$action = $_GET['action'] ?? '';

// A GET that hands the browser its CSRF token and current user.
if ($action === 'session') {
    $user = current_user();
    json_out([
        'ok'        => true,
        'csrfToken' => csrf_token(),
        'user'      => $user ? public_user($user) : null,
        'active'    => $user ? is_active($user) : false,
    ]);
}

require_method('POST');
require_csrf();
prune_expired();
$data = body();

switch ($action) {

    // ------------------------------------------------------------ register ---
    case 'register': {
        $email = normalise_email(field($data, 'email'));
        $phone = normalise_phone(field($data, 'phone', 32));
        $name  = field($data, 'fullName');
        $password = (string) ($data['password'] ?? '');
        $role  = field($data, 'role', 20) ?: 'customer';
        $company = field($data, 'company');
        $message = field($data, 'message', 2000);

        // Honeypot: bots fill the hidden field. Look successful, store nothing.
        if (field($data, 'website') !== '') {
            json_out(['ok' => true, 'pending' => true]);
        }

        if ($name === '' || !valid_email($email) || !valid_phone($phone)) {
            fail('Please enter your name, a valid email address and a valid mobile number.', 422);
        }
        if (!in_array($role, SELF_SERVICE_ROLES, true)) {
            // Staff accounts are created by an admin, never self-requested.
            fail('That account type is not available for self-registration.', 422);
        }
        if ($problem = password_problem($password)) {
            fail($problem, 422);
        }

        throttle('register', $email, 5, 60);
        record_attempt('register', $email, false);

        if ($existing = find_user_by_email($email)) {
            // The configured admin may already have signed up before email
            // delivery worked; let the bootstrap finish that account rather
            // than leaving it stranded as pending.
            if (autoconfirm_admin_if_enabled($existing)) {
                json_out(['ok' => true, 'autoconfirmed' => true, 'next' => 'login']);
            }

            // Otherwise do not disclose that the address is taken; the owner
            // gets an email instead.
            send_email(
                $email,
                'A registration attempt used your email',
                "Hello,\n\nSomeone tried to register at Cresta Marine with this email address, "
                . "which already has an account.\n\nIf that was you, sign in instead, or use "
                . "'Forgot password' to regain access.\n\nCresta Marine"
            );
            json_out(['ok' => true, 'pending' => true]);
        }

        $id = new_id();
        db_run(
            'INSERT INTO users
              (id, email, password_hash, full_name, phone, role, requested_role, status,
               company, message, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                $id,
                $email,
                password_hash($password, PASSWORD_DEFAULT),
                $name,
                $phone,
                'customer',      // granted role stays customer until an admin says otherwise
                $role,           // what they asked for
                'pending',
                $company ?: null,
                $message ?: null,
                now(),
                now(),
            ]
        );

        $user = find_user($id);
        send_confirmation_link($user, issue_link_token($id, $email));
        notify_admin_of_registration($user);
        audit($id, 'register', 'user', $id, ['requestedRole' => $role]);

        // Lets the configured admin in while email delivery is still unproven.
        $autoconfirmed = autoconfirm_admin_if_enabled($user);

        json_out([
            'ok'            => true,
            'userId'        => $id,
            'autoconfirmed' => $autoconfirmed,
            'next'          => $autoconfirmed ? 'login' : 'confirm-email',
        ]);
    }

    // --------------------------------------------------------------- login ---
    case 'login': {
        $email = normalise_email(field($data, 'email'));
        $password = (string) ($data['password'] ?? '');

        if ($email === '' || $password === '') {
            fail('Enter your email address and password.', 422);
        }

        throttle('login', $email, 8, 15);

        $user = find_user_by_email($email);
        // Always run a hash comparison so the response time does not reveal
        // whether the account exists.
        $hash = $user['password_hash'] ?? '$2y$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin';
        $okPassword = password_verify($password, $hash);

        if (!$user || !$okPassword) {
            record_attempt('login', $email, false);
            fail('That email address and password do not match.', 401);
        }
        if ($user['status'] === 'disabled') {
            record_attempt('login', $email, false);
            fail('This account has been disabled. Please contact Cresta Marine.', 403);
        }

        record_attempt('login', $email, true);
        db_run('UPDATE users SET last_login_at = ? WHERE id = ?', [now(), $user['id']]);
        create_session($user['id']);
        audit($user['id'], 'login', 'user', $user['id']);

        // The configured admin may have registered before the bootstrap was
        // set up correctly. Finishing that account here means signing in is
        // enough to recover it — no second registration attempt needed.
        autoconfirm_admin_if_enabled($user);

        $fresh = find_user($user['id']);
        json_out([
            'ok'     => true,
            'user'   => public_user($fresh),
            'active' => is_active($fresh),
        ]);
    }

    // -------------------------------------------------------------- logout ---
    case 'logout': {
        $user = current_user();
        destroy_session();
        if ($user) {
            audit($user['id'], 'logout', 'user', $user['id']);
        }
        json_out(['ok' => true]);
    }

    // --------------------------------------------- resend the confirmation ---
    case 'resend-confirmation': {
        $user = require_user();
        if (!empty($user['email_verified_at'])) {
            json_out(['ok' => true, 'alreadyVerified' => true]);
        }
        throttle('resend-confirmation', $user['id'], 5, 60);
        record_attempt('resend-confirmation', $user['id'], true);

        send_confirmation_link($user, issue_link_token($user['id'], $user['email']));
        json_out(['ok' => true, 'sent' => true]);
    }

    // ------------------------------------------- confirm from an email link ---
    case 'confirm-email': {
        $token = field($data, 'token', 128);
        throttle('confirm-email', substr($token, 0, 32), 10, 60);
        record_attempt('confirm-email', substr($token, 0, 32), false);

        $user = consume_link_token($token);
        if (!$user) {
            fail('That confirmation link has expired or was already used. Sign in to request a new one.', 422);
        }

        audit($user['id'], 'verify_email', 'user', $user['id']);
        // Deliberately not 'user': confirming from an emailed link does not
        // sign anyone in, and the browser must not believe it has a session.
        json_out([
            'ok'      => true,
            'account' => public_user($user),
            'active'  => is_active($user),
        ]);
    }

    // ------------------------------------------------------ forgot password ---
    case 'forgot-password': {
        $email = normalise_email(field($data, 'email'));
        throttle('forgot', $email, 5, 60);
        record_attempt('forgot', $email, true);

        $user = find_user_by_email($email);
        if ($user) {
            $token = bin2hex(random_bytes(32));
            db_run(
                'INSERT INTO password_resets (id, user_id, token_hash, created_at, expires_at)
                 VALUES (?, ?, ?, ?, ?)',
                [new_id(), $user['id'], hash('sha256', $token), now(), minutes_from_now(RESET_TTL_MINUTES)]
            );
            send_reset_link($user, $token);
            audit($user['id'], 'password_reset_requested', 'user', $user['id']);
        }

        // Same answer either way, so the endpoint cannot be used to discover
        // which email addresses have accounts.
        json_out(['ok' => true, 'sent' => true]);
    }

    // ------------------------------------------------------- reset password ---
    case 'reset-password': {
        $token = field($data, 'token', 128);
        $password = (string) ($data['password'] ?? '');

        if ($problem = password_problem($password)) {
            fail($problem, 422);
        }
        throttle('reset', substr($token, 0, 32), 10, 60);
        record_attempt('reset', substr($token, 0, 32), false);

        $row = db_one(
            'SELECT * FROM password_resets
             WHERE token_hash = ? AND used_at IS NULL AND expires_at > ? LIMIT 1',
            [hash('sha256', $token), now()]
        );
        if (!$row) {
            fail('That reset link has expired. Please request a new one.', 422);
        }

        db_run('UPDATE password_resets SET used_at = ? WHERE id = ?', [now(), $row['id']]);
        db_run(
            'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?',
            [password_hash($password, PASSWORD_DEFAULT), now(), $row['user_id']]
        );
        // Signing in again everywhere is required after a reset.
        db_run('DELETE FROM sessions WHERE user_id = ?', [$row['user_id']]);
        audit($row['user_id'], 'password_reset_completed', 'user', $row['user_id']);

        json_out(['ok' => true]);
    }

    default:
        fail('Unknown action.', 404);
}
