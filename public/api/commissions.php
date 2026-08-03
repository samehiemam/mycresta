<?php
/**
 * Ambassador commission.
 *
 * Ambassadors read their own and change nothing. Finance and Founders run the
 * approval workflow. Only a Founder may override a calculated figure.
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
$param = static function (string $key, int $max = 64) use ($data): string {
    $value = $_GET[$key] ?? $data[$key] ?? '';
    return is_string($value) ? mb_substr(trim($value), 0, $max) : '';
};

$user = require_can('commission', 'own');

function commission_row(array $c, array $user): array
{
    $row = [
        'id'          => $c['id'],
        'customer'    => $c['customer_name'] ?? null,
        'ambassador'  => $c['ambassador_name'] ?? null,
        'attribution' => $c['attribution'],
        'rate'        => (float) ($c['override_rate'] ?? $c['rate']),
        'base'        => (int) $c['base_minor'],
        'amount'      => commission_payable($c),
        'currency'    => $c['currency'],
        'status'      => $c['status'],
        'payoutRef'   => $c['payout_ref'],
        'createdAt'   => $c['created_at'],
    ];
    // The reason for an override is an internal note between staff.
    if (can_see_all($user, 'commission')) {
        $row['overridden'] = $c['override_minor'] !== null || $c['override_rate'] !== null;
        $row['overrideReason'] = $c['override_reason'];
    }
    return $row;
}

switch ($action) {
    case 'list': {
        $rows = commission_list($user, [
            'status'     => $param('status', 12),
            'ambassador' => $param('ambassador', 32),
        ]);
        json_out([
            'ok'          => true,
            'commissions' => array_map(fn(array $c): array => commission_row($c, $user), $rows),
            'totals'      => commission_totals($user),
            'canReview'   => can($user, 'commission', 'scoped'),
            'canOverride' => can($user, 'commission', 'full'),
        ]);
    }

    case 'attribution':
        json_out(['ok' => true, 'commission' => commission_row(
            commission_set_attribution($user, $param('id', 32), $param('attribution', 10)) + [
                'customer_name' => null, 'ambassador_name' => null,
            ],
            $user
        )]);

    case 'status':
        json_out(['ok' => true, 'commission' => commission_row(
            commission_set_status($user, $param('id', 32), $param('status', 12), $param('payoutRef', 120) ?: null) + [
                'customer_name' => null, 'ambassador_name' => null,
            ],
            $user
        )]);

    case 'override':
        json_out(['ok' => true, 'commission' => commission_row(
            commission_override(
                $user,
                $param('id', 32),
                isset($data['amount_minor']) && $data['amount_minor'] !== null
                    ? max(0, (int) $data['amount_minor']) : null,
                isset($data['rate']) && $data['rate'] !== null
                    ? max(0.0, (float) $data['rate']) : null,
                $param('reason', 500)
            ) + ['customer_name' => null, 'ambassador_name' => null],
            $user
        )]);

    default:
        fail('Unknown action.', 404);
}
