<?php
/**
 * Cresta Marine portal configuration.
 *
 * Copy this file to `config.php` on the server and fill in the values.
 * `config.php` is gitignored — never commit real credentials.
 *
 * IMPORTANT: this whole `portal/` directory must live OUTSIDE public_html,
 * or at minimum config.php must not be web-readable. See DEPLOY-PORTAL.md.
 */

return [
    'db' => [
        'host' => 'localhost',
        'name' => 'REPLACE_WITH_DB_NAME',
        'user' => 'REPLACE_WITH_DB_USER',
        'pass' => 'REPLACE_WITH_DB_PASSWORD',
    ],

    // Absolute path to private file storage (invoices, documents).
    // Must NOT be inside public_html.
    'storage_path' => __DIR__ . '/storage',

    'mail' => [
        'from'      => 'no-reply@crestamarine.com',
        'from_name' => 'Cresta Marine',
        // Where account notifications (new registrations) are sent.
        'admin'     => 'admin@crestamarine.com',
    ],

    /**
     * How the mobile verification code is delivered.
     *
     *   'manual'  — no SMS provider. The code is recorded for staff, who confirm
     *               the number by WhatsApp/phone. Works with zero setup or cost.
     *   'http'    — POST to an SMS gateway. Fill in `sms.endpoint` and the
     *               credentials your provider gives you.
     *
     * Start on 'manual'; switch to 'http' once you have a provider.
     */
    'sms' => [
        'driver'   => 'manual',
        'endpoint' => '',
        'token'    => '',
        'sender'   => 'CrestaMarine',
    ],

    // Register at /register with one of these addresses and confirm the emailed
    // code — the account is then promoted to admin automatically. Every other
    // role is granted by an admin inside the portal.
    'admin_emails' => ['admin@crestamarine.com'],

    // Public site origin, used to build links in emails.
    'site_url' => 'https://www.crestamarine.com',
];
