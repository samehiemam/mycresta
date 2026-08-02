<?php
/**
 * Demo account management.
 *
 * Reachable two ways: by a signed-in Founder, or with a one-time setup token
 * held in CRESTA_DEMO_TOKEN. The token exists only because seeding has to be
 * possible before anyone can sign in to do it — remove the variable once the
 * accounts are made, and the door closes.
 *
 * Passwords are generated here and returned once. Nothing stores the plaintext,
 * so a lost one is reset by seeding again rather than recovered.
 */

declare(strict_types=1);

$libCandidates = [
    __DIR__ . '/../../portal/lib',
    __DIR__ . '/../../../portal/lib',
    __DIR__ . '/../portal/lib',
];
foreach ($libCandidates as $lib) {
    if (is_dir($lib)) {
        require_once $lib . '/bootstrap.php';
        require_once $lib . '/pricing.php';
        require_once $lib . '/configurations.php';
        require_once $lib . '/demo.php';
        break;
    }
}
if (!function_exists('db')) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['ok' => false, 'error' => 'The portal is not installed on this server yet.']);
    exit;
}

$action = $_GET['action'] ?? 'status';

/**
 * Authorises the caller, and says which way they got in.
 *
 * The token is compared with hash_equals so a wrong guess takes the same time
 * as a right one.
 */
function demo_actor(): array
{
    $expected = (string) (getenv('CRESTA_DEMO_TOKEN')
        ?: ($_ENV['CRESTA_DEMO_TOKEN'] ?? $_SERVER['CRESTA_DEMO_TOKEN'] ?? ''));
    $sent = (string) ($_SERVER['HTTP_X_DEMO_TOKEN'] ?? '');

    if ($expected !== '' && $sent !== '' && hash_equals($expected, $sent)) {
        return ['id' => null, 'via' => 'token'];
    }

    $user = current_user();
    if ($user && is_active($user) && can($user, 'user_management', 'full')) {
        return ['id' => $user['id'], 'via' => 'founder'];
    }

    fail('Demo management needs a Founder sign-in or a valid setup token.', 403);
}

switch ($action) {
    case 'status': {
        demo_actor();
        json_out(['ok' => true, 'accounts' => demo_status()]);
    }

    case 'seed': {
        require_method('POST');
        $actor = demo_actor();
        // A Founder acting through the browser still needs the CSRF token; the
        // token route is a server-to-server call and has no cookie to forge.
        if ($actor['via'] === 'founder') {
            require_csrf();
        }
        json_out([
            'ok' => true,
            'accounts' => demo_seed($actor['id']),
            'note' => 'Passwords are shown once. Seed again to reset them.',
        ]);
    }

    case 'remove': {
        require_method('POST');
        $actor = demo_actor();
        if ($actor['via'] === 'founder') {
            require_csrf();
        }
        json_out(['ok' => true, 'removed' => demo_remove($actor['id'])]);
    }

    default:
        fail('Unknown action.', 404);
}
