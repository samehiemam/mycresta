<?php
/**
 * The lead and deal pipeline.
 *
 * Visibility is decided in the query, not after it: an ambassador's list is
 * filtered before rows are loaded, and a lead they may not see reports as
 * missing rather than forbidden.
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
        require_once $lib . '/configurations.php';
        require_once $lib . '/commissions.php';
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

$action = $_GET['action'] ?? 'list';
$reads = ['list', 'lead', 'stages', 'ambassadors'];
if (!in_array($action, $reads, true)) {
    require_method('POST');
    require_csrf();
}
$data = body();
$param = static function (string $key, int $max = 64) use ($data): string {
    $value = $_GET[$key] ?? $data[$key] ?? '';
    return is_string($value) ? mb_substr(trim($value), 0, $max) : '';
};

$user = require_can('pipeline', 'own');

/** One lead with its owner and assignee resolved. */
function lead_joined(string $id): array
{
    return db_one(
        'SELECT l.*, a.full_name AS ambassador_name, s.full_name AS assigned_name
         FROM leads l
         LEFT JOIN users a ON a.id = l.ambassador_id
         LEFT JOIN users s ON s.id = l.assigned_to
         WHERE l.id = ?',
        [$id]
    ) ?? [];
}

/** A lead as the client wants it, with the labels already resolved. */
function lead_row(array $l): array
{
    return [
        'id'            => $l['id'],
        'fullName'      => $l['full_name'],
        'email'         => $l['email'],
        'phone'         => $l['phone'],
        'stage'         => $l['stage'],
        'stageLabel'    => LEAD_STAGES[$l['stage']] ?? $l['stage'],
        'source'        => $l['source'],
        'brand'         => $l['brand_slug'],
        'model'         => $l['model_slug'],
        'ambassadorId'  => $l['ambassador_id'],
        'ambassador'    => $l['ambassador_name'] ?? null,
        'assignedTo'    => $l['assigned_name'] ?? null,
        // A house lead is a state, not a gap, so it is named as one.
        'isHouse'       => $l['ambassador_id'] === null,
        'dealValue'     => $l['deal_value_minor'] === null ? null : (int) $l['deal_value_minor'],
        'currency'      => $l['deal_currency'],
        'publicBuildId' => $l['public_build_id'],
        'configId'      => $l['configuration_id'],
        'deliveredAt'   => $l['delivered_at'],
        'updatedAt'     => $l['updated_at'],
        'createdAt'     => $l['created_at'],
    ];
}

switch ($action) {
    case 'stages':
        json_out(['ok' => true, 'stages' => LEAD_STAGES, 'sources' => LEAD_SOURCES]);

    case 'list': {
        $leads = lead_list($user, [
            'stage'      => $param('stage', 24),
            'ambassador' => $param('ambassador', 32),
            'house'      => $param('house') === '1',
            'search'     => $param('search', 80),
        ]);
        json_out([
            'ok'      => true,
            'leads'   => array_map('lead_row', $leads),
            'counts'  => lead_stage_counts($user),
            'stages'  => LEAD_STAGES,
            'canOwn'  => can($user, 'pipeline', 'full'),
            'isStaff' => can_see_all($user, 'pipeline'),
        ]);
    }

    case 'lead': {
        $lead = lead_require($user, $param('id', 32));
        $full = lead_joined($lead['id']);
        json_out([
            'ok'       => true,
            'lead'     => lead_row($full),
            'notes'    => $full['notes'],
            'events'   => db_all(
                'SELECT e.kind, e.body, e.from_stage, e.to_stage, e.due_at, e.done_at, e.created_at,
                        u.full_name AS author
                 FROM lead_events e LEFT JOIN users u ON u.id = e.author_id
                 WHERE e.lead_id = ? ORDER BY e.created_at DESC LIMIT 200',
                [$lead['id']]
            ),
            'stages'   => LEAD_STAGES,
            'canEdit'  => lead_editable($user, $lead),
            'canOwn'   => can($user, 'pipeline', 'full'),
        ]);
    }

    case 'create': {
        $result = lead_register($user, $data);
        if ($result['existing']) {
            // First to register wins, permanently. Saying so plainly beats a
            // silent no-op, which would look like the lead simply vanished.
            $owner = $result['lead']['ambassador_id'];
            fail(
                $owner === null
                    ? 'That contact is already on the board as a house lead.'
                    : 'That contact is already registered to another ambassador. First to register keeps ownership.',
                409,
                ['leadId' => can_see_all($user, 'pipeline') ? $result['lead']['id'] : null]
            );
        }
        // Re-read with the owner joined, so the client can name whoever now
        // holds it without a second request.
        json_out(['ok' => true, 'lead' => lead_row(lead_joined($result['lead']['id']))]);
    }

    case 'stage': {
        $lead = lead_set_stage($user, $param('id', 32), $param('stage', 24), $param('note', 500) ?: null);
        json_out(['ok' => true, 'lead' => lead_row(lead_joined($lead['id']))]);
    }

    case 'note': {
        $lead = lead_require($user, $param('id', 32));
        if (!lead_editable($user, $lead)) {
            fail('You cannot add notes to this lead.', 403);
        }
        $body = trim((string) ($data['body'] ?? ''));
        if ($body === '') {
            fail('Write something first.', 422);
        }
        lead_log($lead['id'], $user['id'], 'note', mb_substr($body, 0, 4000), null, null,
            field($data, 'dueAt', 32) ?: null);
        json_out(['ok' => true]);
    }

    case 'reassign': {
        $lead = lead_reassign($user, $param('id', 32), $param('ambassadorId', 32) ?: null, $param('reason', 255));
        json_out(['ok' => true, 'lead' => lead_row(lead_joined($lead['id']))]);
    }

    case 'ambassadors': {
        // For the reassignment picker. Founder only, since nobody else may act
        // on it and the list is otherwise none of their business.
        if (!can($user, 'pipeline', 'full')) {
            fail('You do not have access to that.', 403);
        }
        json_out([
            'ok' => true,
            'ambassadors' => db_all(
                "SELECT id, full_name AS name, email FROM users
                  WHERE role = 'ambassador' AND status = 'approved' ORDER BY full_name"
            ),
        ]);
    }

    default:
        fail('Unknown action.', 404);
}
