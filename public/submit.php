<?php
/**
 * Cresta Marine — lead & access-request handler for static hosting (Hostinger).
 *
 * The static site posts JSON here from:
 *   - the configurator "Request a quote"  -> type: "lead"
 *   - the My Cresta registration / team    -> type: "access-request"
 *
 * It stores each submission in MySQL and emails you a notification. Tables are
 * created automatically on first use.
 *
 * SETUP: fill in the CONFIG block below with your Hostinger MySQL details and
 * the email address that should receive notifications. Nothing else to change.
 */

// ------------------------------------------------------------------ CONFIG ---
$DB_HOST   = 'localhost';                 // Hostinger MySQL host (usually localhost)
$DB_NAME   = 'REPLACE_WITH_DB_NAME';      // e.g. u123456789_cresta
$DB_USER   = 'REPLACE_WITH_DB_USER';      // e.g. u123456789_cresta
$DB_PASS   = 'REPLACE_WITH_DB_PASSWORD';  // the password you set in hPanel

$NOTIFY_TO   = 'info@crestamarine.com';   // where lead notifications are sent
$NOTIFY_FROM = 'no-reply@crestamarine.com'; // must be a mailbox on your domain
// -------------------------------------------------------------- END CONFIG ---

header('Content-Type: application/json; charset=utf-8');

// Only accept POST.
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

// Read JSON body.
$raw = file_get_contents('php://input');
$payload = json_decode($raw, true);
if (!is_array($payload)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid payload']);
    exit;
}

// Honeypot: bots fill the hidden "website" field. Pretend success, store nothing.
if (!empty($payload['website'])) {
    echo json_encode(['ok' => true]);
    exit;
}

$type = $payload['type'] ?? 'lead';

function clean($value, $max = 2000) {
    if (!is_string($value)) return null;
    $value = trim($value);
    if ($value === '') return null;
    return mb_substr($value, 0, $max);
}

function new_id() {
    return bin2hex(random_bytes(12));
}

// Connect to MySQL.
try {
    $pdo = new PDO(
        "mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4",
        $DB_USER,
        $DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Database connection failed']);
    exit;
}

// Ensure tables exist.
$pdo->exec(
    "CREATE TABLE IF NOT EXISTS leads (
        id VARCHAR(32) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(64) NOT NULL,
        provider VARCHAR(128),
        created_at DATETIME NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
);
$pdo->exec(
    "CREATE TABLE IF NOT EXISTS boat_configurations (
        id VARCHAR(32) PRIMARY KEY,
        lead_id VARCHAR(32) NOT NULL,
        model VARCHAR(64) NOT NULL,
        configuration_json LONGTEXT NOT NULL,
        created_at DATETIME NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
);
$pdo->exec(
    "CREATE TABLE IF NOT EXISTS access_requests (
        id VARCHAR(32) PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(64) NOT NULL,
        role VARCHAR(64),
        company VARCHAR(255),
        message TEXT,
        source VARCHAR(64),
        status VARCHAR(32) NOT NULL DEFAULT 'pending',
        created_at DATETIME NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
);

$now = gmdate('Y-m-d H:i:s');

function notify($to, $from, $subject, $lines) {
    $body = implode("\n", $lines);
    $headers = "From: Cresta Marine <$from>\r\n"
             . "Content-Type: text/plain; charset=utf-8\r\n";
    @mail($to, $subject, $body, $headers);
}

try {
    if ($type === 'access-request') {
        $fullName = clean($payload['fullName'] ?? null, 255);
        $email    = clean($payload['email'] ?? null, 255);
        $phone    = clean($payload['phone'] ?? null, 64);
        if (!$fullName || !$email || !$phone) {
            http_response_code(422);
            echo json_encode(['ok' => false, 'error' => 'Missing required fields']);
            exit;
        }
        $id = new_id();
        $stmt = $pdo->prepare(
            "INSERT INTO access_requests
                (id, full_name, email, phone, role, company, message, source, status, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)"
        );
        $stmt->execute([
            $id,
            $fullName,
            $email,
            $phone,
            clean($payload['role'] ?? null, 64),
            clean($payload['company'] ?? null, 255),
            clean($payload['message'] ?? null, 4000),
            clean($payload['source'] ?? null, 64),
            $now,
        ]);

        notify($NOTIFY_TO, $NOTIFY_FROM, 'New Cresta access request', [
            "Name:    $fullName",
            "Email:   $email",
            "Phone:   $phone",
            'Role:    ' . ($payload['role'] ?? '-'),
            'Company: ' . ($payload['company'] ?? '-'),
            'Source:  ' . ($payload['source'] ?? '-'),
            'Message: ' . ($payload['message'] ?? '-'),
        ]);

        echo json_encode(['ok' => true, 'id' => $id]);
        exit;
    }

    // Default: configurator quote request (type "lead").
    $name  = clean($payload['name'] ?? null, 255);
    $email = clean($payload['email'] ?? null, 255);
    $phone = clean($payload['phone'] ?? null, 64);
    if (!$name || !$email || !$phone) {
        http_response_code(422);
        echo json_encode(['ok' => false, 'error' => 'Missing required fields']);
        exit;
    }

    $leadId = new_id();
    $stmt = $pdo->prepare(
        "INSERT INTO leads (id, name, email, phone, provider, created_at)
         VALUES (?, ?, ?, ?, ?, ?)"
    );
    $stmt->execute([
        $leadId,
        $name,
        $email,
        $phone,
        clean($payload['provider'] ?? null, 128),
        $now,
    ]);

    $configuration = $payload['configuration'] ?? null;
    $model = '-';
    if (is_array($configuration)) {
        $model = isset($configuration['model']) && is_string($configuration['model'])
            ? mb_substr($configuration['model'], 0, 64)
            : '-';
        $stmt = $pdo->prepare(
            "INSERT INTO boat_configurations (id, lead_id, model, configuration_json, created_at)
             VALUES (?, ?, ?, ?, ?)"
        );
        $stmt->execute([
            new_id(),
            $leadId,
            $model,
            json_encode($configuration, JSON_UNESCAPED_UNICODE),
            $now,
        ]);
    }

    notify($NOTIFY_TO, $NOTIFY_FROM, 'New Cresta configuration / quote request', [
        "Name:  $name",
        "Email: $email",
        "Phone: $phone",
        "Model: $model",
        '',
        'A full configuration was saved to the boat_configurations table.',
    ]);

    echo json_encode(['ok' => true, 'id' => $leadId]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Could not save submission']);
}
