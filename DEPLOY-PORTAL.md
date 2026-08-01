# My Cresta portal — phase 1 (accounts & login)

Traditional email + password sign-in, with **both** the email address and the
mobile number confirmed before an account can be used, and a Cresta advisor
approving it. Runs on the same Hostinger MySQL database as the lead forms.

---

## 1. File layout on the server

```
/home/uXXXXXXX/
├── public_html/            ← the website (upload the build output here)
│   └── api/
│       ├── auth.php        ← login, register, verify, reset
│       └── accounts.php    ← approvals, role changes, staff creation
└── portal/                 ← NOT web-accessible. Upload the repo's portal/ here.
    ├── config.php          ← you create this from config.example.php
    ├── lib/
    ├── scripts/
    └── storage/            ← invoices and documents (phase 2)
```

**`portal/` must sit next to `public_html`, not inside it.** That is what keeps
your database password and customer documents off the public web. The API files
look for the library one level above the web root automatically.

---

## 2. Create the tables

hPanel → **Databases → phpMyAdmin** → select your database → **SQL** tab →
paste the contents of `portal/sql/001_auth.sql` → **Go**.

It is safe to run more than once.

---

## 3. Configure

Copy `portal/config.example.php` to `portal/config.php` and fill in:

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

## 4. Create your admin account

Over SSH (hPanel → Advanced → SSH Access):

```bash
php ~/portal/scripts/seed-admin.php "you@crestamarine.com" "Your Name" "+201001234567"
```

It prints a **one-time link**. Open it within 2 hours to choose your password.

No password is ever typed into the script, stored in the repo, or written to a
log. When you are done, delete the script from the server:

```bash
rm ~/portal/scripts/seed-admin.php
```

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
