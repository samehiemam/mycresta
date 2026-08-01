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
    __DIR__ . '/../../portal/lib',   // repo layout (public/ + portal/)
    __DIR__ . '/../../../portal/lib', // server layout (public_html/ + portal/)
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
    echo json_encode(['ok' => false, 'error' => 'Portal library not found.']);
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

        if (find_user_by_email($email)) {
            // Do not disclose that the address is taken; the owner gets an email.
            $existing = find_user_by_email($email);
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
        send_email_code($user, issue_code($id, 'email', $email));
        $smsSent = send_sms_code($user, issue_code($id, 'phone', $phone));
        notify_admin_of_registration($user);
        audit($id, 'register', 'user', $id, ['requestedRole' => $role]);

        json_out([
            'ok'        => true,
            'userId'    => $id,
            'smsSent'   => $smsSent,
            'next'      => 'verify',
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

    // ------------------------------------------------- send / resend a code ---
    case 'send-code': {
        $user = require_user();
        $channel = field($data, 'channel', 10);
        if (!in_array($channel, ['email', 'phone'], true)) {
            fail('Unknown verification channel.', 422);
        }
        if ($channel === 'email' && $user['email_verified_at']) {
            json_out(['ok' => true, 'alreadyVerified' => true]);
        }
        if ($channel === 'phone' && $user['phone_verified_at']) {
            json_out(['ok' => true, 'alreadyVerified' => true]);
        }

        throttle('send-code', $user['id'] . ':' . $channel, 5, 60);
        record_attempt('send-code', $user['id'] . ':' . $channel, true);

        if ($channel === 'email') {
            send_email_code($user, issue_code($user['id'], 'email', $user['email']));
            json_out(['ok' => true, 'sent' => true]);
        }

        $sent = send_sms_code($user, issue_code($user['id'], 'phone', $user['phone']));
        json_out(['ok' => true, 'sent' => $sent, 'manualReview' => !$sent]);
    }

    // --------------------------------------------------------- verify code ---
    case 'verify': {
        $user = require_user();
        $channel = field($data, 'channel', 10);
        $code = preg_replace('/\D+/', '', field($data, 'code', 10)) ?? '';

        if (!in_array($channel, ['email', 'phone'], true)) {
            fail('Unknown verification channel.', 422);
        }
        throttle('verify', $user['id'] . ':' . $channel, 10, 15);
        record_attempt('verify', $user['id'] . ':' . $channel, false);

        if ($code === '' || !consume_code($user['id'], $channel, $code)) {
            fail('That code is not valid or has expired. Request a new one.', 422);
        }

        audit($user['id'], 'verify_' . $channel, 'user', $user['id']);
        $fresh = find_user($user['id']);
        json_out([
            'ok'     => true,
            'user'   => public_user($fresh),
            'active' => is_active($fresh),
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
