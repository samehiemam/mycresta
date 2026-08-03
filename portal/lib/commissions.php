<?php
/**
 * Ambassador commission.
 *
 * The rate is resolved in three steps, narrowest first: an override on the
 * individual commission, then that ambassador's own agreed rate, then the
 * platform default — 1% finder, 2% closer. All three are admin-editable, and
 * each is a deliberate answer to a different question: what this deal was
 * worth, what this person is on, and what everyone is on.
 *
 * The base is the boat and its options, before shipping and VAT. Payable only
 * once a deal reaches Delivered; never at signature or deposit. No residual on
 * service, parts or accessories — nothing but a delivery creates a row here.
 *
 * A commission is calculated once, at delivery, and stored with the rate and
 * base it used. Rates change; what somebody was owed for a boat delivered last
 * year does not.
 */

declare(strict_types=1);

const COMMISSION_STATUSES = ['pending', 'approved', 'paid', 'cancelled'];

/** A sanity bound on any rate an admin can type. 25% is already absurd. */
const COMMISSION_RATE_MAX = 0.25;

/** Reads a rate from an admin's input, refusing anything nonsensical. */
function commission_valid_rate(float $rate): float
{
    if ($rate < 0 || $rate > COMMISSION_RATE_MAX) {
        fail('A commission rate must be between 0 and 25 percent.', 422);
    }
    // Four decimal places, matching the column: 1.25% is expressible, and
    // nothing finer pretends to a precision the money does not have.
    return round($rate, 4);
}

/**
 * The rate for an ambassador, in force now.
 *
 * A per-agreement override wins over the global rate. NULL in
 * ambassador_terms means "use the global one" — which is deliberately
 * different from an override that happens to equal it today, because the
 * global rate can move afterwards.
 */
function commission_rate(string $ambassadorId, string $attribution): float
{
    $global = (float) setting(
        $attribution === 'closer' ? 'commission_closer_rate' : 'commission_finder_rate',
        $attribution === 'closer' ? '0.02' : '0.01'
    );

    $terms = db_one('SELECT finder_rate, closer_rate FROM ambassador_terms WHERE user_id = ?', [$ambassadorId]);
    if (!$terms) {
        return $global;
    }

    $override = $attribution === 'closer' ? $terms['closer_rate'] : $terms['finder_rate'];
    return $override === null ? $global : (float) $override;
}

/**
 * Creates the commission for a delivered deal.
 *
 * Silent and harmless when there is nothing to create: a house lead earns
 * nobody a fee, and a deal that has already produced one must not produce a
 * second. Called from the delivery transition rather than by a human, so it
 * has to be safe to call twice.
 */
function commission_on_delivery(array $lead, ?string $actorId = null): ?array
{
    if (empty($lead['ambassador_id'])) {
        return null;                       // house lead: nobody to pay
    }
    if ($lead['stage'] !== 'delivered') {
        return null;                       // FR-COMM-030
    }

    $existing = db_one('SELECT * FROM commissions WHERE lead_id = ?', [$lead['id']]);
    if ($existing) {
        return $existing;
    }

    // The deal value was snapshotted when the lead was marked delivered, and
    // is already boat-plus-options before shipping and VAT.
    $base = (int) ($lead['deal_value_minor'] ?? 0);
    $attribution = 'finder';               // staff confirm Closer explicitly
    $rate = commission_rate($lead['ambassador_id'], $attribution);

    $id = new_id();
    db_run(
        'INSERT INTO commissions
           (id, lead_id, ambassador_id, attribution, base_minor, currency, rate, amount_minor,
            status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
            $id, $lead['id'], $lead['ambassador_id'], $attribution,
            $base, $lead['deal_currency'] ?? 'EUR', $rate,
            (int) round($base * $rate), 'pending', now(), now(),
        ]
    );

    audit($actorId, 'commission_created', 'commission', $id, [
        'lead' => $lead['id'], 'base' => $base, 'rate' => $rate,
    ]);

    return db_one('SELECT * FROM commissions WHERE id = ?', [$id]);
}

/** What is actually owed: an override if one was set, otherwise the sum. */
function commission_payable(array $c): int
{
    if ($c['override_minor'] !== null) {
        return (int) $c['override_minor'];
    }
    $rate = $c['override_rate'] !== null ? (float) $c['override_rate'] : (float) $c['rate'];
    return (int) round(((int) $c['base_minor']) * $rate);
}

/** Sets Finder or Closer, and recalculates — only while still pending. */
function commission_set_attribution(array $user, string $id, string $attribution): array
{
    if (!can($user, 'commission', 'scoped')) {
        fail('You do not have access to that.', 403);
    }
    if (!in_array($attribution, ['finder', 'closer'], true)) {
        fail('Attribution must be finder or closer.', 422);
    }

    $c = db_one('SELECT * FROM commissions WHERE id = ?', [$id]);
    if (!$c) {
        fail('That commission does not exist.', 404);
    }
    // Once approved, the figure has been agreed with somebody. Changing it
    // then is an override with a reason, not a quiet recalculation.
    if ($c['status'] !== 'pending') {
        fail('This commission has been approved. Use an override to change it.', 409);
    }

    $rate = commission_rate($c['ambassador_id'], $attribution);
    db_run(
        'UPDATE commissions SET attribution = ?, rate = ?, amount_minor = ?, updated_at = ? WHERE id = ?',
        [$attribution, $rate, (int) round(((int) $c['base_minor']) * $rate), now(), $id]
    );

    audit($user['id'], 'commission_attribution_set', 'commission', $id, [
        'attribution' => $attribution, 'rate' => $rate,
    ]);
    return db_one('SELECT * FROM commissions WHERE id = ?', [$id]);
}

/**
 * Moves a commission through pending -> approved -> paid.
 *
 * The payout happens outside the portal; only its status is tracked here
 * (FR-COMM-050).
 */
function commission_set_status(array $user, string $id, string $status, ?string $payoutRef = null): array
{
    if (!can($user, 'commission', 'scoped')) {
        fail('You do not have access to that.', 403);
    }
    if (!in_array($status, COMMISSION_STATUSES, true)) {
        fail('Unknown commission status.', 422);
    }

    $c = db_one('SELECT * FROM commissions WHERE id = ?', [$id]);
    if (!$c) {
        fail('That commission does not exist.', 404);
    }

    // Forward only, and one step at a time. Marking something paid that was
    // never approved skips the review the workflow exists to provide.
    $allowed = [
        'pending'   => ['approved', 'cancelled'],
        'approved'  => ['paid', 'cancelled'],
        'paid'      => [],
        'cancelled' => ['pending'],
    ];
    if ($status !== $c['status'] && !in_array($status, $allowed[$c['status']], true)) {
        fail("A commission cannot go from {$c['status']} to {$status}.", 409);
    }

    db_run(
        'UPDATE commissions
            SET status = ?,
                approved_by = ?, approved_at = ?,
                paid_at = ?, payout_ref = ?, updated_at = ?
          WHERE id = ?',
        [
            $status,
            $status === 'approved' ? $user['id'] : $c['approved_by'],
            $status === 'approved' ? now() : $c['approved_at'],
            $status === 'paid' ? now() : $c['paid_at'],
            $payoutRef ?? $c['payout_ref'],
            now(), $id,
        ]
    );

    audit($user['id'], 'commission_' . $status, 'commission', $id);
    notify_commission_status(db_one('SELECT * FROM commissions WHERE id = ?', [$id]), $status);

    return db_one('SELECT * FROM commissions WHERE id = ?', [$id]);
}

/** FR-COMM-060: depart from the calculation, on the record and with a reason. */
function commission_override(array $user, string $id, ?int $amountMinor, ?float $rate, string $reason): array
{
    // Deliberately narrower than the rest: overriding is a Founder's call,
    // not something the finance scope can do to its own numbers.
    if (!can($user, 'commission', 'full')) {
        fail('Only a Founder can override a commission.', 403);
    }
    if (trim($reason) === '') {
        fail('A reason is required to override a commission.', 422);
    }

    $c = db_one('SELECT * FROM commissions WHERE id = ?', [$id]);
    if (!$c) {
        fail('That commission does not exist.', 404);
    }
    if ($c['status'] === 'paid') {
        fail('This commission has been paid and can no longer be changed.', 409);
    }

    db_run(
        'UPDATE commissions
            SET override_minor = ?, override_rate = ?, override_reason = ?, overridden_by = ?, updated_at = ?
          WHERE id = ?',
        [$amountMinor, $rate, mb_substr(trim($reason), 0, 500), $user['id'], now(), $id]
    );

    audit($user['id'], 'commission_overridden', 'commission', $id, [
        'amount' => $amountMinor, 'rate' => $rate, 'reason' => $reason,
    ]);
    return db_one('SELECT * FROM commissions WHERE id = ?', [$id]);
}

/** Commissions this user may see: their own, or everyone's. */
function commission_list(array $user, array $filters = []): array
{
    $sql = 'SELECT c.*, l.full_name AS customer_name, u.full_name AS ambassador_name
            FROM commissions c
            JOIN leads l ON l.id = c.lead_id
            JOIN users u ON u.id = c.ambassador_id';
    $where = [];
    $params = [];

    if (!can_see_all($user, 'commission')) {
        if ($user['role'] !== 'ambassador') {
            return [];
        }
        $where[] = 'c.ambassador_id = ?';
        $params[] = $user['id'];
    }
    if (!empty($filters['status']) && in_array($filters['status'], COMMISSION_STATUSES, true)) {
        $where[] = 'c.status = ?';
        $params[] = $filters['status'];
    }
    if (!empty($filters['ambassador'])) {
        $where[] = 'c.ambassador_id = ?';
        $params[] = $filters['ambassador'];
    }
    if ($where) {
        $sql .= ' WHERE ' . implode(' AND ', $where);
    }

    return db_all($sql . ' ORDER BY c.created_at DESC LIMIT 500', $params);
}

/** Totals by status, for the dashboards (FR-AMB-130, FR-REP-010). */
function commission_totals(array $user): array
{
    $rows = commission_list($user);
    $totals = array_fill_keys(COMMISSION_STATUSES, ['count' => 0, 'amount' => 0]);
    $currency = 'EUR';

    foreach ($rows as $c) {
        $status = $c['status'];
        $totals[$status]['count']++;
        $totals[$status]['amount'] += commission_payable($c);
        $currency = $c['currency'];
    }

    return ['byStatus' => $totals, 'currency' => $currency];
}
