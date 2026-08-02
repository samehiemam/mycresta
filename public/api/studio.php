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
$writes = ['create', 'set-options', 'set-commercials', 'share', 'comment'];
if (in_array($action, $writes, true)) {
    require_method('POST');
    require_csrf();
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

    default:
        fail('Unknown action.', 404);
}
