# Deploying Cresta Marine to Hostinger (static site + PHP/MySQL)

This is the **static** version of the site. It runs on ordinary Hostinger
shared/web hosting — no Node, no Cloudflare. Lead and access-request forms are
handled by `submit.php` writing to a MySQL database on the same host.

---

## 1. Build the site

On your machine, in the project folder:

```bash
npm install
npm run build:static
```

This creates a `dist-static/` folder containing the whole website:
`index.html`, an `assets/` folder, all the `images/` and `brochures/`,
`.htaccess`, and `submit.php`.

> Everything you upload to Hostinger comes from `dist-static/`.

---

## 2. Create the MySQL database (hPanel)

1. Log in to Hostinger → **hPanel**.
2. Go to **Databases → Management** (MySQL Databases).
3. Create a new database. Note the three values it gives you:
   - **Database name** (e.g. `u123456789_cresta`)
   - **Database user** (e.g. `u123456789_cresta`)
   - **Password** (the one you set)
4. Host is normally `localhost` on Hostinger.

You do **not** need to create tables — `submit.php` creates them automatically
the first time a form is submitted (`leads`, `boat_configurations`,
`access_requests`).

---

## 3. Put your database details into submit.php

Open `dist-static/submit.php` (edit it locally before uploading, or in
Hostinger's File Manager after uploading) and fill in the CONFIG block:

```php
$DB_NAME   = 'u123456789_cresta';          // from step 2
$DB_USER   = 'u123456789_cresta';          // from step 2
$DB_PASS   = 'your-database-password';     // from step 2

$NOTIFY_TO   = 'info@crestamarine.com';    // where you want lead emails
$NOTIFY_FROM = 'no-reply@crestamarine.com';// a real mailbox on your domain
```

> **Email tip:** for reliable delivery, create `no-reply@crestamarine.com` as an
> email account in hPanel and use it as `$NOTIFY_FROM`. Shared-host email sent
> "from" an address that doesn't exist on your domain often lands in spam.

Do **not** commit real database passwords to GitHub — only edit the copy that
lives on the server (or a local copy you don't push).

---

## 4. Upload the site to public_html

Using hPanel **File Manager** (or FTP / FileZilla):

1. Open **File Manager → `public_html`**.
2. If there's an old/placeholder site there, remove it first (keep any existing
   email or system folders — only clear the web files).
3. Upload the **contents of `dist-static/`** into `public_html` — the files
   should sit directly in `public_html` (so you have
   `public_html/index.html`, `public_html/submit.php`, `public_html/assets/…`,
   `public_html/.htaccess`, etc.), **not** inside a `dist-static` subfolder.
   - Fastest way: zip the contents of `dist-static`, upload the zip, then
     "Extract" it inside `public_html`.
4. Make sure the hidden **`.htaccess`** made it across (enable "show hidden
   files" in File Manager). It powers deep links like `/fleet/kumbra-36`.

---

## 5. Test

- Visit your domain — the homepage should load.
- Click into a boat, open **Configurator**, and go to **My Cresta**.
- Reload the page while on a deep link (e.g. `yourdomain.com/fleet/kumbra-36`) —
  it should still load (that's the `.htaccess` working).
- Submit the **My Cresta** registration form and the configurator's
  **"Request a quote"**. You should:
  - see the success message on the site,
  - receive a notification email,
  - see rows appear in the `leads` / `access_requests` tables
    (hPanel → **phpMyAdmin**).

---

## 6. Redeploying after changes

Every time you change the site:

```bash
npm run build:static
```

Then re-upload the contents of `dist-static/` to `public_html` (you can keep
your already-configured `submit.php` on the server, or re-enter the DB details).

---

## What changed vs. the original app

The original was a Cloudflare Workers + D1 app (needs Cloudflare to run). This
static version keeps the **exact design** and these pages: Home, Fleet, Fleet
detail, Services, About, Configurator, and My Cresta (with the registration /
ambassador forms). The **signed-in portal/admin** pages were removed for this
launch because they require server-side auth + a database that shared hosting
can't provide. Leads and access requests are captured via `submit.php` + MySQL.
