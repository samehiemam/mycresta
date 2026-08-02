<?php
/**
 * Configuration pricing.
 *
 * Deliberately a pure calculation over line items and settings: no database,
 * no session, no formatting. Everything that decides what a customer owes is
 * therefore testable directly, and there is exactly one place to look when a
 * total is disputed.
 *
 * The rules it encodes, none of which are inferred:
 *
 *   - The boat and its options are the commission base, taken before shipping
 *     and VAT (FR-COMM-010).
 *   - Only a Founder sets a discount or a shipping cost. Until shipping is
 *     set it is "to be confirmed", never zero — zero is a promise.
 *   - VAT applies to everything: boat, options, shipping and services.
 *   - Money never leaves its own currency. The boat is quoted in EUR, flag
 *     registration and marine agency in USD, local services in EGP, and no
 *     total silently mixes them.
 */

declare(strict_types=1);

/** Line kinds, in the order a quote reads. */
const LINE_BASE     = 'base';
const LINE_OPTION   = 'option';
const LINE_SERVICE  = 'service';
const LINE_SHIPPING = 'shipping';

/**
 * Prices a configuration.
 *
 * @param array $lines    each ['kind','name','amount_minor','currency','on_request'?]
 * @param array $settings ['vat_rate'=>float,'discount_minor'=>int,'discount_currency'=>string]
 *
 * @return array the full breakdown, per currency, plus the commission base
 */
function price_configuration(array $lines, array $settings = []): array
{
    $vatRate         = (float) ($settings['vat_rate'] ?? 0.14);
    $discount        = (int) ($settings['discount_minor'] ?? 0);
    $discountCurrency = (string) ($settings['discount_currency'] ?? 'EUR');
    $shippingSet     = (bool) ($settings['shipping_set'] ?? false);

    $buckets = [];      // currency => ['boat'=>int,'shipping'=>int,'services'=>int]
    $unpriced = [];     // lines that carry no number yet

    foreach ($lines as $line) {
        $currency = strtoupper((string) ($line['currency'] ?? 'EUR'));
        $kind = (string) ($line['kind'] ?? LINE_OPTION);

        $buckets[$currency] ??= ['boat' => 0, 'shipping' => 0, 'services' => 0];

        // An item priced "on request" contributes nothing and taints the
        // total, which is then reported as provisional rather than final.
        if (!empty($line['on_request'])) {
            $unpriced[] = ['name' => (string) $line['name'], 'kind' => $kind];
            continue;
        }

        $amount = (int) ($line['amount_minor'] ?? 0);
        $slot = match ($kind) {
            LINE_SHIPPING => 'shipping',
            LINE_SERVICE  => 'services',
            default       => 'boat',      // base and options together
        };
        $buckets[$currency][$slot] += $amount;
    }

    // The commission base: boat and options only, before shipping and VAT.
    $commissionCurrency = $settings['commission_currency'] ?? 'EUR';
    $commissionGross = $buckets[$commissionCurrency]['boat'] ?? 0;

    // A discount reduces what the customer actually pays, so it reduces the
    // base the commission is drawn from. The brief fixed the base as "boat
    // plus options" without saying which side of a discount that falls, and
    // paying commission on money nobody received is the worse mistake — but
    // both figures are returned so the decision can be changed in one place.
    $discountApplied = min($discount, $buckets[$discountCurrency]['boat'] ?? 0);
    $commissionNet = max(0, $commissionGross - ($discountCurrency === $commissionCurrency ? $discountApplied : 0));

    $currencies = [];
    $provisional = $unpriced !== [] || !$shippingSet;

    foreach ($buckets as $currency => $bucket) {
        $discountHere = $currency === $discountCurrency ? $discountApplied : 0;
        $net = $bucket['boat'] - $discountHere + $bucket['shipping'] + $bucket['services'];
        // VAT applies to everything, shipping and services included.
        $vat = (int) round($net * $vatRate);

        $currencies[$currency] = [
            'boat_and_options' => $bucket['boat'],
            'discount'         => $discountHere,
            'shipping'         => $bucket['shipping'],
            'services'         => $bucket['services'],
            'net'              => $net,
            'vat'              => $vat,
            'total'            => $net + $vat,
        ];
    }

    ksort($currencies);

    return [
        'currencies'      => $currencies,
        'vat_rate'        => $vatRate,
        'shipping_set'    => $shippingSet,
        'unpriced'        => $unpriced,
        // True when a figure here is not yet the final word: an item is priced
        // on request, or shipping has not been set. The UI must say so rather
        // than present a confident number.
        'provisional'     => $provisional,
        'commission_base' => [
            'currency' => $commissionCurrency,
            'gross'    => $commissionGross,
            'net'      => $commissionNet,
        ],
    ];
}

/**
 * Strips everything a role may not see (FR-CFG-010 onward).
 *
 * Ambassadors and Advisors get prices and totals; discounts, the commission
 * base and anything resembling margin are removed from the payload entirely
 * rather than hidden by the client, because a hidden field is still a field
 * that was sent.
 */
function pricing_for_role(array $priced, array $user): array
{
    if (can($user, 'catalog', 'full')) {
        return $priced;           // Founder sees everything
    }

    $isAmbassador = $user['role'] === 'ambassador';

    foreach ($priced['currencies'] as $currency => $figures) {
        unset($figures['discount']);
        // The net line only exists to show a discount's effect; without the
        // discount it invites the question "net of what?".
        unset($figures['net']);
        $priced['currencies'][$currency] = $figures;
    }

    // An ambassador sees their own commission elsewhere, against a delivered
    // deal — never as a live figure while they are quoting.
    unset($priced['commission_base']);

    if (!$isAmbassador) {
        return $priced;
    }

    return $priced;
}

/**
 * Renders an amount for display.
 *
 * "To be confirmed" is a first-class outcome. Shipping is variable per
 * configuration and only a Founder sets it; showing zero, or a blank, would
 * read as "included".
 */
function money_text(?int $minor, string $currency, bool $confirmed = true): string
{
    if (!$confirmed || $minor === null) {
        return 'To be confirmed';
    }
    return $currency . ' ' . number_format($minor / 100, 2, '.', ',');
}
