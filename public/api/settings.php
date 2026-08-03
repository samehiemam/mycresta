<?php
/**
 * Platform settings, and per-ambassador commission terms.
 *
 * FR-EMP-030: an admin sets the finder and closer percentages globally, and
 * may override either for a specific ambassador's agreement. Both live here;
 * the third level — a one-off override on a single commission — belongs with
 * that commission and lives in commissions.php.
 *
 * Admin only. These are the numbers every quote and every payout is drawn
 * from, so nobody else may read or write them.
 */

declare(strict_types=1);

$libCandidates = [
    __DIR__ . '/../../portal/lib',
    __DIR__ . '/../../../portal/lib',
    __DIR__ . '/../portal/lib',
];
foreach ($libCandidates as $lib) {
    if (is_dir($lib)) {
        require_once $lib . '/bootstrap.php';
        require_once $lib . '/pricing.php';
        require_once $lib . '/configurations.php';
        require_once $lib . '/commissions.php';
        break;
    }
}
if (!function_exists('db')) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['ok' => false, 'error' => 'The portal is not installed on this server yet.']);
    exit;
}

$action = $_GET['action'] ?? 'list';
if ($action !== 'list') {
    require_method('POST');
    require_csrf();
}
$data = body();

$admin = require_can('user_management', 'full');

/** Settings an admin may change from the portal, and how each is read. */
const EDITABLE_SETTINGS = [
    'vat_rate'               => 'rate',
    'commission_finder_rate' => 'rate',
    'commission_closer_rate' => 'rate',
    'fx_rate_usd'            => 'number',
    'fx_rate_egp'            => 'number',
    'document_max_bytes'     => 'number',
];

function put_setting(string $key, string $value, string $actorId): void
{
    db_run(
        'INSERT INTO settings (setting_key, value, updated_by, updated_at)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE value = VALUES(value), updated_by = VALUES(updated_by),
                                 updated_at = VALUES(updated_at)',
        [$key, $value, $actorId, now()]
    );
}

switch ($action) {
    case 'list': {
        $rows = [];
        foreach (EDITABLE_SETTINGS as $key => $kind) {
            $row = db_one('SELECT value, updated_at FROM settings WHERE setting_key = ?', [$key]);
            $rows[$key] = [
                'value'     => $row['value'] ?? null,
                'kind'      => $kind,
                'updatedAt' => $row['updated_at'] ?? null,
            ];
        }

        // Only ambassadors who are actually on non-standard terms; the rest
        // follow the platform rate and saying so for each would be noise.
        $terms = db_all(
            "SELECT t.user_id, u.full_name AS name, u.email, t.finder_rate, t.closer_rate, t.note
             FROM ambassador_terms t JOIN users u ON u.id = t.user_id
             WHERE t.finder_rate IS NOT NULL OR t.closer_rate IS NOT NULL
             ORDER BY u.full_name"
        );

        json_out([
            'ok'           => true,
            'settings'     => $rows,
            'ambassadors'  => db_all(
                "SELECT id, full_name AS name, email FROM users
                  WHERE role = 'ambassador' AND status = 'approved' ORDER BY full_name"
            ),
            'customTerms'  => $terms,
        ]);
    }

    case 'set': {
        $key = field($data, 'key', 64);
        if (!array_key_exists($key, EDITABLE_SETTINGS)) {
            fail('That setting cannot be changed here.', 422);
        }

        $raw = trim((string) ($data['value'] ?? ''));
        if ($raw === '' || !is_numeric($raw)) {
            fail('Enter a number.', 422);
        }

        // A rate is a fraction, so 0.02 is two percent. Bounded, because a
        // typo here is applied to every deal until somebody notices.
        $value = EDITABLE_SETTINGS[$key] === 'rate'
            ? (string) commission_valid_rate((float) $raw)
            : (string) max(0, (float) $raw);

        $before = db_one('SELECT value FROM settings WHERE setting_key = ?', [$key]);
        put_setting($key, $value, $admin['id']);
        audit($admin['id'], 'setting_changed', 'setting', $key, [
            'from' => $before['value'] ?? null, 'to' => $value,
        ]);

        json_out(['ok' => true, 'key' => $key, 'value' => $value]);
    }

    case 'ambassador-terms': {
        $userId = field($data, 'userId', 32);
        $target = find_user($userId);
        if (!$target || $target['role'] !== 'ambassador') {
            fail('That is not an ambassador account.', 422);
        }

        // An empty box means "use the platform rate", which is a real choice
        // and different from typing the same number the platform happens to
        // use today — because the platform rate can move afterwards.
        $read = static function ($value): ?float {
            if ($value === null || $value === '') {
                return null;
            }
            return commission_valid_rate((float) $value);
        };
        $finder = $read($data['finderRate'] ?? null);
        $closer = $read($data['closerRate'] ?? null);

        db_run(
            'INSERT INTO ambassador_terms (user_id, finder_rate, closer_rate, note, updated_by, updated_at)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE finder_rate = VALUES(finder_rate), closer_rate = VALUES(closer_rate),
                                     note = VALUES(note), updated_by = VALUES(updated_by),
                                     updated_at = VALUES(updated_at)',
            [$userId, $finder, $closer, field($data, 'note', 500) ?: null, $admin['id'], now()]
        );

        audit($admin['id'], 'ambassador_terms_set', 'user', $userId, [
            'finder' => $finder, 'closer' => $closer,
        ]);

        json_out([
            'ok'    => true,
            'terms' => [
                'userId'     => $userId,
                'finderRate' => $finder,
                'closerRate' => $closer,
            ],
        ]);
    }

    default:
        fail('Unknown action.', 404);
}
