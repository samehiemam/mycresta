<?php
/**
 * TEMPORARY — reports which database settings the RUNNING app is actually using.
 *
 * Two panels manage these variables and they have been overwriting each other,
 * so "the panel shows X" is not evidence the deployed app sees X. This answers
 * that directly.
 *
 * Values are returned as short one-way fingerprints, never in clear: enough to
 * compare against what is expected, useless to anyone else. Delete this file
 * once the connection works.
 */

declare(strict_types=1);

foreach ([__DIR__ . '/../../portal/lib', __DIR__ . '/../../../portal/lib', __DIR__ . '/../portal/lib'] as $lib) {
    if (is_dir($lib)) {
        require_once $lib . '/db.php';
        break;
    }
}

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$fp = static fn(string $value): string => $value === ''
    ? 'EMPTY'
    : substr(hash('sha256', $value), 0, 10);

$db = cresta_config()['db'];

echo json_encode([
    // The host is worth seeing plainly — it is the setting that keeps reverting.
    'host'        => $db['host'],
    'nameFinger'  => $fp((string) $db['name']),
    'userFinger'  => $fp((string) $db['user']),
    'passFinger'  => $fp((string) $db['pass']),
    'passLength'  => strlen((string) $db['pass']),
    'source'      => is_file(__DIR__ . '/../../portal/config.php') ? 'config.php' : 'environment',
]);
