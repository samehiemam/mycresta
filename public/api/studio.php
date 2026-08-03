<?php
/**
 * Catalog browsing and the configurator.
 *
 * Every action asks the permission matrix before it does anything, and the
 * pricing layer decides what the reply may contain. Nothing here trusts the
 * client to hide a figure it should not have received.
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
        require_once $lib . '/pricing.php';
        require_once $lib . '/catalog.php';
        require_once $lib . '/configurations.php';
        require_once $lib . '/leads.php';
        break;
    }
}
if (!function_exists('db')) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['ok' => false, 'error' => 'The portal is not installed on this server yet.']);
    exit;
}

$action = $_GET['action'] ?? '';

// Reads are GET and need no CSRF; anything that changes state is a POST that
// must carry the token.
$writes = ['create', 'set-options', 'set-commercials', 'share', 'comment', 'set-build-shipping',
           'save-configuration'];
if (in_array($action, $writes, true)) {
    require_method('POST');
    require_csrf();
}

// Saving a build from the public site is deliberately anonymous: the visitor
// has no portal session, and a CSRF token guards actions taken with someone
// else's credentials — there are none here. It is rate limited instead, since
// the real risk is a flood of junk rather than a forged request.
if ($action === 'save-build') {
    require_method('POST');
    throttle('save_build', client_ip() ?? 'unknown', 20, 60);
}

$data = body();

/** Reads accept their parameters from the query string or the JSON body, so
 *  the client's one API helper can call every action the same way. */
$param = static function (string $key, int $max = 64) use ($data): string {
    $value = $_GET[$key] ?? $data[$key] ?? '';
    return is_string($value) ? mb_substr(trim($value), 0, $max) : '';
};

switch ($action) {
    // ------------------------------------------------------------ catalog ---
    case 'models': {
        $user = require_can('catalog', 'view');
        $brand = $param('brand') ?: null;
        json_out([
            'ok'     => true,
            'brands' => catalog_brands(),
            'models' => array_map(static fn(array $m): array => [
                'slug'          => $m['slug'],
                'name'          => $m['name'],
                'status'        => $m['status'],
                'brand'         => $m['brand_name'],
                'brand_slug'    => $m['brand_slug'],
                'base_amount'   => (int) $m['base_amount'],
                'base_currency' => $m['base_currency'],
            ], catalog_models($user, $brand)),
        ]);
    }

    case 'model': {
        $user = require_can('catalog', 'view');
        $detail = catalog_model($user, $param('slug'));
        if (!$detail) {
            fail('That model is not available.', 404);
        }
        json_out(['ok' => true] + $detail);
    }

    // ----------------------------------------------------- configurations ---
    case 'create': {
        $user = require_can('configurator', 'own');
        $id = config_create(
            $user,
            field($data, 'model', 64),
            field($data, 'leadId', 32) ?: null,
            field($data, 'name', 160) ?: null
        );
        json_out(['ok' => true, 'id' => $id]);
    }

    case 'config': {
        $user = require_can('configurator', 'own');
        json_out(['ok' => true, 'configuration' => config_read($user, $param('id', 32))]);
    }

    case 'list': {
        $user = require_can('configurator', 'own');

        // An ambassador or a prospect sees only what is theirs. The filter is
        // in the query rather than applied afterwards, so a row they may not
        // see is never loaded in the first place.
        $sql = "SELECT c.id, c.name, c.status, c.updated_at, m.name AS model_name, m.slug AS model_slug
                FROM configurations c JOIN models m ON m.id = c.model_id";
        $params = [];
        if (!can_see_all($user, 'configurator')) {
            $sql .= ' WHERE c.created_by = ? OR c.ambassador_id = ? OR c.shared_with = ?';
            $params = [$user['id'], $user['id'], $user['id']];
        }
        json_out(['ok' => true, 'configurations' => db_all($sql . ' ORDER BY c.updated_at DESC LIMIT 100', $params)]);
    }

    case 'set-options': {
        $user = require_can('configurator', 'own');
        $ids = $data['options'] ?? [];
        if (!is_array($ids)) {
            fail('Send the chosen options as a list.', 422);
        }
        $ids = array_values(array_filter(array_map(
            static fn($v): string => is_string($v) ? mb_substr($v, 0, 32) : '',
            $ids
        )));

        $result = config_set_options($user, field($data, 'id', 32), $ids);
        if (!$result['ok']) {
            // 422: the request was understood and refused on its merits, which
            // is what lets the client show the reasons beside the options.
            fail('That combination cannot be built.', 422, ['problems' => $result['problems']]);
        }
        json_out(['ok' => true, 'configuration' => config_read($user, field($data, 'id', 32))]);
    }

    case 'set-commercials': {
        $user = require_can('configurator', 'own');
        $id = field($data, 'id', 32);
        config_set_commercials($user, $id, [
            'discount_minor'    => isset($data['discount_minor']) ? (int) $data['discount_minor'] : null,
            'discount_currency' => field($data, 'discount_currency', 3) ?: null,
            'discount_reason'   => field($data, 'discount_reason', 255) ?: null,
            // Explicit null clears it back to "to be confirmed"; a missing key
            // leaves it alone.
            'shipping_minor'    => array_key_exists('shipping_minor', $data)
                ? ($data['shipping_minor'] === null ? null : (int) $data['shipping_minor'])
                : null,
            'shipping_currency' => field($data, 'shipping_currency', 3) ?: null,
        ]);
        json_out(['ok' => true, 'configuration' => config_read($user, $id)]);
    }

    case 'share': {
        $user = require_can('configurator', 'own');
        $id = field($data, 'id', 32);
        $config = config_require($user, $id, 'own');
        config_require_editable($config);

        $email = normalise_email(field($data, 'email'));
        $prospect = $email === '' ? null : find_user_by_email($email);
        if (!$prospect) {
            fail('No My Cresta account uses that email address yet.', 404);
        }

        db_run(
            "UPDATE configurations SET shared_with = ?, status = 'shared', shared_at = ?, updated_at = ? WHERE id = ?",
            [$prospect['id'], now(), now(), $id]
        );
        audit($user['id'], 'config_shared', 'configuration', $id, ['with' => $prospect['id']]);

        // FR-NOTIF-010: the prospect is told a configuration is waiting.
        send_email(
            $prospect['email'],
            'A Cresta configuration is ready for you',
            "Hello {$prospect['full_name']},\n\nA configuration has been prepared for you. "
            . "Sign in to My Cresta to view it:\n"
            . rtrim(cresta_config()['site_url'], '/') . "/portal\n\nCresta Marine"
        );

        json_out(['ok' => true]);
    }

    case 'comment': {
        // FR-PROS-040: a prospect may comment without being able to edit.
        $user = require_can('configurator', 'own');
        $id = field($data, 'id', 32);
        config_require($user, $id, 'view');

        $bodyText = trim((string) ($data['body'] ?? ''));
        if ($bodyText === '') {
            fail('Please write something first.', 422);
        }

        db_run(
            'INSERT INTO configuration_comments (id, configuration_id, author_id, body, created_at)
             VALUES (?, ?, ?, ?, ?)',
            [new_id(), $id, $user['id'], mb_substr($bodyText, 0, 4000), now()]
        );
        audit($user['id'], 'config_commented', 'configuration', $id);
        json_out(['ok' => true]);
    }

    case 'comments': {
        $user = require_can('configurator', 'own');
        $id = $param('id', 32);
        config_require($user, $id, 'view');
        json_out([
            'ok' => true,
            'comments' => db_all(
                'SELECT c.body, c.created_at, u.full_name AS author
                 FROM configuration_comments c JOIN users u ON u.id = c.author_id
                 WHERE c.configuration_id = ? ORDER BY c.created_at',
                [$id]
            ),
        ]);
    }

    /**
     * The configurator's price list for one model.
     *
     * Deliberately answers 200 with prices: null rather than 403 when the
     * caller may not see figures. An unpriced configurator is the normal,
     * expected state for most visitors — it is not an error, and treating it
     * as one would mean the public page logging failures on every load.
     *
     * The check is configurator_prices() itself: there is no path here that
     * reads a price before deciding whether the caller may have it.
     */
    case 'price-list': {
        $modelKey = $param('model', 8);
        if (!in_array($modelKey, ['34', '36', '43'], true)) {
            fail('Unknown model.', 422);
        }

        $viewer = current_user();

        // A configuration id is optional, and only ever widens visibility for
        // that one configuration — an approved quote shown to the customer it
        // was shared with.
        $config = null;
        $configId = $param('configuration', 32);
        if ($configId !== '') {
            $config = db_one('SELECT * FROM configurations WHERE id = ?', [$configId]);
        }

        // The same call also answers what this session may *do* here, because
        // the client needs both on mount and one round trip is enough. Staff
        // and ambassadors get the naming and assignment panel; a visitor gets
        // the quote request they had before.
        $role = $viewer['role'] ?? '';
        json_out([
            'ok' => true,
            'prices' => configurator_prices($viewer, $modelKey, $config),
            'viewer' => [
                'signedIn' => (bool) $viewer,
                'canAssign' => in_array($role, ['admin', 'employee', 'ambassador'], true),
                'canSaveTemplate' => in_array($role, ['admin', 'employee'], true),
            ],
        ]);
    }

    /**
     * Customers a saved configuration may be assigned to.
     *
     * The list is of leads, not user accounts, because a prospect is a lead
     * from the moment they are known and may never create an account —
     * leads.customer_id is nullable for exactly that reason. Listing accounts
     * would hide every prospect who has not signed up, which is most of them.
     *
     * It also makes "assign to a customer" and "link to a lead" one action
     * rather than two that can disagree.
     *
     * Scoped in SQL, not filtered in the browser: an ambassador sees their own
     * leads and nobody else's, so a name they may not see is never sent.
     */
    case 'assignable': {
        $user = require_can('configurator', 'own');

        $rows = can_see_all($user, 'pipeline')
            ? db_all(
                "SELECT id AS lead_id, full_name, email, stage, customer_id
                   FROM leads
                  WHERE stage <> 'closed_lost'
               ORDER BY full_name LIMIT 500"
            )
            : db_all(
                "SELECT id AS lead_id, full_name, email, stage, customer_id
                   FROM leads
                  WHERE ambassador_id = ? AND stage <> 'closed_lost'
               ORDER BY full_name LIMIT 500",
                [$user['id']]
            );

        json_out(['ok' => true, 'customers' => $rows]);
    }

    /**
     * Saves a named configuration, optionally against a customer.
     *
     * Staff and ambassadors only — a visitor's route is still save-build,
     * which captures a lead rather than a named record.
     *
     * A new customer is registered as a lead through lead_register() rather
     * than inserted here, so first-to-register ownership applies exactly as it
     * does everywhere else. Creating a prospect from the configurator must not
     * be a side door around the rule that decides whose commission it is.
     */
    case 'save-configuration': {
        $user = require_can('configurator', 'own');

        $name = field($data, 'name', 160);
        if ($name === '') {
            fail('Give the configuration a name.', 422);
        }
        $modelKey = field($data, 'model', 8);
        if (!in_array($modelKey, ['34', '36', '43'], true)) {
            fail('Unknown model.', 422);
        }

        $leadId = field($data, 'leadId', 32) ?: null;

        // A brand-new prospect, named right here in the panel.
        $newName = field($data, 'newCustomerName', 255);
        if ($leadId === null && $newName !== '') {
            // Keys are lead_register()'s own, and `source` has to be one of
            // LEAD_SOURCES or it is silently recorded as 'other'.
            $lead = lead_register($user, [
                'fullName' => $newName,
                'email'    => field($data, 'newCustomerEmail'),
                'phone'    => field($data, 'newCustomerPhone', 64),
                'source'   => $user['role'] === 'ambassador' ? 'ambassador' : 'other',
                'model'    => "kumbra-{$modelKey}",
            ]);
            $leadId = $lead['id'];
        }

        // An ambassador may only attach to a lead that is theirs. Checked here
        // rather than trusted from the picker, which is client-side.
        $sharedWith = null;
        if ($leadId !== null) {
            $lead = db_one('SELECT * FROM leads WHERE id = ?', [$leadId]);
            if (!$lead) {
                fail('That customer no longer exists.', 404);
            }
            if (!can_see_all($user, 'pipeline') && ($lead['ambassador_id'] ?? null) !== $user['id']) {
                fail('That customer is not yours.', 403);
            }
            $sharedWith = $lead['customer_id'] ?: null;
        }

        $isTemplate = !empty($data['isTemplate']);
        if ($isTemplate && !in_array($user['role'], ['admin', 'employee'], true)) {
            fail('Only Cresta staff can save a template.', 403);
        }

        $id = new_id();
        db_run(
            'INSERT INTO configurations
               (id, model_id, model_key, lead_id, created_by, ambassador_id, shared_with,
                status, name, description, is_template, vat_rate, notes, created_at, updated_at)
             VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                $id, $modelKey, $leadId, $user['id'],
                $user['role'] === 'ambassador' ? $user['id'] : null,
                $sharedWith,
                'draft',
                $name,
                mb_substr(trim((string) ($data['description'] ?? '')), 0, 600) ?: null,
                $isTemplate ? 1 : 0,
                (float) setting('vat_rate', '0.14'),
                json_encode($data['selection'] ?? new stdClass(), JSON_UNESCAPED_UNICODE),
                now(), now(),
            ]
        );

        audit($user['id'], 'configuration_saved', 'configuration', $id, [
            'model' => $modelKey, 'lead' => $leadId, 'template' => $isTemplate,
        ]);

        json_out(['ok' => true, 'id' => $id, 'leadId' => $leadId]);
    }

    // ------------------------------------------------- client-built quotes ---
    case 'save-build': {
        // Deliberately open: a visitor builds a boat before they have an
        // account, and losing that to a sign-up wall loses the lead.
        $modelKey = field($data, 'model', 8);
        if (!in_array($modelKey, ['34', '36', '43'], true)) {
            fail('Unknown model.', 422);
        }

        $email = normalise_email(field($data, 'email'));
        $existing = $email === '' ? null : find_user_by_email($email);

        $id = new_id();
        db_run(
            'INSERT INTO public_builds
               (id, full_name, email, phone, user_id, model_key, engine_id, ownership,
                diamond_stitching, finishes, equipment, estimate_minor, currency,
                status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                $id,
                field($data, 'fullName') ?: null,
                $email ?: null,
                field($data, 'phone', 64) ?: null,
                $existing['id'] ?? null,
                $modelKey,
                field($data, 'engineId', 64),
                field($data, 'ownership', 64) ?: null,
                !empty($data['diamondStitching']) ? 1 : 0,
                json_encode($data['finishes'] ?? new stdClass(), JSON_UNESCAPED_UNICODE),
                json_encode(array_values(array_filter(
                    (array) ($data['equipment'] ?? []),
                    'is_string'
                )), JSON_UNESCAPED_UNICODE),
                (int) round(((float) ($data['estimate'] ?? 0)) * 100),
                'EUR',
                'new', now(), now(),
            ]
        );

        record_attempt('save_build', client_ip() ?? 'unknown', true);
        audit($existing['id'] ?? null, 'public_build_saved', 'public_build', $id, ['model' => $modelKey]);

        // FR-LEAD-030: with no ambassador attached this is a house lead, so
        // the people who work them are told straight away.
        notify_build_received($id, $modelKey, $email);

        json_out(['ok' => true, 'id' => $id]);
    }

    case 'builds': {
        // Staff see every client build; a customer sees only their own.
        $user = require_can('pipeline', 'own');
        $sql = 'SELECT id, full_name, email, phone, model_key, engine_id, status,
                       estimate_minor, currency, created_at
                FROM public_builds';
        $params = [];
        if (!can_see_all($user, 'pipeline')) {
            $sql .= ' WHERE user_id = ?';
            $params = [$user['id']];
        }
        json_out(['ok' => true, 'builds' => db_all($sql . ' ORDER BY created_at DESC LIMIT 200', $params)]);
    }

    case 'build': {
        $user = require_can('pipeline', 'own');
        $build = db_one('SELECT * FROM public_builds WHERE id = ?', [$param('id', 32)]);
        if (!$build) {
            fail('That configuration does not exist.', 404);
        }
        if (!can_see_all($user, 'pipeline') && $build['user_id'] !== $user['id']) {
            fail('That configuration does not exist.', 404);
        }

        $build['finishes'] = json_decode((string) $build['finishes'], true) ?: [];
        $build['equipment'] = json_decode((string) $build['equipment'], true) ?: [];
        $build['diamond_stitching'] = (bool) $build['diamond_stitching'];
        $build['estimate_minor'] = (int) $build['estimate_minor'];
        $build['shipping_minor'] = $build['shipping_minor'] === null
            ? null
            : (int) $build['shipping_minor'];
        // Only a Founder may change it; everyone else reads it.
        $build['can_edit_shipping'] = can($user, 'catalog', 'full');
        json_out(['ok' => true, 'build' => $build]);
    }

    case 'set-build-shipping': {
        // FR-CFG: shipping is variable per configuration and only a Founder
        // sets it. Guarded here rather than by hiding the field, since a
        // hidden input is still a request anyone can send.
        $user = require_can('pipeline', 'view');
        if (!can($user, 'catalog', 'full')) {
            fail('Only a Founder can set shipping and handling.', 403);
        }

        $id = field($data, 'id', 32);
        $build = db_one('SELECT id FROM public_builds WHERE id = ?', [$id]);
        if (!$build) {
            fail('That configuration does not exist.', 404);
        }

        // An absent or empty value clears it back to "to be confirmed", which
        // is not the same as pricing the freight at nothing.
        $raw = $data['shipping_minor'] ?? null;
        $minor = ($raw === null || $raw === '') ? null : max(0, (int) $raw);

        db_run(
            'UPDATE public_builds
                SET shipping_minor = ?, shipping_currency = ?, shipping_set_by = ?,
                    shipping_set_at = ?, updated_at = ?
              WHERE id = ?',
            [$minor, strtoupper(field($data, 'shipping_currency', 3) ?: 'EUR'),
             $user['id'], $minor === null ? null : now(), now(), $id]
        );

        audit($user['id'], 'build_shipping_set', 'public_build', $id, ['shipping_minor' => $minor]);
        json_out(['ok' => true, 'shipping_minor' => $minor]);
    }

    default:
        fail('Unknown action.', 404);
}
