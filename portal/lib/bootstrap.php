<?php
/**
 * Shared entry setup for every public API endpoint.
 *
 * Errors are logged, never rendered: a stack trace would expose file paths,
 * SQL and configuration to anyone who can trigger it.
 */

declare(strict_types=1);

ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/http.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/notify.php';

// Install the tables on first use so a fresh deploy needs no manual SQL.
ensure_schema();

set_exception_handler(static function (Throwable $e): void {
    error_log('Cresta portal error: ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    if (!headers_sent()) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
    }
    // TEMPORARY: include the message so a failure can be diagnosed without
    // access to PHP's error log. Remove once the cause is found.
    echo json_encode([
        'ok'     => false,
        'error'  => 'Something went wrong. Please try again.',
        'detail' => $e->getMessage(),
        'where'  => basename($e->getFile()) . ':' . $e->getLine(),
    ]);
    exit;
});

set_error_handler(static function (int $severity, string $message, string $file = '', int $line = 0): bool {
    if (!(error_reporting() & $severity)) {
        return false;
    }
    throw new ErrorException($message, 0, $severity, $file, $line);
});
