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
    return send_email_detailed($to, $subject, $body)['ok'];
}

/**
 * Sends a message and says exactly what happened.
 *
 * Delivery failures used to be invisible: mail() returns a bare boolean, and
 * "true" only means the local mail system took the message — not that anyone
 * received it. Every send is now recorded with its transport and outcome, so a
 * missing email is a question the audit log can answer.
 *
 * @return array{ok:bool,transport:string,error:?string,transcript:string[]}
 */
function send_email_detailed(string $to, string $subject, string $body): array
{
    $config = cresta_config();
    $mail = $config['mail'];
    $smtp = $config['smtp'] ?? [];

    // SMTP only once there is something to authenticate with. A host on its
    // own would take over sending and fail every message; without credentials
    // the local transport is still the better of two imperfect options.
    if (!empty($smtp['host']) && !empty($smtp['user']) && !empty($smtp['pass'])) {
        foreach ([__DIR__ . '/smtp.php'] as $lib) {
            if (is_file($lib)) {
                require_once $lib;
            }
        }
        $result = smtp_send(
            $smtp + [
                'from'      => $mail['from'],
                'from_name' => $mail['from_name'],
                'site_url'  => $config['site_url'],
            ],
            $to,
            $subject,
            $body
        );
        $out = [
            'ok'         => $result['ok'],
            'transport'  => 'smtp:' . $smtp['host'],
            'error'      => $result['error'],
            'transcript' => $result['transcript'],
        ];
    } else {
        // The fallback. Fine for external addresses; unreliable for the site's
        // own domain, which the local mail system may claim as its own.
        $headers = "From: {$mail['from_name']} <{$mail['from']}>\r\n"
            . "Reply-To: {$mail['from']}\r\n"
            . "Content-Type: text/plain; charset=utf-8\r\n"
            . "MIME-Version: 1.0\r\n";
        $accepted = @mail($to, $subject, $body, $headers);
        $out = [
            'ok'         => $accepted,
            'transport'  => 'php-mail',
            'error'      => $accepted ? null : 'The local mail system refused the message.',
            'transcript' => [],
        ];
    }

    // Recorded whichever way it went, so "did it even try?" is answerable.
    try {
        audit(null, $out['ok'] ? 'email_sent' : 'email_failed', 'email', null, [
            'to'        => $to,
            'subject'   => $subject,
            'transport' => $out['transport'],
            'error'     => $out['error'],
        ]);
    } catch (Throwable) {
        // Never let logging a send break the send.
    }

    return $out;
}

function send_confirmation_link(array $user, string $token): void
{
    $url = rtrim(cresta_config()['site_url'], '/') . '/confirm-email?token=' . urlencode($token);
    $body = "Hello {$user['full_name']},\n\n"
        . "Please confirm your email address for My Cresta:\n\n"
        . "    {$url}\n\n"
        . "The link works for 24 hours. If you did not create an account, ignore this email.\n\n"
        . "Cresta Marine";

    // mail() only reports the hand-off to the local mailer, never delivery —
    // but a false here is a definite failure worth seeing.
    $accepted = send_email($user['email'], 'Confirm your email address', $body);
    audit($user['id'], $accepted ? 'confirmation_email_accepted' : 'confirmation_email_failed',
        'user', $user['id'], ['to' => $user['email']]);
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

/**
 * Tells the people who work house leads that a visitor built a boat.
 *
 * FR-LEAD-030: a build with no ambassador behind it belongs to Cresta, so it
 * goes to the admin address rather than to nobody.
 */
function notify_build_received(string $buildId, string $modelKey, string $email): void
{
    $config = cresta_config();
    $link = rtrim($config['site_url'], '/') . '/portal/builds/' . $buildId;

    send_email(
        $config['mail']['admin'],
        "New Kumbra {$modelKey} configuration from the website",
        "A visitor finished a configuration on the public site and asked for a quote.\n\n"
        . "Model: Kumbra {$modelKey}\n"
        . ($email !== '' ? "Email: {$email}\n" : "Email: not given\n")
        . "\nOpen it with prices in My Cresta:\n{$link}\n\nCresta Marine"
    );
}

/**
 * FR-NOTIF-020: tells the owning ambassador that their lead moved.
 *
 * Silent for a house lead — there is nobody whose deal it is — and silent for
 * a stage nobody needs woken up about.
 */
function notify_lead_stage(array $lead, string $stage): void
{
    if (empty($lead['ambassador_id'])) {
        return;
    }
    $watched = ['config_shared', 'quote_sent', 'reserved', 'contract_signed', 'delivered', 'closed_lost'];
    if (!in_array($stage, $watched, true)) {
        return;
    }

    $ambassador = find_user($lead['ambassador_id']);
    if (!$ambassador) {
        return;
    }

    $label = LEAD_STAGES[$stage] ?? $stage;
    $site = rtrim(cresta_config()['site_url'], '/');

    send_email(
        $ambassador['email'],
        "{$lead['full_name']} — {$label}",
        "Hello {$ambassador['full_name']},\n\n"
        . "Your lead {$lead['full_name']} has moved to: {$label}.\n\n"
        . ($stage === 'delivered'
            ? "This deal has been delivered, so your commission is now pending review.\n\n"
            : '')
        . "See it in My Cresta:\n{$site}/portal/leads/{$lead['id']}\n\nCresta Marine"
    );
}
