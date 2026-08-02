<?php
/**
 * A minimal SMTP client.
 *
 * PHP's mail() hands a message to whatever the server runs locally, which on
 * shared hosting will happily deliver a message addressed to a domain it
 * believes it hosts — straight into a mailbox that does not exist, never
 * following the domain's MX records out to the real provider. Mail to your own
 * domain then vanishes while mail to everyone else arrives, which is a
 * miserable thing to debug.
 *
 * Speaking SMTP to a named server removes the guesswork: the message goes
 * where we say, authenticated as us, and a refusal comes back as a sentence
 * rather than as silence.
 *
 * No library — shared hosting lets us install nothing — so this covers exactly
 * what sending a transactional email needs: STARTTLS or implicit TLS, AUTH
 * LOGIN, one recipient.
 */

declare(strict_types=1);

/**
 * Sends one message.
 *
 * @return array{ok:bool,error:?string,transcript:string[]}
 */
function smtp_send(array $config, string $to, string $subject, string $body): array
{
    $host = (string) ($config['host'] ?? '');
    $port = (int) ($config['port'] ?? 587);
    $user = (string) ($config['user'] ?? '');
    $pass = (string) ($config['pass'] ?? '');
    $from = (string) ($config['from'] ?? $user);
    $fromName = (string) ($config['from_name'] ?? 'Cresta Marine');
    // 'tls' upgrades a plain connection with STARTTLS; 'ssl' is encrypted from
    // the first byte, which is what port 465 expects.
    $secure = strtolower((string) ($config['secure'] ?? ($port === 465 ? 'ssl' : 'tls')));

    $transcript = [];
    $fail = static function (string $message) use (&$transcript): array {
        return ['ok' => false, 'error' => $message, 'transcript' => $transcript];
    };

    $endpoint = ($secure === 'ssl' ? 'ssl://' : '') . $host . ':' . $port;
    $context = stream_context_create([
        'ssl' => ['SNI_enabled' => true, 'peer_name' => $host],
    ]);

    $socket = @stream_socket_client(
        $endpoint,
        $errno,
        $errstr,
        (float) ($config['timeout'] ?? 12),
        STREAM_CLIENT_CONNECT,
        $context
    );
    if (!$socket) {
        // The common one on shared hosting: outbound SMTP ports are blocked,
        // and the connection simply never completes.
        return $fail("Cannot reach {$host}:{$port} — {$errstr} (" . (int) $errno . ')');
    }
    stream_set_timeout($socket, (int) ($config['timeout'] ?? 12));

    /** Reads a full multi-line reply and returns [code, text]. */
    $read = static function () use ($socket, &$transcript): array {
        $text = '';
        while (($line = fgets($socket, 1024)) !== false) {
            $text .= $line;
            // A hyphen after the code means more lines follow.
            if (strlen($line) < 4 || $line[3] !== '-') {
                break;
            }
        }
        $transcript[] = '< ' . trim($text);
        return [(int) substr(trim($text), 0, 3), trim($text)];
    };

    $write = static function (string $line, bool $secret = false) use ($socket, &$transcript): void {
        // Credentials are never written to the transcript; the transcript is
        // shown to an admin diagnosing delivery.
        $transcript[] = '> ' . ($secret ? '[redacted]' : $line);
        fwrite($socket, $line . "\r\n");
    };

    [$code] = $read();
    if ($code !== 220) {
        fclose($socket);
        return $fail('The mail server did not greet us.');
    }

    $ehlo = 'EHLO ' . (parse_url((string) ($config['site_url'] ?? 'localhost'), PHP_URL_HOST) ?: 'localhost');
    $write($ehlo);
    [$code] = $read();
    if ($code !== 250) {
        fclose($socket);
        return $fail('EHLO was refused.');
    }

    if ($secure === 'tls') {
        $write('STARTTLS');
        [$code] = $read();
        if ($code !== 220) {
            fclose($socket);
            return $fail('The server would not start TLS.');
        }
        if (!@stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
            fclose($socket);
            return $fail('The TLS handshake failed.');
        }
        // The greeting is repeated inside the encrypted channel.
        $write($ehlo);
        [$code] = $read();
        if ($code !== 250) {
            fclose($socket);
            return $fail('EHLO after TLS was refused.');
        }
    }

    if ($user !== '') {
        $write('AUTH LOGIN');
        [$code] = $read();
        if ($code !== 334) {
            fclose($socket);
            return $fail('The server did not offer AUTH LOGIN.');
        }
        $write(base64_encode($user), true);
        [$code] = $read();
        if ($code !== 334) {
            fclose($socket);
            return $fail('The username was rejected.');
        }
        $write(base64_encode($pass), true);
        [$code, $text] = $read();
        if ($code !== 235) {
            fclose($socket);
            // Apple wants an app-specific password here, not the account one.
            return $fail('Authentication failed: ' . $text);
        }
    }

    $write('MAIL FROM:<' . $from . '>');
    [$code, $text] = $read();
    if ($code !== 250) {
        fclose($socket);
        return $fail('The sender address was refused: ' . $text);
    }

    $write('RCPT TO:<' . $to . '>');
    [$code, $text] = $read();
    if ($code !== 250 && $code !== 251) {
        fclose($socket);
        return $fail('The recipient was refused: ' . $text);
    }

    $write('DATA');
    [$code] = $read();
    if ($code !== 354) {
        fclose($socket);
        return $fail('The server would not accept the message body.');
    }

    $headers = [
        'From: ' . smtp_encode_name($fromName) . ' <' . $from . '>',
        'To: <' . $to . '>',
        'Subject: ' . smtp_encode_header($subject),
        'Date: ' . gmdate('D, d M Y H:i:s') . ' +0000',
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=utf-8',
        'Content-Transfer-Encoding: 8bit',
        'Message-ID: <' . bin2hex(random_bytes(12)) . '@' . ($host ?: 'cresta') . '>',
    ];

    // A lone dot on a line ends the message, so any real one is doubled.
    $safeBody = preg_replace('/^\./m', '..', str_replace("\r\n", "\n", $body)) ?? $body;
    fwrite($socket, implode("\r\n", $headers) . "\r\n\r\n" . str_replace("\n", "\r\n", $safeBody) . "\r\n.\r\n");
    $transcript[] = '> [message body]';

    [$code, $text] = $read();
    if ($code !== 250) {
        fclose($socket);
        return $fail('The message was not accepted: ' . $text);
    }

    $write('QUIT');
    @fclose($socket);

    return ['ok' => true, 'error' => null, 'transcript' => $transcript];
}

/** RFC 2047 for anything outside ASCII. */
function smtp_encode_header(string $value): string
{
    return preg_match('/[^\x20-\x7E]/', $value)
        ? '=?UTF-8?B?' . base64_encode($value) . '?='
        : $value;
}

function smtp_encode_name(string $name): string
{
    if (preg_match('/[^\x20-\x7E]/', $name)) {
        return smtp_encode_header($name);
    }
    return '"' . str_replace('"', '', $name) . '"';
}
