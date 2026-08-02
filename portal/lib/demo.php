<?php
/**
 * Demo accounts, one per role, plus enough sample data to exercise them.
 *
 * Seeding is idempotent: running it again resets the passwords and repairs the
 * roles rather than creating a second set. Every account is marked demo in its
 * name so nobody mistakes one for a customer, and they are meant to be removed
 * before launch — see demo_remove().
 */

declare(strict_types=1);

/** The accounts, and what each one is for. */
const DEMO_ACCOUNTS = [
    [
        'key'    => 'founder',
        'email'  => 'demo.founder@crestamarine.com',
        'name'   => 'Demo Founder',
        'role'   => 'admin',
        'scopes' => [],
        'covers' => 'Full control: catalog, pricing, discounts, shipping, users, every configuration.',
    ],
    [
        'key'    => 'advisor',
        'email'  => 'demo.advisor@crestamarine.com',
        'name'   => 'Demo Advisor',
        'role'   => 'employee',
        'scopes' => ['sales'],
        'covers' => 'Runs the pipeline and builds configurations. Sees prices and totals, never discounts or commission.',
    ],
    [
        'key'    => 'finance',
        'email'  => 'demo.finance@crestamarine.com',
        'name'   => 'Demo Finance',
        'role'   => 'employee',
        'scopes' => ['finance'],
        'covers' => 'Commission administration and documents. Reads the pipeline but cannot change it.',
    ],
    [
        'key'    => 'boatstaff',
        'email'  => 'demo.boatstaff@crestamarine.com',
        'name'   => 'Demo Boat Staff',
        'role'   => 'employee',
        'scopes' => ['boat_staff'],
        'covers' => 'Account and permissions exist; the dedicated boat tools are a later phase.',
    ],
    [
        'key'    => 'ambassador',
        'email'  => 'demo.ambassador@crestamarine.com',
        'name'   => 'Demo Ambassador',
        'role'   => 'ambassador',
        'scopes' => [],
        'covers' => 'Own leads and configurations only. Sees prices, never discounts or the commission base.',
    ],
    [
        'key'    => 'prospect',
        'email'  => 'demo.prospect@crestamarine.com',
        'name'   => 'Demo Prospect',
        'role'   => 'customer',
        'scopes' => [],
        'covers' => 'Views a configuration shared with them, comments, and sees their own website build.',
    ],
    [
        'key'    => 'owner',
        'email'  => 'demo.owner@crestamarine.com',
        'name'   => 'Demo Boat Owner',
        'role'   => 'customer',
        'scopes' => [],
        'covers' => 'Same login as a prospect. My Boats, documents and service history are not built yet.',
    ],
];

/** A readable password that is still too long to guess. */
function demo_password(): string
{
    $words = ['harbour', 'gouna', 'kumbra', 'marina', 'anchor', 'lagoon', 'delta', 'breeze'];
    return $words[random_int(0, count($words) - 1)]
        . '-' . $words[random_int(0, count($words) - 1)]
        . '-' . bin2hex(random_bytes(3));
}

/**
 * Creates or repairs the demo accounts and their sample data.
 *
 * @return array credentials, returned once — nothing stores the plaintext
 */
function demo_seed(?string $actorId = null): array
{
    $created = [];

    foreach (DEMO_ACCOUNTS as $spec) {
        $password = demo_password();
        $existing = find_user_by_email($spec['email']);

        if ($existing) {
            db_run(
                'UPDATE users
                    SET password_hash = ?, full_name = ?, role = ?, status = ?,
                        email_verified_at = COALESCE(email_verified_at, ?), updated_at = ?
                  WHERE id = ?',
                [
                    password_hash($password, PASSWORD_DEFAULT), $spec['name'], $spec['role'],
                    'approved', now(), now(), $existing['id'],
                ]
            );
            $id = $existing['id'];
        } else {
            $id = new_id();
            db_run(
                'INSERT INTO users
                   (id, email, password_hash, full_name, phone, role, requested_role, status,
                    email_verified_at, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    $id, $spec['email'], password_hash($password, PASSWORD_DEFAULT), $spec['name'],
                    '+20 100 000 0000', $spec['role'], $spec['role'], 'approved', now(), now(), now(),
                ]
            );
        }

        // Scopes are replaced, not merged, so a re-run repairs a wrong one.
        db_run('DELETE FROM user_scopes WHERE user_id = ?', [$id]);
        foreach ($spec['scopes'] as $scope) {
            db_run(
                'INSERT INTO user_scopes (user_id, scope, granted_by, created_at) VALUES (?, ?, ?, ?)',
                [$id, $scope, $actorId, now()]
            );
        }

        $created[$spec['key']] = [
            'email'    => $spec['email'],
            'password' => $password,
            'role'     => $spec['role'],
            'scopes'   => $spec['scopes'],
            'covers'   => $spec['covers'],
            'id'       => $id,
        ];
    }

    demo_sample_data($created);
    audit($actorId, 'demo_accounts_seeded', 'user', null, ['count' => count($created)]);

    return $created;
}

/**
 * Sample records so each account has something to look at.
 *
 * Kept small on purpose: enough to prove a screen works, not enough to be
 * mistaken for real trading history.
 */
function demo_sample_data(array $accounts): void
{
    $prospect = $accounts['prospect'];
    $ambassador = $accounts['ambassador'];

    // A configuration the prospect built on the public website.
    $existing = db_one('SELECT id FROM public_builds WHERE email = ?', [$prospect['email']]);
    if (!$existing) {
        db_run(
            'INSERT INTO public_builds
               (id, full_name, email, phone, user_id, model_key, engine_id, ownership,
                diamond_stitching, finishes, equipment, estimate_minor, currency,
                shipping_minor, shipping_currency, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                new_id(), 'Demo Prospect', $prospect['email'], '+20 100 000 0000', $prospect['id'],
                '43', '43-mercury-600', 'Full ownership', 1,
                json_encode(['gelcoat' => 'elegant-blue', 'upholstery' => 'sand', 'teak' => 'bleached']),
                json_encode(['mercury-joystick', 'bow-thruster']),
                64470000, 'EUR',
                null, 'EUR',           // freight deliberately unpriced, so it reads "To be confirmed"
                'new', now(), now(),
            ]
        );
    }

    // A portal configuration the ambassador built and shared with the prospect,
    // but only if the catalog has been imported — without a model there is
    // nothing to configure.
    $model = db_one("SELECT id, name, base_amount, base_currency FROM models WHERE slug = 'kumbra-43'");
    if ($model && !db_one('SELECT id FROM configurations WHERE shared_with = ?', [$prospect['id']])) {
        $configId = new_id();
        db_run(
            'INSERT INTO configurations
               (id, model_id, created_by, ambassador_id, shared_with, status, name,
                vat_rate, shared_at, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                $configId, $model['id'], $ambassador['id'], $ambassador['id'], $prospect['id'],
                'shared', 'Demo Prospect — Kumbra 43',
                (float) setting('vat_rate', '0.14'), now(), now(), now(),
            ]
        );
        db_run(
            'INSERT INTO configuration_items
               (id, configuration_id, kind, source_id, name, group_name, amount_minor, currency, on_request, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0)',
            [new_id(), $configId, LINE_BASE, $model['id'], $model['name'] . ' — base', 'Base boat',
             $model['base_amount'], $model['base_currency']]
        );

        $engine = db_one(
            "SELECT o.id, o.name, o.amount_minor, o.currency, g.name AS group_name
             FROM options o JOIN option_groups g ON g.id = o.group_id
             WHERE o.model_id = ? AND o.name LIKE '%V-12 600%' LIMIT 1",
            [$model['id']]
        );
        if ($engine) {
            db_run(
                'INSERT INTO configuration_items
                   (id, configuration_id, kind, source_id, name, group_name, amount_minor, currency, on_request, sort_order)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 1)',
                [new_id(), $configId, LINE_OPTION, $engine['id'], $engine['name'],
                 $engine['group_name'], $engine['amount_minor'], $engine['currency']]
            );
        }
    }
}

/** Which demo accounts exist, without revealing anything secret. */
function demo_status(): array
{
    $rows = [];
    foreach (DEMO_ACCOUNTS as $spec) {
        $user = find_user_by_email($spec['email']);
        $rows[] = [
            'email'   => $spec['email'],
            'role'    => $spec['role'],
            'scopes'  => $spec['scopes'],
            'covers'  => $spec['covers'],
            'exists'  => (bool) $user,
            'status'  => $user['status'] ?? null,
        ];
    }
    return $rows;
}

/**
 * Deletes every demo account and the sample data seeded with it.
 *
 * Demo logins on a live site are a standing invitation, so removing them is a
 * first-class action rather than a manual cleanup someone forgets.
 */
function demo_remove(?string $actorId = null): int
{
    $removed = 0;
    foreach (DEMO_ACCOUNTS as $spec) {
        $user = find_user_by_email($spec['email']);
        if (!$user) {
            continue;
        }
        $id = $user['id'];

        db_run('DELETE FROM configuration_items WHERE configuration_id IN
                (SELECT id FROM configurations WHERE created_by = ? OR shared_with = ?)', [$id, $id]);
        db_run('DELETE FROM configuration_comments WHERE author_id = ?', [$id]);
        db_run('DELETE FROM configurations WHERE created_by = ? OR shared_with = ?', [$id, $id]);
        db_run('DELETE FROM public_builds WHERE user_id = ? OR email = ?', [$id, $spec['email']]);
        db_run('DELETE FROM user_scopes WHERE user_id = ?', [$id]);
        db_run('DELETE FROM sessions WHERE user_id = ?', [$id]);
        db_run('DELETE FROM verifications WHERE user_id = ?', [$id]);
        db_run('DELETE FROM password_resets WHERE user_id = ?', [$id]);
        db_run('DELETE FROM users WHERE id = ?', [$id]);
        $removed++;
    }

    audit($actorId, 'demo_accounts_removed', 'user', null, ['count' => $removed]);
    return $removed;
}
