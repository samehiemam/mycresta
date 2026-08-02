<?php
/**
 * Building, validating and reading configurations.
 *
 * Selection rules are enforced here rather than in the browser. A single-select
 * group holding two engines, or a generator sold against an inboard, is a boat
 * that cannot be built — and the customer would find out long after signing.
 */

declare(strict_types=1);

/** Settings read as a map, so a caller needs one query rather than eight. */
function settings_map(): array
{
    static $cache = null;
    if ($cache !== null) {
        return $cache;
    }
    $cache = [];
    foreach (db_all('SELECT setting_key, value FROM settings') as $row) {
        $cache[$row['setting_key']] = $row['value'];
    }
    return $cache;
}

function setting(string $key, string $default = ''): string
{
    return settings_map()[$key] ?? $default;
}

/**
 * Checks a set of chosen options against the model's rules.
 *
 * @return array human-readable problems; empty means the boat can be built
 */
function validate_selection(string $modelId, array $optionIds): array
{
    if (!$optionIds) {
        return [];
    }

    $placeholders = implode(',', array_fill(0, count($optionIds), '?'));
    $chosen = db_all(
        "SELECT o.id, o.name, o.subgroup, o.group_id, g.name AS group_name, g.selection
         FROM options o JOIN option_groups g ON g.id = o.group_id
         WHERE o.model_id = ? AND o.id IN ($placeholders)",
        array_merge([$modelId], $optionIds)
    );

    $problems = [];

    if (count($chosen) !== count(array_unique($optionIds))) {
        $problems[] = 'One or more selected options do not belong to this model.';
    }

    // A single-select group may hold one choice at most.
    $perGroup = [];
    foreach ($chosen as $option) {
        $perGroup[$option['group_id']][] = $option;
    }
    foreach ($perGroup as $options) {
        if ($options[0]['selection'] === 'single' && count($options) > 1) {
            $problems[] = sprintf(
                '%s allows one choice, but %d are selected: %s.',
                $options[0]['group_name'],
                count($options),
                implode(', ', array_column($options, 'name'))
            );
        }
    }

    // Compatibility rules, which the import read from the price list's prose.
    $rules = db_all(
        "SELECT r.*, o.name AS option_name
         FROM option_rules r JOIN options o ON o.id = r.option_id
         WHERE r.option_id IN ($placeholders)",
        $optionIds
    );

    foreach ($rules as $rule) {
        $target = mb_strtolower($rule['target_value']);

        // The option a rule belongs to is excluded from its own test. These
        // rules are read from the price list's prose, and the sentence lives
        // inside the option's name — "Electric grill (generator or converter
        // required)" contains the word "generator", so without this every
        // requirement satisfied itself and no rule ever fired.
        $others = [];
        foreach ($chosen as $option) {
            if ($option['id'] !== $rule['option_id']) {
                $others[] = $option;
            }
        }
        $otherNames = array_map('mb_strtolower', array_column($others, 'name'));
        $otherSubgroups = array_map('mb_strtolower', array_filter(array_column($others, 'subgroup')));

        $present = match ($rule['target_kind']) {
            // Substring both ways: the list says "shafts" where the subgroup
            // reads "Shafts (Diesel)".
            'subgroup' => (bool) array_filter(
                $otherSubgroups,
                fn(string $s): bool => str_contains($s, $target) || str_contains($target, $s)
            ),
            default    => (bool) array_filter($otherNames, fn(string $n): bool => str_contains($n, $target)),
        };

        if ($rule['rule_type'] === 'excludes' && $present) {
            $problems[] = sprintf('%s cannot be combined with %s.', $rule['option_name'], $rule['target_value']);
        }
        if ($rule['rule_type'] === 'requires' && !$present) {
            $problems[] = sprintf('%s requires %s to be selected.', $rule['option_name'], $rule['target_value']);
        }
    }

    return $problems;
}

/** Creates an empty configuration against a model. */
function config_create(array $user, string $modelSlug, ?string $leadId = null, ?string $name = null): string
{
    $model = db_one('SELECT id, status FROM models WHERE slug = ?', [$modelSlug]);
    if (!$model) {
        fail('That model does not exist.', 404);
    }
    if ($model['status'] !== 'active' && !can($user, 'catalog', 'scoped')) {
        fail('That model is not available.', 403);
    }

    $id = new_id();
    db_run(
        'INSERT INTO configurations
           (id, model_id, lead_id, created_by, ambassador_id, status, name, vat_rate, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
            $id, $model['id'], $leadId, $user['id'],
            $user['role'] === 'ambassador' ? $user['id'] : null,
            'draft', $name,
            (float) setting('vat_rate', '0.14'),
            now(), now(),
        ]
    );

    // The base boat is a line like any other, so the quote reads as one list.
    $base = db_one('SELECT name, base_amount, base_currency FROM models WHERE id = ?', [$model['id']]);
    db_run(
        'INSERT INTO configuration_items
           (id, configuration_id, kind, source_id, name, group_name, amount_minor, currency, on_request, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0)',
        [new_id(), $id, LINE_BASE, $model['id'], $base['name'] . ' — base', 'Base boat',
         $base['base_amount'], $base['base_currency']]
    );

    audit($user['id'], 'config_created', 'configuration', $id, ['model' => $modelSlug]);
    return $id;
}

/**
 * Replaces the chosen options, snapshotting name and price as quoted.
 *
 * Rejected outright when the selection is invalid: storing an impossible boat
 * and warning about it later means someone eventually quotes from it.
 */
function config_set_options(array $user, string $configId, array $optionIds): array
{
    $config = config_require($user, $configId, 'own');
    config_require_editable($config);

    $optionIds = array_values(array_unique(array_filter($optionIds)));
    $problems = validate_selection($config['model_id'], $optionIds);
    if ($problems) {
        return ['ok' => false, 'problems' => $problems];
    }

    db()->beginTransaction();
    try {
        db_run("DELETE FROM configuration_items WHERE configuration_id = ? AND kind = ?", [$configId, LINE_OPTION]);

        if ($optionIds) {
            $placeholders = implode(',', array_fill(0, count($optionIds), '?'));
            $options = db_all(
                "SELECT o.*, g.name AS group_name, g.sort_order AS group_sort
                 FROM options o JOIN option_groups g ON g.id = o.group_id
                 WHERE o.id IN ($placeholders)
                 ORDER BY g.sort_order, o.sort_order",
                $optionIds
            );
            $sort = 1;
            foreach ($options as $option) {
                db_run(
                    'INSERT INTO configuration_items
                       (id, configuration_id, kind, source_id, name, group_name, amount_minor, currency, on_request, sort_order)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [new_id(), $configId, LINE_OPTION, $option['id'], $option['name'], $option['group_name'],
                     $option['amount_minor'], $option['currency'], $option['price_on_request'], $sort++]
                );
            }
        }

        db_run('UPDATE configurations SET updated_at = ? WHERE id = ?', [now(), $configId]);
        db()->commit();
    } catch (Throwable $e) {
        db()->rollBack();
        throw $e;
    }

    audit($user['id'], 'config_options_set', 'configuration', $configId, ['count' => count($optionIds)]);
    return ['ok' => true, 'problems' => []];
}

/**
 * Sets discount and shipping. Founder only (FR-CFG).
 *
 * Shipping is variable per configuration and nobody else may invent it;
 * leaving it unset is a real state, not a missing value.
 */
function config_set_commercials(array $user, string $configId, array $values): void
{
    if (!can($user, 'catalog', 'full')) {
        fail('Only a Founder can set a discount or shipping cost.', 403);
    }
    $config = config_require($user, $configId, 'view');
    config_require_editable($config);

    $discount = max(0, (int) ($values['discount_minor'] ?? $config['discount_minor']));
    $shipping = array_key_exists('shipping_minor', $values)
        ? ($values['shipping_minor'] === null ? null : max(0, (int) $values['shipping_minor']))
        : ($config['shipping_minor'] === null ? null : (int) $config['shipping_minor']);

    db_run(
        'UPDATE configurations
            SET discount_minor = ?, discount_currency = ?, discount_reason = ?,
                shipping_minor = ?, shipping_currency = ?, updated_at = ?
          WHERE id = ?',
        [
            $discount,
            strtoupper((string) ($values['discount_currency'] ?? $config['discount_currency'])),
            $values['discount_reason'] ?? $config['discount_reason'],
            $shipping,
            strtoupper((string) ($values['shipping_currency'] ?? $config['shipping_currency'])),
            now(), $configId,
        ]
    );

    audit($user['id'], 'config_commercials_set', 'configuration', $configId, [
        'discount_minor' => $discount,
        'shipping_minor' => $shipping,
    ]);
}

/** Loads a configuration, enforcing who may see it. */
function config_require(array $user, string $configId, string $need = 'own'): array
{
    $config = db_one('SELECT * FROM configurations WHERE id = ?', [$configId]);
    if (!$config) {
        fail('That configuration does not exist.', 404);
    }

    if (can_see_all($user, 'configurator')) {
        return $config;          // Founder, Advisor
    }

    $mine = $config['created_by'] === $user['id']
        || ($config['ambassador_id'] !== null && $config['ambassador_id'] === $user['id'])
        || ($config['shared_with'] !== null && $config['shared_with'] === $user['id']);

    if (!$mine || !can($user, 'configurator', 'own')) {
        // Deliberately the same answer as a missing record: confirming that a
        // configuration exists tells an ambassador something about a rival's
        // deal.
        fail('That configuration does not exist.', 404);
    }

    // A prospect may look and comment, never edit.
    if ($need !== 'view' && $config['shared_with'] === $user['id'] && $user['role'] === 'customer') {
        fail('You can comment on this configuration, but not change it.', 403);
    }

    return $config;
}

/** An approved or superseded quote is a record, not a draft. */
function config_require_editable(array $config): void
{
    if (in_array($config['status'], ['approved', 'superseded'], true)) {
        fail('This configuration has been approved and can no longer be changed.', 409);
    }
}

/** The full configuration: lines, pricing, and what the viewer may see. */
function config_read(array $user, string $configId): array
{
    $config = config_require($user, $configId, 'view');

    $items = db_all(
        'SELECT kind, source_id, name, group_name, amount_minor, currency, on_request
         FROM configuration_items WHERE configuration_id = ? ORDER BY sort_order',
        [$configId]
    );

    $lines = array_map(fn(array $i): array => [
        'kind'         => $i['kind'],
        'name'         => $i['name'],
        'amount_minor' => (int) $i['amount_minor'],
        'currency'     => $i['currency'],
        'on_request'   => (bool) $i['on_request'],
    ], $items);

    if ($config['shipping_minor'] !== null) {
        $lines[] = [
            'kind'         => LINE_SHIPPING,
            'name'         => 'Shipping',
            'amount_minor' => (int) $config['shipping_minor'],
            'currency'     => $config['shipping_currency'],
        ];
    }

    $priced = price_configuration($lines, [
        'vat_rate'          => (float) $config['vat_rate'],
        'discount_minor'    => (int) $config['discount_minor'],
        'discount_currency' => $config['discount_currency'],
        'shipping_set'      => $config['shipping_minor'] !== null,
    ]);

    $model = db_one('SELECT slug, name FROM models WHERE id = ?', [$config['model_id']]);

    $payload = [
        'id'       => $config['id'],
        'status'   => $config['status'],
        'name'     => $config['name'],
        'model'    => $model,
        'items'    => $items,
        'pricing'  => pricing_for_role($priced, $user),
        'shipping' => [
            'set'      => $config['shipping_minor'] !== null,
            'amount'   => $config['shipping_minor'] === null ? null : (int) $config['shipping_minor'],
            'currency' => $config['shipping_currency'],
            'display'  => money_text(
                $config['shipping_minor'] === null ? null : (int) $config['shipping_minor'],
                $config['shipping_currency'],
                $config['shipping_minor'] !== null
            ),
        ],
    ];

    // The reason for a discount is a Founder's internal note.
    if (can($user, 'catalog', 'full')) {
        $payload['discount'] = [
            'amount'   => (int) $config['discount_minor'],
            'currency' => $config['discount_currency'],
            'reason'   => $config['discount_reason'],
        ];
    }

    return $payload;
}
