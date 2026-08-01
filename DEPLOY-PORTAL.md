# My Cresta portal — phase 1 (accounts & login)

Traditional email + password sign-in, with **both** the email address and the
mobile number confirmed before an account can be used, and a Cresta advisor
approving it. Runs on the same Hostinger MySQL database as the lead forms.

---

## 1. Where the portal library goes

The build now **ships `portal/` inside the output**, so a git-based deploy
carries it to the server automatically. You end up with:

```
public_html/
├── index.html, assets/, images/   ← the website
├── api/auth.php, api/accounts.php ← the endpoints
└── portal/                        ← library, shipped by the build
    ├── .htaccess                  ← denies all web access
    ├── config.php                 ← YOU create this on the server (never in git)
    ├── lib/  scripts/  sql/
    └── storage/                   ← invoices and documents (phase 2)
```

`config.php` and `storage/` are deliberately excluded from the build, so your
database password and customer documents never travel through the repository.

**More secure option:** move `portal/` up one level so it sits *beside*
`public_html` instead of inside it, and delete the copy in the web root. The API
looks in both places. Do this if you upload by FTP/File Manager rather than git.

Either way the folder is protected: `.htaccess` denies every request, and PHP
files are executed rather than shown, so `config.php` returns nothing to a
browser.

## 2. Create the tables — nothing to do

The portal installs its own tables the first time the API is called, so there
is no SQL step. (`portal/sql/001_auth.sql` is still there if you ever want to
run it by hand in phpMyAdmin.)

---

## 3. Configure

In hPanel → **File Manager**, copy `public_html/portal/config.example.php` to
`public_html/portal/config.php` and fill in:

```php
'db' => [
    'host' => 'localhost',
    'name' => 'u123456789_cresta',
    'user' => 'u123456789_cresta',
    'pass' => 'your database password',
],
'mail' => [
    'from'  => 'no-reply@crestamarine.com',
    'admin' => 'your@email.com',        // where new registrations are announced
],
'site_url' => 'https://www.crestamarine.com',
```

> Create `no-reply@crestamarine.com` in hPanel → **Emails** first. Codes and
> reset links sent "from" an address that does not exist usually land in spam.

`config.php` is gitignored — it must never be committed.

---

## 4. Create your admin account — no SSH needed

Put your own address in `admin_emails` in `config.php`:

```php
'admin_emails' => ['you@crestamarine.com'],
```

Then just **register normally at `/register`** with that address. When you enter
the code emailed to you, the account is promoted to admin and approved
automatically.

Registering with that address is *not* enough on its own — the emailed code has
to be entered — so nobody who does not control the mailbox can claim it.

> An SSH alternative still exists if you prefer it:
> `php ~/public_html/portal/scripts/seed-admin.php "you@..." "Your Name" "+20..."`

---

## 5. Mobile verification (SMS)

Out of the box the config uses `'driver' => 'manual'`: the code is generated and
stored, but **no SMS is sent**. The customer is told an advisor will confirm the
number, and the attempt is written to `audit_log`. Nothing breaks — you simply
confirm the number by WhatsApp/phone and approve the account.

To send codes automatically, sign up with an SMS gateway and set:

```php
'sms' => [
    'driver'   => 'http',
    'endpoint' => 'https://your-provider/api/send',
    'token'    => 'your api token',
    'sender'   => 'CrestaMarine',
],
```

The request sent is `POST {to, sender, message}` with a bearer token. Most
gateways match this; if yours differs, tell me the provider and I will adapt it.

---

## 6. How access works

| Step | Who | Result |
| --- | --- | --- |
| Register at `/register` | customer or ambassador | account created, `pending` |
| Confirm email + mobile at `/verify` | the user | both flags set |
| Approve at `/portal/accounts` | employee or admin | account becomes usable |

- **Employees cannot self-register.** An admin creates them, and the new user
  sets their own password from an emailed link.
- Only an **admin** can change roles; employees can approve and reject.
- Both checks are enforced **on the server** — hiding a button is not security.

Portal routes: `/login`, `/register`, `/verify`, `/forgot-password`,
`/reset-password`, `/portal` (customer), `/portal/team` (staff),
`/portal/accounts` (approvals), `/portal/ambassador`.

---

## 7. What is deliberately built in

- Passwords stored only as hashes (`password_hash`, bcrypt/argon2). A reset
  issues a new password; nobody can read the old one — including me.
- Session tokens stored hashed, so a database copy cannot be replayed as a login.
- Verification codes hashed, single-use, 15-minute expiry, max 6 guesses.
- Reset links single-use, 60 minutes, and **all sessions are dropped** after a
  reset.
- Login, registration and code sending are rate-limited per account and per IP.
- Registering with an address that already exists returns the *same* response as
  a new signup, so the form cannot be used to discover who has an account.
- Errors are logged, never displayed — no stack traces or SQL reach the browser.
- Every approval and role change is written to `audit_log`.

---

## 8. After deploying, check

1. `/register` → create a test account.
2. The code email arrives; enter it. (Mobile shows the manual-review message
   until you configure a gateway.)
3. Sign in as admin → `/portal/accounts` → approve the test account.
4. Sign in as the test account → `/portal` loads.
5. Try `/portal/accounts` as the test customer — you must get "You do not have
   access to this."
