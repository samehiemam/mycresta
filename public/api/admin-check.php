<?php
/**
 * TEMPORARY — reports whether the admin bootstrap is live, without revealing
 * which address is configured. Fingerprints only. Delete once confirmed.
 */
declare(strict_types=1);

foreach ([__DIR__ . '/../../portal/lib', __DIR__ . '/../../../portal/lib', __DIR__ . '/../portal/lib'] as $lib) {
    if (is_dir($lib)) { require_once $lib . '/db.php'; break; }
}
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$config = cresta_config();
$emails = array_map(static fn($e) => mb_strtolower(trim((string) $e)), $config['admin_emails'] ?? []);

echo json_encode([
    'autoconfirmOn'  => (bool) ($config['admin_autoconfirm'] ?? false),
    'adminCount'     => count($emails),
    'adminFingers'   => array_map(static fn($e) => substr(hash('sha256', $e), 0, 10), $emails),
    'configSource'   => is_file(__DIR__ . '/../portal/config.php') ? 'generated file' : 'environment',
]);
