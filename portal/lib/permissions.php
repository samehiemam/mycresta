<?php
/**
 * The permissions matrix from FRD section 3.2, as data.
 *
 * This is the single authority on who may do what. The UI hides what a user
 * cannot use, but hiding is decoration — every endpoint asks this file, because
 * a hidden button is still a URL anyone can type.
 */

declare(strict_types=1);

/** Modules, named as section 3.2 names them. */
const MODULES = [
    'user_management',
    'catalog',
    'pipeline',
    'commission',
    'documents',
    'service',
    'reporting',
    'configurator',
    'my_boats',
];

/** Access levels, weakest first. Order matters: at_least() compares by index. */
const ACCESS_ORDER = ['none', 'own', 'view', 'scoped', 'full'];

/**
 * Scopes an employee may hold (FR-EMP-020). These are what turn the FRD's
 * single "Employee" into the brief's Advisor, Finance and Boat Staff.
 */
const SCOPES = ['sales', 'service', 'finance', 'marketing', 'boat_staff'];

/**
 * Base matrix, straight from section 3.2.
 *
 * 'employee' is the floor for any member of staff; scopes raise it per module
 * in SCOPE_GRANTS below. An employee with no scope can see the business but
 * change nothing, which is the safe reading of "Scoped" for someone whose area
 * has not been assigned yet.
 */
const MATRIX = [
    //                    admin   employee  ambassador  customer
    'user_management' => ['full', 'none',   'none',     'none'],
    'catalog'         => ['full', 'view',   'view',     'view'],
    'pipeline'        => ['full', 'view',   'own',      'none'],
    'commission'      => ['full', 'none',   'own',      'none'],
    'documents'       => ['full', 'view',   'none',     'own'],
    'service'         => ['full', 'view',   'none',     'own'],
    'reporting'       => ['full', 'view',   'own',      'none'],
    'configurator'    => ['full', 'view',   'own',      'own'],
    'my_boats'        => ['full', 'view',   'none',     'own'],
];

/** Column index per role, matching MATRIX row order. */
const ROLE_COLUMN = ['admin' => 0, 'employee' => 1, 'ambassador' => 2, 'customer' => 3];

/**
 * What each scope raises for an employee.
 *
 * An Advisor (sales) runs the pipeline and builds configurations but never sees
 * commission administration — the brief keeps margin and payout away from the
 * people selling. Finance is the mirror image: commission and documents, no
 * catalog editing.
 */
const SCOPE_GRANTS = [
    'sales' => [
        'pipeline'     => 'scoped',
        'configurator' => 'scoped',
        'documents'    => 'scoped',
        'reporting'    => 'scoped',
    ],
    'finance' => [
        'commission' => 'scoped',
        'documents'  => 'scoped',
        'reporting'  => 'scoped',
    ],
    'service' => [
        'service'   => 'scoped',
        'my_boats'  => 'scoped',
        'documents' => 'scoped',
    ],
    'boat_staff' => [
        // Accounts and permissions exist now; the FR-BOAT tooling is P2, so
        // this deliberately grants sight of the boats and nothing more.
        'my_boats' => 'view',
        'service'  => 'view',
    ],
    'marketing' => [
        'catalog'   => 'view',
        'reporting' => 'view',
    ],
];

/** Every scope held by a user. Cheap, and cached for the request. */
function user_scopes(string $userId): array
{
    static $cache = [];
    if (isset($cache[$userId])) {
        return $cache[$userId];
    }
    $rows = db_all('SELECT scope FROM user_scopes WHERE user_id = ?', [$userId]);
    return $cache[$userId] = array_column($rows, 'scope');
}

/**
 * The access level a user has over a module: none | own | view | scoped | full.
 */
function access_level(array $user, string $module): string
{
    if (!in_array($module, MODULES, true)) {
        return 'none';
    }
    // Only an active account carries any authority at all. A pending or
    // disabled user may hold the admin role and still get nothing.
    if (!is_active($user)) {
        return 'none';
    }

    $column = ROLE_COLUMN[$user['role']] ?? null;
    if ($column === null) {
        return 'none';
    }
    $level = MATRIX[$module][$column];

    if ($user['role'] === 'employee') {
        foreach (user_scopes($user['id']) as $scope) {
            $granted = SCOPE_GRANTS[$scope][$module] ?? null;
            if ($granted !== null && access_at_least($granted, $level)) {
                $level = $granted;
            }
        }
    }

    return $level;
}

/** True when $have is at least as permissive as $need. */
function access_at_least(string $have, string $need): bool
{
    $h = array_search($have, ACCESS_ORDER, true);
    $n = array_search($need, ACCESS_ORDER, true);
    return $h !== false && $n !== false && $h >= $n;
}

/** True when the user may act on a module at the given level. */
function can(array $user, string $module, string $need = 'view'): bool
{
    return access_at_least(access_level($user, $module), $need);
}

/**
 * True when the user may reach records they do not own.
 *
 * 'own' is the level that means "your rows only", so anything above it is
 * permission to look across the business. Every caller that lists records uses
 * this to decide whether to add an ownership filter.
 */
function can_see_all(array $user, string $module): bool
{
    return access_at_least(access_level($user, $module), 'view');
}

/**
 * Guard for an endpoint. Ends the request unless the user qualifies.
 *
 * Returns the user so the caller can keep using it, which keeps the common
 * case to a single line at the top of a handler.
 */
function require_can(string $module, string $need = 'view'): array
{
    $user = require_user();
    if (!can($user, $module, $need)) {
        audit($user['id'], 'permission_denied', 'module', $module, ['needed' => $need]);
        fail('You do not have access to that.', 403);
    }
    return $user;
}

/** The whole matrix for one user, for the client to lay out its navigation. */
function permissions_for(array $user): array
{
    $out = [];
    foreach (MODULES as $module) {
        $out[$module] = access_level($user, $module);
    }
    return $out;
}
