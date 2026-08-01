<?php
/**
 * Delivery of verification codes and account emails.
 *
 * Mobile codes go through a pluggable driver so the portal works before you
 * have an SMS contract: 'manual' records the code for staff to confirm by
 * WhatsApp/phone, 'http' posts to a gateway once you have one.
 */

declare(strict_types=1);

require_once __DIR__ . '/db.php';

function send_email(string $to, string $subject, string $body): bool
{
    $mail = cresta_config()['mail'];
    $from = $mail['from'];
    $name = $mail['from_name'];

    $headers = "From: {$name} <{$from}>\r\n"
        . "Reply-To: {$from}\r\n"
        . "Content-Type: text/plain; charset=utf-8\r\n"
        . "MIME-Version: 1.0\r\n";

    return @mail($to, $subject, $body, $headers);
}

function send_email_code(array $user, string $code): void
{
    $body = "Hello {$user['full_name']},\n\n"
        . "Your Cresta Marine verification code is:\n\n"
        . "    {$code}\n\n"
        . "It expires in 15 minutes. If you did not request it, you can ignore this email.\n\n"
        . "Cresta Marine";
    send_email($user['email'], 'Your Cresta Marine verification code', $body);
}

/**
 * Returns true when the code was actually dispatched to the handset.
 * Under the 'manual' driver it returns false: the account still works, but a
 * member of staff has to confirm the number.
 */
function send_sms_code(array $user, string $code): bool
{
    $sms = cresta_config()['sms'];

    if (($sms['driver'] ?? 'manual') !== 'http' || empty($sms['endpoint'])) {
        // No gateway configured. The hashed code is already stored; flag it for
        // staff so they can confirm the number out of band.
        audit($user['id'], 'phone_code_pending_manual', 'user', $user['id'], [
            'phone' => $user['phone'],
        ]);
        return false;
    }

    $payload = [
        'to'      => $user['phone'],
        'sender'  => $sms['sender'] ?? 'CrestaMarine',
        'message' => "Your Cresta Marine code is {$code}. It expires in 15 minutes.",
    ];

    $ch = curl_init($sms['endpoint']);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 10,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . ($sms['token'] ?? ''),
        ],
        CURLOPT_POSTFIELDS     => json_encode($payload),
    ]);
    $response = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $delivered = $response !== false && $status >= 200 && $status < 300;
    if (!$delivered) {
        audit($user['id'], 'phone_code_send_failed', 'user', $user['id'], ['status' => $status]);
    }
    return $delivered;
}

function notify_admin_of_registration(array $user): void
{
    $mail = cresta_config()['mail'];
    $body = "A new My Cresta registration is awaiting review.\n\n"
        . "Name:  {$user['full_name']}\n"
        . "Email: {$user['email']}\n"
        . "Phone: {$user['phone']}\n"
        . "Role requested: {$user['requested_role']}\n"
        . ($user['company'] ? "Company: {$user['company']}\n" : '')
        . "\nApprove or reject in the portal.";
    send_email($mail['admin'], 'New My Cresta registration', $body);
}

function send_reset_link(array $user, string $token): void
{
    $url = rtrim(cresta_config()['site_url'], '/') . '/reset-password?token=' . urlencode($token);
    $body = "Hello {$user['full_name']},\n\n"
        . "Use this link to set a new Cresta Marine password:\n\n"
        . "    {$url}\n\n"
        . "The link expires in 60 minutes and can be used once.\n"
        . "If you did not ask to reset your password, ignore this email — nothing has changed.\n\n"
        . "Cresta Marine";
    send_email($user['email'], 'Reset your Cresta Marine password', $body);
}
