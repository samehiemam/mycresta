<?php
/**
 * FR-CAT-040: reads a shipyard price list into catalog structures.
 *
 * The three Kumbra workbooks share one layout, and only their row offsets
 * differ, so nothing here is addressed by row number. The sheet is walked and
 * classified by what each row contains:
 *
 *   text in C, nothing in E   -> a heading
 *   text in C, a price in E   -> an option
 *
 * Column E is the list price. Column F is the shipyard's "Special offer",
 * which is deliberately ignored: an offer is a discount a Founder applies to
 * one configuration, not a property of the catalog.
 *
 * Nothing is written to the database here. The parse returns a structure and a
 * list of warnings for a Founder to review first, because a misread price is
 * worse than a failed import.
 */

declare(strict_types=1);

require_once __DIR__ . '/xlsx.php';

const PRICE_ON_REQUEST_WORDS = ['on request', 'a consultar', 'sur demande'];

/** Marks a heading whose options are mutually exclusive. */
const SINGLE_SELECT_MARKER = 'only 1 option can be selected';

/**
 * Parses one price list.
 *
 * @return array{model:array,specs:array,standard:array,groups:array,warnings:array}
 */
function parse_price_list(string $path, string $currency = 'EUR'): array
{
    $rows = xlsx_rows($path, $styles);
    $warnings = [];
    $previousRowWasHeading = false;

    $model = [
        'name'          => null,
        'base_amount'   => null,
        'base_currency' => $currency,
    ];
    $specs = [];
    $standard = [];
    $groups = [];

    $section = null;      // specs | standard | options
    $currentGroup = null; // index into $groups
    $sortWithinGroup = 0;

    foreach ($rows as $rowNumber => $cells) {
        $c = $cells['C'] ?? '';
        $style = $styles[$rowNumber]['C'] ?? '';
        $d = $cells['D'] ?? '';
        $e = $cells['E'] ?? '';
        $f = $cells['F'] ?? '';

        // The totals block ends the priced part of the sheet. Everything after
        // it is discounts, VAT and taxes, none of which is catalog data — VAT
        // is a platform setting and the discount belongs to a configuration.
        if (stripos($c, 'total - price list') === 0 || stripos($c, 'total price list') === 0) {
            break;
        }

        if (strcasecmp($c, 'Technical Specifications') === 0) {
            $section = 'specs';
            continue;
        }
        if (strcasecmp($c, 'Standard Equipment') === 0) {
            $section = 'standard';
            continue;
        }

        // "Kumbra 34 Standard | Price | Special offer" opens the priced part.
        if ($e !== '' && strcasecmp($e, 'Price') === 0) {
            $section = 'options';
            if (preg_match('/^(.*?)\s+Standard$/i', $c, $m)) {
                $model['name'] = trim($m[1]);
            } elseif ($c !== '') {
                $model['name'] = trim($c);
            }
            continue;
        }

        if ($section === 'specs') {
            // Two label/value pairs per row: C/D on the left, E/F on the right.
            if ($c !== '' && $d !== '') {
                $specs[] = spec_from($c, $d);
            }
            if ($e !== '' && $f !== '') {
                $specs[] = spec_from($e, $f);
            }
            continue;
        }

        if ($section === 'standard') {
            // Two columns of equipment names, no prices.
            foreach ([$c, $e] as $label) {
                if ($label !== '') {
                    $standard[] = $label;
                }
            }
            continue;
        }

        if ($section !== 'options' || $c === '') {
            continue;
        }

        // The base price sits in the options section but is not an option.
        if (stripos($c, 'base price') === 0) {
            $amount = money_to_minor($e);
            if ($amount === null) {
                $warnings[] = "Could not read the base price from \"{$e}\".";
            } else {
                $model['base_amount'] = $amount;
            }
            continue;
        }

        $price = money_to_minor($e);
        $onRequest = is_on_request($e);

        if ($price === null && !$onRequest) {
            // No price: this row is a heading. Whether it opens a new group or
            // a subheading inside the current one is decided by whether the
            // current group has collected any options yet — "Engine" is
            // immediately followed by "Outboard", while "Deck" is followed by
            // its own options.
            $isSingle = stripos($c, SINGLE_SELECT_MARKER) !== false;
            $name = clean_heading($c);

            // Two signals say a heading is a subheading rather than a new
            // group. It sits directly under another heading — "Outboard" under
            // "Engine" — or it is formatted like a subheading already seen in
            // this group, which is what catches "Inboard" arriving after the
            // outboard options. Getting this wrong on the engines would let a
            // configuration hold an outboard and an inboard at once.
            $followsHeading = $previousRowWasHeading;
            $matchesSibling = $currentGroup !== null
                && $style !== ''
                && in_array($style, $groups[$currentGroup]['subgroup_styles'], true);

            if ($currentGroup !== null && !$isSingle && ($followsHeading || $matchesSibling)) {
                $groups[$currentGroup]['subgroup'] = $name;
                if ($style !== '' && !in_array($style, $groups[$currentGroup]['subgroup_styles'], true)) {
                    $groups[$currentGroup]['subgroup_styles'][] = $style;
                }
                $previousRowWasHeading = true;
                continue;
            }

            $groups[] = [
                'name'            => $name,
                'selection'       => $isSingle ? 'single' : 'multi',
                'note'            => $isSingle ? trim($c) : null,
                'subgroup'        => null,
                'subgroup_styles' => [],
                'options'         => [],
            ];
            $currentGroup = array_key_last($groups);
            $sortWithinGroup = 0;
            $previousRowWasHeading = true;
            continue;
        }

        if ($currentGroup === null) {
            $warnings[] = "Skipped \"{$c}\": a priced row appeared before any heading.";
            continue;
        }

        $groups[$currentGroup]['options'][] = [
            'name'             => trim($c),
            'amount_minor'     => $onRequest ? 0 : $price,
            'currency'         => $currency,
            'price_on_request' => $onRequest,
            'subgroup'         => $groups[$currentGroup]['subgroup'],
            'rules'            => rules_from_text($c),
            'sort_order'       => $sortWithinGroup++,
        ];
        $previousRowWasHeading = false;
    }

    // A group split into drivetrain subheadings offers whole engine packages,
    // so exactly one is selectable. The sheets never say so — it is obvious to
    // a salesperson and invisible to a parser — so it is applied and flagged
    // rather than assumed silently.
    foreach ($groups as $index => $group) {
        $subgroups = array_unique(array_filter(array_column($group['options'], 'subgroup')));
        if (count($subgroups) > 1 && $group['selection'] !== 'single') {
            $groups[$index]['selection'] = 'single';
            $warnings[] = sprintf(
                'Set "%s" to single-select because it offers alternatives (%s). Confirm this is right.',
                $group['name'],
                implode(', ', $subgroups)
            );
        }
    }

    if ($model['name'] === null) {
        $warnings[] = 'No model name found; expected a "<model> Standard" heading beside "Price".';
    }
    if ($model['base_amount'] === null) {
        $warnings[] = 'No base price found; expected a "Base price with standard equipment" row.';
    }
    foreach ($groups as $group) {
        foreach ($group['options'] as $option) {
            foreach ($option['rules'] as $rule) {
                $warnings[] = sprintf(
                    'Compatibility rule read from "%s": %s "%s" — confirm before quoting.',
                    $option['name'],
                    $rule['rule_type'],
                    $rule['target_value']
                );
            }
        }
    }

    return [
        'model'     => $model,
        'specs'     => $specs,
        'standard'  => $standard,
        'groups'    => array_values(array_filter($groups, fn(array $g): bool => (bool) $g['options'])),
        'warnings'  => $warnings,
    ];
}

/** A heading without its parenthetical instruction to the salesperson. */
function clean_heading(string $text): string
{
    $text = preg_replace('/\s*\((?:[^()]*only 1 option[^()]*)\)\s*/i', '', $text) ?? $text;
    return trim(rtrim(trim($text), ':'));
}

/** Splits "Overall Length (with platform)" / "10,40 m" into a stored spec. */
function spec_from(string $label, string $value): array
{
    $unit = null;
    $number = null;

    // European decimals: "10,40 m" is ten point four, and "6.000 Kg" is six
    // thousand. Read the separators rather than assuming a locale.
    if (preg_match('/^\s*([\d.,]+)\s*([A-Za-z%]*)/', $value, $m)) {
        $raw = $m[1];
        $unitText = strtolower($m[2]);

        if (str_contains($raw, ',')) {
            $normalised = str_replace(['.', ','], ['', '.'], $raw);
        } elseif (preg_match('/^\d{1,3}(\.\d{3})+$/', $raw)) {
            $normalised = str_replace('.', '', $raw);   // 6.000 -> 6000
        } else {
            $normalised = $raw;
        }

        if (is_numeric($normalised)) {
            $number = (float) $normalised;
        }
        $unit = match ($unitText) {
            'm'              => 'm',
            'kg'             => 'kg',
            // The 43 states displacement in tonnes where the 34 uses kilos.
            't'              => 't',
            'l'              => 'l',
            'hp'             => 'hp',
            'knots', 'knot'  => 'kn',
            'pax'            => 'pax',
            default          => null,
        };
    }

    return [
        'label'      => trim(rtrim(trim($label), ':')),
        'value_text' => trim($value),
        'value_num'  => $number,
        'unit'       => $unit,
    ];
}

/** True when the sheet says a price is quoted separately. */
function is_on_request(string $value): bool
{
    $needle = strtolower(trim($value));
    foreach (PRICE_ON_REQUEST_WORDS as $word) {
        if ($needle !== '' && str_contains($needle, $word)) {
            return true;
        }
    }
    return false;
}

/**
 * Reads a price into minor units.
 *
 * Returns null for anything that is not a number, which is what lets the
 * caller treat an unpriced row as a heading.
 */
function money_to_minor(string $value): ?int
{
    $value = trim($value);
    if ($value === '' || !preg_match('/^[\d.,\s]+$/', $value)) {
        return null;
    }

    $clean = preg_replace('/\s+/', '', $value) ?? '';
    if (str_contains($clean, ',') && str_contains($clean, '.')) {
        // Whichever separator comes last is the decimal point.
        $clean = strrpos($clean, ',') > strrpos($clean, '.')
            ? str_replace(['.', ','], ['', '.'], $clean)
            : str_replace(',', '', $clean);
    } elseif (str_contains($clean, ',')) {
        // A comma with exactly two digits after it is a decimal; otherwise
        // it groups thousands.
        $clean = preg_match('/,\d{2}$/', $clean)
            ? str_replace(',', '.', $clean)
            : str_replace(',', '', $clean);
    } elseif (preg_match('/^\d{1,3}(\.\d{3})+$/', $clean)) {
        $clean = str_replace('.', '', $clean);
    }

    if (!is_numeric($clean)) {
        return null;
    }
    return (int) round(((float) $clean) * 100);
}

/**
 * Recognises the compatibility rules the lists state in prose.
 *
 * Only confident matches are returned, and every one is recorded unconfirmed
 * for a Founder to approve — a rule invented here would silently allow an
 * impossible boat to be quoted.
 */
function rules_from_text(string $text): array
{
    $rules = [];

    if (preg_match('/not compatible with ([^)]+)/i', $text, $m)) {
        $target = strtolower(trim($m[1]));
        $kind = 'subgroup';
        $value = trim($m[1]);

        if (str_contains($target, 'inboard')) {
            $value = 'Inboard';
        } elseif (str_contains($target, 'outboard')) {
            $value = 'Outboard';
        } elseif (str_contains($target, 'shaft')) {
            // The 43 offers shaft drives where the smaller boats say inboard.
            $value = 'Shafts';
        } else {
            $kind = 'option';
        }

        $rules[] = [
            'rule_type'    => 'excludes',
            'target_kind'  => $kind,
            'target_value' => $value,
            'source_text'  => trim($text),
        ];
    }

    if (preg_match('/\((generator or converter required)\)/i', $text, $m)) {
        $rules[] = [
            'rule_type'    => 'requires',
            'target_kind'  => 'option',
            'target_value' => 'Generator',
            'source_text'  => trim($m[1]),
        ];
    }

    return $rules;
}
