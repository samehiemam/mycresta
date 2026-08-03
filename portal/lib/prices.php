<?php
/**
 * Configurator prices, and who is allowed to see one.
 *
 * These figures used to sit in app/configurator-data.ts, which meant they were
 * bundled into the JavaScript every visitor downloads. The configurator's
 * `prices` flag decided whether the browser drew them, and nothing decided
 * whether the browser received them — so the whole Kumbra price list was a
 * view-source away. This file is the other half of that fix: the numbers live
 * in the database, and a request that is not entitled to them is answered
 * without them rather than answered with them and asked not to look.
 *
 * Everything here is server-side by construction. There is no code path that
 * sends a price to a caller who has not passed can_see_prices() first.
 */

declare(strict_types=1);

/**
 * May this user see prices — optionally, on this particular configuration?
 *
 * Three independent grounds, in the order the brief describes them:
 *
 *   1. Founder. An admin always sees prices; that is the role's whole point.
 *   2. A per-account grant, switched on by a Founder. Off for everyone by
 *      default, including customers and ambassadors, and never implied by a
 *      role — the brief is "some clients can, some ambassadors can".
 *   3. An approved configuration, shared with this customer. Somebody who has
 *      been quoted has already seen the number. This ground is scoped to the
 *      one configuration and confers nothing anywhere else, which is why the
 *      configuration has to be passed in to claim it.
 */
function can_see_prices(?array $user, ?array $config = null): bool
{
    if (!$user) {
        return false;                       // anonymous: never
    }
    if (($user['role'] ?? '') === 'admin') {
        return true;                        // Founder
    }
    if (!empty($user['can_see_prices'])) {
        return true;                        // granted on the account
    }

    // Approved and shared with this person, and only for this configuration.
    if ($config
        && ($config['status'] ?? '') === 'approved'
        && !empty($config['shared_with'])
        && $config['shared_with'] === ($user['id'] ?? null)
    ) {
        return true;
    }

    return false;
}

/** Grants or revokes price visibility. Founder-only, and on the record. */
function set_price_visibility(array $actor, string $userId, bool $allowed): array
{
    if (($actor['role'] ?? '') !== 'admin') {
        fail('Only a Founder can change price visibility.', 403);
    }

    $target = db_one('SELECT * FROM users WHERE id = ?', [$userId]);
    if (!$target) {
        fail('That account does not exist.', 404);
    }

    db_run(
        'UPDATE users
            SET can_see_prices = ?, prices_granted_by = ?, prices_granted_at = ?, updated_at = ?
          WHERE id = ?',
        [$allowed ? 1 : 0, $allowed ? $actor['id'] : null, $allowed ? now() : null, now(), $userId]
    );

    audit($actor['id'], $allowed ? 'prices_granted' : 'prices_revoked', 'user', $userId);
    return db_one('SELECT * FROM users WHERE id = ?', [$userId]);
}

/**
 * The price list for one model, as the configurator wants it.
 *
 * Returns null — not an empty list — when the caller may not see prices, so a
 * caller cannot mistake "no prices for you" for "this boat is free".
 *
 * `on_request` and a missing row mean different things and are kept different:
 * an option that is offered but unpriced still has to appear in the quotation
 * as "on request", while one that is not offered for this model must not
 * appear at all.
 */
function configurator_prices(?array $user, string $modelKey, ?array $config = null): ?array
{
    if (!can_see_prices($user, $config)) {
        return null;
    }

    $rows = db_all(
        'SELECT item_kind, item_id, price_minor, on_request, currency
           FROM configurator_prices
          WHERE model_key = ?',
        [$modelKey]
    );

    $out = ['currency' => 'EUR', 'base' => null, 'engines' => [], 'equipment' => []];
    foreach ($rows as $row) {
        $value = $row['on_request']
            ? 'on-request'
            : (int) $row['price_minor'];

        if ($row['item_kind'] === 'base') {
            $out['base'] = $value;
            $out['currency'] = $row['currency'];
        } elseif ($row['item_kind'] === 'engine') {
            $out['engines'][$row['item_id']] = $value;
        } else {
            $out['equipment'][$row['item_id']] = $value;
        }
    }

    return $out;
}

/** Sets one price. Founder-only: this is the price list, not a preference. */
function set_configurator_price(
    array $actor,
    string $modelKey,
    string $kind,
    string $itemId,
    ?int $priceMinor,
    bool $onRequest = false
): void {
    if (($actor['role'] ?? '') !== 'admin') {
        fail('Only a Founder can change prices.', 403);
    }
    if (!in_array($kind, ['base', 'engine', 'equipment'], true)) {
        fail('Unknown price kind.', 422);
    }
    if ($priceMinor !== null && $priceMinor < 0) {
        fail('A price cannot be negative.', 422);
    }

    db_run(
        'INSERT INTO configurator_prices
           (model_key, item_kind, item_id, price_minor, on_request, currency, updated_by, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           price_minor = VALUES(price_minor),
           on_request  = VALUES(on_request),
           updated_by  = VALUES(updated_by),
           updated_at  = VALUES(updated_at)',
        [$modelKey, $kind, $itemId, $onRequest ? null : $priceMinor,
         $onRequest ? 1 : 0, 'EUR', $actor['id'], now()]
    );

    audit($actor['id'], 'price_set', 'configurator_price', "{$modelKey}/{$kind}/{$itemId}", [
        'price_minor' => $priceMinor, 'on_request' => $onRequest,
    ]);
}
