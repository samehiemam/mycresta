<?php
/**
 * Catalog persistence and reads.
 *
 * A price list is the shipyard's word on what a boat costs, so re-importing
 * one replaces that model's options wholesale rather than trying to merge.
 * That is only safe because a configuration snapshots its own line items —
 * name and price as quoted — instead of pointing at catalog rows that can move
 * underneath it. A quote sent last month must still read the same next year.
 */

declare(strict_types=1);

/** Finds a brand by slug, creating it on first use. */
function catalog_brand(string $slug, string $name): string
{
    $row = db_one('SELECT id FROM brands WHERE slug = ?', [$slug]);
    if ($row) {
        return $row['id'];
    }

    $id = new_id();
    db_run(
        'INSERT INTO brands (id, slug, name, active, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, 1, 0, ?, ?)',
        [$id, $slug, $name, now(), now()]
    );
    return $id;
}

/**
 * Writes a parsed price list into the catalog.
 *
 * Everything happens in one transaction: a half-imported model would price
 * boats wrongly, which is worse than not importing at all.
 *
 * @param array $parsed the return of parse_price_list()
 */
function catalog_apply_import(
    array $parsed,
    string $brandSlug,
    string $brandName,
    string $filename,
    string $fileHash,
    ?string $actorId = null
): array {
    if (empty($parsed['model']['name']) || $parsed['model']['base_amount'] === null) {
        throw new RuntimeException('That price list has no model name or base price.');
    }

    $modelName = $parsed['model']['name'];
    $modelSlug = slugify($modelName);

    db()->beginTransaction();
    try {
        $brandId = catalog_brand($brandSlug, $brandName);

        $existing = db_one('SELECT id FROM models WHERE slug = ?', [$modelSlug]);
        $modelId = $existing['id'] ?? new_id();

        if ($existing) {
            db_run(
                'UPDATE models SET brand_id = ?, name = ?, base_amount = ?, base_currency = ?, updated_at = ?
                 WHERE id = ?',
                [$brandId, $modelName, $parsed['model']['base_amount'], $parsed['model']['base_currency'], now(), $modelId]
            );
            // Replaced, not merged — see the note at the top of this file.
            db_run('DELETE FROM option_rules WHERE option_id IN (SELECT id FROM options WHERE model_id = ?)', [$modelId]);
            db_run('DELETE FROM options WHERE model_id = ?', [$modelId]);
            db_run('DELETE FROM option_groups WHERE model_id = ?', [$modelId]);
            db_run('DELETE FROM model_specs WHERE model_id = ?', [$modelId]);
            db_run('DELETE FROM model_standard_equipment WHERE model_id = ?', [$modelId]);
        } else {
            db_run(
                'INSERT INTO models (id, brand_id, slug, name, status, base_amount, base_currency, sort_order, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)',
                [$modelId, $brandId, $modelSlug, $modelName, 'active',
                 $parsed['model']['base_amount'], $parsed['model']['base_currency'], now(), now()]
            );
        }

        foreach ($parsed['specs'] as $i => $spec) {
            db_run(
                'INSERT INTO model_specs (id, model_id, label, value_text, value_num, unit, sort_order)
                 VALUES (?, ?, ?, ?, ?, ?, ?)',
                [new_id(), $modelId, $spec['label'], $spec['value_text'], $spec['value_num'], $spec['unit'], $i]
            );
        }

        foreach ($parsed['standard'] as $i => $label) {
            db_run(
                'INSERT INTO model_standard_equipment (id, model_id, label, sort_order) VALUES (?, ?, ?, ?)',
                [new_id(), $modelId, $label, $i]
            );
        }

        // Rules name their target in words ("Inboard"), so options are indexed
        // by name and subgroup as they are written and resolved afterwards.
        $optionsByName = [];
        $optionsBySubgroup = [];
        $pendingRules = [];

        foreach ($parsed['groups'] as $g => $group) {
            $groupId = new_id();
            db_run(
                'INSERT INTO option_groups (id, model_id, parent_id, name, selection, note, sort_order)
                 VALUES (?, ?, NULL, ?, ?, ?, ?)',
                [$groupId, $modelId, $group['name'], $group['selection'], $group['note'] ?? null, $g]
            );

            foreach ($group['options'] as $option) {
                $optionId = new_id();
                db_run(
                    'INSERT INTO options
                       (id, group_id, model_id, name, amount_minor, currency, price_on_request,
                        subgroup, active, sort_order, created_at, updated_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)',
                    [$optionId, $groupId, $modelId, $option['name'], $option['amount_minor'],
                     $option['currency'], $option['price_on_request'] ? 1 : 0,
                     $option['subgroup'], $option['sort_order'], now(), now()]
                );

                $optionsByName[mb_strtolower($option['name'])] = $optionId;
                if ($option['subgroup']) {
                    $optionsBySubgroup[mb_strtolower($option['subgroup'])][] = $optionId;
                }
                foreach ($option['rules'] as $rule) {
                    $pendingRules[] = $rule + ['option_id' => $optionId];
                }
            }
        }

        $unresolved = [];
        foreach ($pendingRules as $rule) {
            // Every rule lands unconfirmed: a rule the parser invented would
            // quietly allow a boat that cannot be built.
            db_run(
                'INSERT INTO option_rules
                   (id, option_id, rule_type, target_kind, target_value, source_text, confirmed, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, 0, ?)',
                [new_id(), $rule['option_id'], $rule['rule_type'], $rule['target_kind'],
                 $rule['target_value'], $rule['source_text'] ?? null, now()]
            );

            $target = mb_strtolower($rule['target_value']);
            $known = $rule['target_kind'] === 'subgroup'
                ? isset($optionsBySubgroup[$target])
                : isset($optionsByName[$target]);
            if (!$known) {
                $unresolved[] = $rule['target_value'];
            }
        }

        $summary = sprintf(
            '%d specs, %d standard items, %d groups, %d options, %d rules',
            count($parsed['specs']),
            count($parsed['standard']),
            count($parsed['groups']),
            array_sum(array_map(fn(array $g): int => count($g['options']), $parsed['groups'])),
            count($pendingRules)
        );

        $warnings = $parsed['warnings'];
        foreach (array_unique($unresolved) as $target) {
            $warnings[] = "Rule target \"{$target}\" matched no option or subgroup; it will not restrict anything until corrected.";
        }

        db_run(
            'INSERT INTO catalog_imports (id, model_id, filename, file_sha256, imported_by, summary, warnings, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [new_id(), $modelId, $filename, $fileHash, $actorId, $summary,
             $warnings ? json_encode($warnings, JSON_UNESCAPED_UNICODE) : null, now()]
        );

        db()->commit();

        return ['model_id' => $modelId, 'summary' => $summary, 'warnings' => $warnings];
    } catch (Throwable $e) {
        db()->rollBack();
        throw $e;
    }
}

/** A URL-safe key derived from a name. */
function slugify(string $text): string
{
    $slug = strtolower(trim($text));
    $slug = preg_replace('/[^a-z0-9]+/', '-', $slug) ?? $slug;
    return trim($slug, '-');
}

/** Brands with their active model counts. */
function catalog_brands(): array
{
    return db_all(
        "SELECT b.id, b.slug, b.name, b.active,
                (SELECT COUNT(*) FROM models m WHERE m.brand_id = b.id AND m.status = 'active') AS model_count
         FROM brands b
         ORDER BY b.sort_order, b.name"
    );
}

/**
 * Models a user may see.
 *
 * FR-CAT-050: only staff see anything other than an active model, so a
 * discontinued price never reaches an ambassador or a prospect.
 */
function catalog_models(array $user, ?string $brandSlug = null): array
{
    $sql = 'SELECT m.id, m.slug, m.name, m.status, m.base_amount, m.base_currency,
                   b.slug AS brand_slug, b.name AS brand_name
            FROM models m
            JOIN brands b ON b.id = m.brand_id';
    $where = [];
    $params = [];

    if (!can($user, 'catalog', 'scoped')) {
        $where[] = "m.status = 'active'";
    }
    if ($brandSlug !== null) {
        $where[] = 'b.slug = ?';
        $params[] = $brandSlug;
    }
    if ($where) {
        $sql .= ' WHERE ' . implode(' AND ', $where);
    }

    return db_all($sql . ' ORDER BY b.sort_order, m.sort_order, m.name', $params);
}

/** One model with its specs, standard equipment, option groups and rules. */
function catalog_model(array $user, string $slug): ?array
{
    $model = db_one(
        'SELECT m.*, b.slug AS brand_slug, b.name AS brand_name
         FROM models m JOIN brands b ON b.id = m.brand_id
         WHERE m.slug = ?',
        [$slug]
    );
    if (!$model) {
        return null;
    }
    if ($model['status'] !== 'active' && !can($user, 'catalog', 'scoped')) {
        return null;
    }

    $modelId = $model['id'];
    $groups = db_all(
        'SELECT id, name, selection, note FROM option_groups WHERE model_id = ? ORDER BY sort_order',
        [$modelId]
    );
    $options = db_all(
        'SELECT id, group_id, name, amount_minor, currency, price_on_request, subgroup
         FROM options WHERE model_id = ? AND active = 1 ORDER BY sort_order',
        [$modelId]
    );
    $rules = db_all(
        'SELECT r.option_id, r.rule_type, r.target_kind, r.target_value, r.confirmed
         FROM option_rules r JOIN options o ON o.id = r.option_id
         WHERE o.model_id = ?',
        [$modelId]
    );

    $byGroup = [];
    foreach ($options as $option) {
        $byGroup[$option['group_id']][] = $option;
    }
    foreach ($groups as $i => $group) {
        $groups[$i]['options'] = $byGroup[$group['id']] ?? [];
    }

    return [
        'model'     => $model,
        'specs'     => db_all('SELECT label, value_text, value_num, unit FROM model_specs WHERE model_id = ? ORDER BY sort_order', [$modelId]),
        'standard'  => array_column(
            db_all('SELECT label FROM model_standard_equipment WHERE model_id = ? ORDER BY sort_order', [$modelId]),
            'label'
        ),
        'groups'    => $groups,
        'rules'     => $rules,
    ];
}
