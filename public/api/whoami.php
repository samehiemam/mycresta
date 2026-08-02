<?php
/**
 * TEMPORARY — reports this server's outbound IP address.
 *
 * Used once, to find the address the app connects to MySQL from, so remote
 * database access can be granted to that single IP instead of to every host on
 * the internet. Delete this file once the grant is in place.
 *
 * It exposes nothing sensitive: the outbound IP of a public web server is
 * already visible to anything it connects to.
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$outbound = null;
foreach (['https://api.ipify.org', 'https://checkip.amazonaws.com'] as $service) {
    $ch = curl_init($service);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 8,
    ]);
    $response = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($response !== false && $status === 200) {
        $candidate = trim((string) $response);
        if (filter_var($candidate, FILTER_VALIDATE_IP)) {
            $outbound = $candidate;
            break;
        }
    }
}

echo json_encode([
    'outboundIp' => $outbound,
    'serverAddr' => $_SERVER['SERVER_ADDR'] ?? null,
    'hostname'   => gethostname(),
]);
