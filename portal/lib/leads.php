<?php
/**
 * Leads and the deal pipeline.
 *
 * The ownership rule is the whole point of this file, so it lives in one place
 * and every path goes through it: the first ambassador to register a lead owns
 * it permanently. There is no time-based expiry, and only a Founder may
 * reassign. A lead nobody claimed belongs to the house.
 */

declare(strict_types=1);

/** FR-LEAD-020, in order. The array order is the pipeline order. */
const LEAD_STAGES = [
    'new'             => 'New lead',
    'config_shared'   => 'Config shared',
    'quote_sent'      => 'Quote sent',
    'reserved'        => 'Reserved / deposit',
    'contract_signed' => 'Contract signed',
    'in_production'   => 'In production / import',
    'delivered'       => 'Delivered',
    'closed_lost'     => 'Closed lost',
];

const LEAD_SOURCES = ['website', 'ambassador', 'referral', 'walk_in', 'other'];

/**
 * Finds an existing lead for the same person.
 *
 * Exact contact matching only. FR-LEAD-060 — warning on a near match — is P2,
 * and guessing that two similar records are the same person is precisely the
 * judgement that would hand one ambassador's lead to another.
 */
function lead_find_existing(?string $email, ?string $phone): ?array
{
    $email = $email !== null && $email !== '' ? normalise_email($email) : null;
    $phone = $phone !== null && $phone !== '' ? normalise_phone($phone) : null;

    if ($email !== null) {
        $row = db_one('SELECT * FROM leads WHERE email = ? ORDER BY created_at LIMIT 1', [$email]);
        if ($row) {
            return $row;
        }
    }
    if ($phone !== null) {
        $row = db_one('SELECT * FROM leads WHERE phone = ? ORDER BY created_at LIMIT 1', [$phone]);
        if ($row) {
            return $row;
        }
    }
    return null;
}

/**
 * Registers a lead, applying first-to-register ownership.
 *
 * When the person is already on the board the existing record is returned
 * untouched — its owner does not change, whoever is registering now. That is
 * the rule, and quietly re-pointing it would be the single most damaging thing
 * this system could do to an ambassador's trust in it.
 *
 * @return array{lead:array,claimed:bool,existing:bool}
 */
function lead_register(array $actor, array $input): array
{
    $email = field($input, 'email') !== '' ? normalise_email(field($input, 'email')) : null;
    $phone = field($input, 'phone', 64) !== '' ? normalise_phone(field($input, 'phone', 64)) : null;
    $name  = field($input, 'fullName');

    if ($name === '') {
        fail('A name is required.', 422);
    }
    if ($email === null && $phone === null) {
        fail('An email address or a mobile number is required.', 422);
    }

    $existing = lead_find_existing($email, $phone);
    if ($existing) {
        lead_log($existing['id'], $actor['id'] ?? null, 'system',
            'Someone tried to register this lead again; ownership was left unchanged.');
        return ['lead' => $existing, 'claimed' => false, 'existing' => true];
    }

    // An ambassador registering a lead claims it. Anyone else creates a house
    // lead, which belongs to Cresta and is worked by staff (FR-LEAD-030).
    $isAmbassador = ($actor['role'] ?? '') === 'ambassador';
    $ambassadorId = $isAmbassador ? $actor['id'] : (field($input, 'ambassadorId', 32) ?: null);

    // Only a Founder may hand a lead straight to a named ambassador; otherwise
    // the claim can only be your own.
    if ($ambassadorId !== null && !$isAmbassador && !can($actor, 'pipeline', 'full')) {
        fail('Only a Founder can register a lead on another ambassador\'s behalf.', 403);
    }

    $id = new_id();
    db_run(
        'INSERT INTO leads
           (id, full_name, email, phone, customer_id, ambassador_id, assigned_to, claimed_at,
            stage, source, brand_slug, model_slug, public_build_id, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
            $id, $name, $email, $phone,
            field($input, 'customerId', 32) ?: null,
            $ambassadorId,
            $ambassadorId === null ? (field($input, 'assignedTo', 32) ?: null) : null,
            $ambassadorId === null ? null : now(),
            'new',
            in_array(field($input, 'source', 32), LEAD_SOURCES, true) ? field($input, 'source', 32) : 'other',
            field($input, 'brand', 64) ?: null,
            field($input, 'model', 64) ?: null,
            field($input, 'publicBuildId', 32) ?: null,
            field($input, 'notes', 2000) ?: null,
            now(), now(),
        ]
    );

    audit($actor['id'] ?? null, 'lead_registered', 'lead', $id, [
        'ambassador' => $ambassadorId,
        'house'      => $ambassadorId === null,
    ]);
    lead_log($id, $actor['id'] ?? null, 'system',
        $ambassadorId === null ? 'Registered as a house lead.' : 'Registered and claimed.');

    return ['lead' => find_lead($id), 'claimed' => $ambassadorId !== null, 'existing' => false];
}

function find_lead(string $id): ?array
{
    return db_one('SELECT * FROM leads WHERE id = ?', [$id]);
}

/** Writes an entry to a lead's history. */
function lead_log(
    string $leadId,
    ?string $authorId,
    string $kind,
    ?string $body = null,
    ?string $from = null,
    ?string $to = null,
    ?string $dueAt = null
): void {
    db_run(
        'INSERT INTO lead_events (id, lead_id, author_id, kind, body, from_stage, to_stage, due_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [new_id(), $leadId, $authorId, $kind, $body, $from, $to, $dueAt, now()]
    );
}

/**
 * True when this user may see the lead at all.
 *
 * An ambassador sees only their own. Staff see everything, because working a
 * pipeline means seeing the pipeline.
 */
function lead_visible(array $user, array $lead): bool
{
    if (can_see_all($user, 'pipeline')) {
        return true;
    }
    if ($user['role'] === 'ambassador') {
        return $lead['ambassador_id'] === $user['id'];
    }
    if ($user['role'] === 'customer') {
        return $lead['customer_id'] === $user['id'];
    }
    return false;
}

/** Loads a lead the user may see, or reports it missing. */
function lead_require(array $user, string $id): array
{
    $lead = find_lead($id);
    // Same answer either way: telling an ambassador that a lead exists but is
    // not theirs discloses that a rival is working someone.
    if (!$lead || !lead_visible($user, $lead)) {
        fail('That lead does not exist.', 404);
    }
    return $lead;
}

/** Whether this user may change the lead, as opposed to only read it. */
function lead_editable(array $user, array $lead): bool
{
    if (can($user, 'pipeline', 'scoped')) {
        return true;
    }
    return $user['role'] === 'ambassador' && $lead['ambassador_id'] === $user['id'];
}

/**
 * Moves a lead to a new stage.
 *
 * Delivery is the moment commission becomes payable (FR-COMM-030), so the deal
 * value is snapshotted here rather than read later from a configuration that
 * may since have changed.
 */
function lead_set_stage(array $user, string $leadId, string $stage, ?string $note = null): array
{
    $lead = lead_require($user, $leadId);
    if (!lead_editable($user, $lead)) {
        fail('You cannot change this lead.', 403);
    }
    if (!array_key_exists($stage, LEAD_STAGES)) {
        fail('Unknown pipeline stage.', 422);
    }
    if ($stage === $lead['stage']) {
        return $lead;
    }

    // Marking a deal delivered creates a commission obligation, so it is a
    // staff decision rather than something an ambassador does for themselves.
    if ($stage === 'delivered' && !can($user, 'pipeline', 'scoped')) {
        fail('Only Cresta staff can mark a deal delivered.', 403);
    }

    $deliveredAt = $stage === 'delivered' ? now() : $lead['delivered_at'];
    $value = $lead['deal_value_minor'];
    $currency = $lead['deal_currency'];

    if ($stage === 'delivered' && $value === null && $lead['configuration_id']) {
        $totals = db_one(
            "SELECT SUM(amount_minor) AS total, MIN(currency) AS currency
             FROM configuration_items
             WHERE configuration_id = ? AND kind IN ('base','option') AND on_request = 0",
            [$lead['configuration_id']]
        );
        if ($totals && $totals['total'] !== null) {
            $value = (int) $totals['total'];
            $currency = $totals['currency'] ?: $currency;
        }
    }

    db_run(
        'UPDATE leads SET stage = ?, delivered_at = ?, deal_value_minor = ?, deal_currency = ?, updated_at = ?
          WHERE id = ?',
        [$stage, $deliveredAt, $value, $currency, now(), $leadId]
    );

    lead_log($leadId, $user['id'], 'stage', $note, $lead['stage'], $stage);
    audit($user['id'], 'lead_stage_changed', 'lead', $leadId, ['from' => $lead['stage'], 'to' => $stage]);

    $fresh = find_lead($leadId);

    // FR-COMM-030: delivery is the only moment a commission comes into being.
    // Safe to call twice — one commission per deal is enforced by the schema.
    if ($stage === 'delivered') {
        commission_on_delivery($fresh, $user['id']);
    }

    // FR-NOTIF-020: the owning ambassador hears about it.
    notify_lead_stage($fresh, $stage);

    return $fresh;
}

/**
 * Reassigns ownership. Founder only (FR-LEAD-040).
 *
 * Every reassignment is recorded with a reason, because this is the one action
 * that overrides first-to-register and it is exactly what a dispute turns on.
 */
function lead_reassign(array $user, string $leadId, ?string $ambassadorId, string $reason): array
{
    if (!can($user, 'pipeline', 'full')) {
        fail('Only a Founder can reassign a lead.', 403);
    }
    if (trim($reason) === '') {
        fail('A reason is required when reassigning a lead.', 422);
    }

    $lead = find_lead($leadId);
    if (!$lead) {
        fail('That lead does not exist.', 404);
    }

    if ($ambassadorId !== null && $ambassadorId !== '') {
        $target = find_user($ambassadorId);
        if (!$target || $target['role'] !== 'ambassador') {
            fail('That is not an ambassador account.', 422);
        }
    } else {
        $ambassadorId = null;    // back to the house
    }

    db_run(
        'UPDATE leads SET ambassador_id = ?, claimed_at = ?, updated_at = ? WHERE id = ?',
        [$ambassadorId, $ambassadorId === null ? null : now(), now(), $leadId]
    );

    lead_log($leadId, $user['id'], 'reassigned', $reason, null, null);
    audit($user['id'], 'lead_reassigned', 'lead', $leadId, [
        'from'   => $lead['ambassador_id'],
        'to'     => $ambassadorId,
        'reason' => $reason,
    ]);

    return find_lead($leadId);
}

/** The pipeline a user is allowed to see, newest movement first. */
function lead_list(array $user, array $filters = []): array
{
    $sql = 'SELECT l.*,
                   a.full_name AS ambassador_name,
                   s.full_name AS assigned_name
            FROM leads l
            LEFT JOIN users a ON a.id = l.ambassador_id
            LEFT JOIN users s ON s.id = l.assigned_to';
    $where = [];
    $params = [];

    if (!can_see_all($user, 'pipeline')) {
        if ($user['role'] === 'ambassador') {
            $where[] = 'l.ambassador_id = ?';
            $params[] = $user['id'];
        } elseif ($user['role'] === 'customer') {
            $where[] = 'l.customer_id = ?';
            $params[] = $user['id'];
        } else {
            return [];
        }
    }

    if (!empty($filters['stage']) && array_key_exists($filters['stage'], LEAD_STAGES)) {
        $where[] = 'l.stage = ?';
        $params[] = $filters['stage'];
    }
    if (!empty($filters['ambassador'])) {
        $where[] = 'l.ambassador_id = ?';
        $params[] = $filters['ambassador'];
    }
    if (!empty($filters['house'])) {
        $where[] = 'l.ambassador_id IS NULL';
    }
    if (!empty($filters['search'])) {
        $where[] = '(l.full_name LIKE ? OR l.email LIKE ? OR l.phone LIKE ?)';
        $like = '%' . $filters['search'] . '%';
        array_push($params, $like, $like, $like);
    }

    if ($where) {
        $sql .= ' WHERE ' . implode(' AND ', $where);
    }

    return db_all($sql . ' ORDER BY l.updated_at DESC LIMIT 500', $params);
}

/** Counts per stage, for the dashboards. */
function lead_stage_counts(array $user): array
{
    $sql = 'SELECT stage, COUNT(*) AS c FROM leads';
    $params = [];
    if (!can_see_all($user, 'pipeline')) {
        if ($user['role'] !== 'ambassador') {
            return [];
        }
        $sql .= ' WHERE ambassador_id = ?';
        $params[] = $user['id'];
    }
    $counts = array_fill_keys(array_keys(LEAD_STAGES), 0);
    foreach (db_all($sql . ' GROUP BY stage', $params) as $row) {
        $counts[$row['stage']] = (int) $row['c'];
    }
    return $counts;
}
