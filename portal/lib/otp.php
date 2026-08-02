<?php
/**
 * One-time codes for setting a password.
 *
 * The rule this exists to enforce: an admin can grant someone access, but
 * never holds their password. Creating an account or resetting one issues a
 * code to that person's own address, and only they can complete it.
 */

declare(strict_types=1);

/** How long a code is good for. Long enough to find the email, short enough. */
const OTP_MINUTES = 20;

/** Guesses allowed before the code is burned. */
const OTP_MAX_ATTEMPTS = 5;

/**
 * Issues a code and emails it.
 *
 * Any code still outstanding for the user is spent first, so asking again
 * always invalidates the previous email rather than leaving two codes live.
 */
function otp_issue(array $user, string $purpose = 'reset', ?string $issuedBy = null): void
{
    db_run(
        'UPDATE password_otps SET used_at = ? WHERE user_id = ? AND used_at IS NULL',
        [now(), $user['id']]
    );

    // Six digits, zero-padded, from a cryptographic source.
    $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

    db_run(
        'INSERT INTO password_otps
           (id, user_id, code_hash, purpose, issued_by, expires_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)',
        [new_id(), $user['id'], hash('sha256', $code), $purpose, $issuedBy,
         minutes_from_now(OTP_MINUTES), now()]
    );

    audit($issuedBy, $purpose === 'invite' ? 'otp_invite_sent' : 'otp_reset_sent', 'user', $user['id']);

    $site = rtrim(cresta_config()['site_url'], '/');
    $intro = $purpose === 'invite'
        ? "An account has been created for you at Cresta Marine."
        : "A password reset was requested for your Cresta Marine account.";

    send_email(
        $user['email'],
        $purpose === 'invite' ? 'Your My Cresta account' : 'Your My Cresta password reset code',
        "Hello {$user['full_name']},\n\n{$intro}\n\n"
        . "Your one-time code is: {$code}\n\n"
        . "Enter it here to choose your password:\n{$site}/set-password\n\n"
        . "The code expires in " . OTP_MINUTES . " minutes and can be used once.\n"
        . "If you were not expecting this, you can ignore this email — nothing changes until the code is used.\n\n"
        . "Cresta Marine"
    );
}

/**
 * Checks a code and, if it holds, sets the new password.
 *
 * Deliberately gives one message for every failure. Saying "no such account"
 * or "wrong code" separately tells someone probing which addresses exist.
 *
 * @return bool true when the password was changed
 */
function otp_redeem(string $email, string $code, string $password): bool
{
    $user = find_user_by_email(normalise_email($email));
    if (!$user) {
        return false;
    }

    $row = db_one(
        'SELECT * FROM password_otps
          WHERE user_id = ? AND used_at IS NULL AND expires_at > ?
          ORDER BY created_at DESC LIMIT 1',
        [$user['id'], now()]
    );
    if (!$row) {
        return false;
    }

    if ((int) $row['attempts'] >= OTP_MAX_ATTEMPTS) {
        // Burn it rather than leaving a hot code sitting there.
        db_run('UPDATE password_otps SET used_at = ? WHERE id = ?', [now(), $row['id']]);
        audit($user['id'], 'otp_attempts_exhausted', 'user', $user['id']);
        return false;
    }

    if (!hash_equals($row['code_hash'], hash('sha256', trim($code)))) {
        db_run('UPDATE password_otps SET attempts = attempts + 1 WHERE id = ?', [$row['id']]);
        return false;
    }

    db_run('UPDATE password_otps SET used_at = ? WHERE id = ?', [now(), $row['id']]);
    db_run(
        'UPDATE users
            SET password_hash = ?, email_verified_at = COALESCE(email_verified_at, ?), updated_at = ?
          WHERE id = ?',
        [password_hash($password, PASSWORD_DEFAULT), now(), now(), $user['id']]
    );

    // Everything signed in with the old password is turned out. A reset is
    // what someone does when they think an account is compromised.
    db_run('DELETE FROM sessions WHERE user_id = ?', [$user['id']]);

    audit($user['id'], 'password_set_via_otp', 'user', $user['id'], ['purpose' => $row['purpose']]);
    return true;
}

/** Clears codes that are spent or long expired. */
function otp_prune(): void
{
    db_run(
        'DELETE FROM password_otps WHERE used_at IS NOT NULL OR expires_at < ?',
        [gmdate('Y-m-d H:i:s', time() - 86400)]
    );
}
