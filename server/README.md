# MESSA Cloud Server

Raw **PHP + MySQL** backend for the MESSA Android app. No framework, no Composer
dependencies. Provides:

- Account registration (via paid registration tokens) and login
- Per-account recipient **data tables** (max **10 tables**, max **512 rows** each)
- Row-level **create / read / update / delete** and bulk replace
- **Import** from any `sheet.spacet.me` JSON endpoint, plus a public
  **sheet.spacet.me-compatible export** URL per table
- CSV export
- A featured **admin dashboard** (`/admin`)

## Requirements

- PHP **8.0+** with `pdo_mysql` (cURL and OpenSSL recommended)
- MySQL **5.7+** / MariaDB **10.4+**
- Apache with `mod_rewrite` (or Nginx equivalent), or PHP's built-in server for local dev

## Configuration

```bash
cp server/.env.example server/.env
# edit server/.env: DB_*, APP_BASE_URL, APP_SECRET, WHATSAPP, REG_FEE
```

`.env` is gitignored. `server/config.local.php` (also gitignored) can override anything
in the config array and takes highest priority.

## Database setup

```bash
# 1. create the database (example)
mysql -u root -e "CREATE DATABASE messa CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 2. create tables
php server/seed.php --schema

# 3. create the first admin
php server/seed.php admin@messa.sgm.ng "StrongPass123" "MESSA Admin"

# 4. issue a registration token for a new user
php server/seed.php --token        # -> MESSA-XXXX-XXXX
```

Or import manually: `mysql -u root messa < server/sql/schema.sql`.

## Running

**Production (Apache):** point the `messa.sgm.ng` document root at
`server/public`. The bundled `server/public/.htaccess` routes `/api/*` and
`/sheet/*.json` through `index.php` and preserves the `Authorization` header.

**Local development:**

```bash
php -S localhost:8080 server/public/router.php
# API:    http://localhost:8080/api
# Admin:  http://localhost:8080/admin/login.php
```

## Admin dashboard

`/admin/login.php` — sign in with the admin created by the seed script.

- **Dashboard** — users, unused/used tokens, tables, rows, recent activity
- **Users** — create, suspend/activate, promote/demote, reset password, delete
- **Registration Tokens** — generate in bulk, revoke, delete; shows the WhatsApp sales link
- **Data Tables** — browse every account's tables and view their rows
- **Activity** — audit log with filters
- **Settings** — environment + system checks

## Registration flow

1. Buyer pays **NGN 5,000** and messages **08108097322 (RayyanTech)** on WhatsApp.
2. An admin generates a token in **Registration Tokens**.
3. The buyer enters the token in the app's **Create account** screen.
4. `POST /api/auth/register` marks the token used and returns an API bearer token.

## API

Base URL: `https://messa.sgm.ng/api`. JSON in/out. Authenticated endpoints expect
`Authorization: Bearer <token>`.

| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` | Health check |
| POST | `/auth/register` | `{name,email,password,token,phone?}` → `{token,user}` |
| POST | `/auth/login` | `{email,password}` → `{token,user}` |
| POST | `/auth/logout` | Revoke current token |
| GET | `/me` | Current user |
| GET | `/stats` | Table/row usage and limits |
| GET | `/tables` | List tables |
| POST | `/tables` | `{name,columns?,source_url?}` |
| GET | `/tables/{id}` | Table + rows |
| PUT | `/tables/{id}` | `{name?,columns?,source_url?}` |
| DELETE | `/tables/{id}` | Delete table |
| GET | `/tables/{id}/rows` | List rows |
| POST | `/tables/{id}/rows` | `{data:{...}}` create row |
| PUT | `/tables/{id}/rows/{rowId}` | `{data:{...}}` update row |
| DELETE | `/tables/{id}/rows/{rowId}` | Delete row |
| POST | `/tables/{id}/replace` | `{rows:[{...}]}` replace all rows |
| POST | `/tables/{id}/import` | `{url}` pull from sheet.spacet.me |
| GET | `/tables/{id}/export?format=json\|csv` | Export |

### Public export (sheet.spacet.me compatible)

```
GET /sheet/{public_token}.json   →  [ { "column": "value", ... }, ... ]
```

Use this URL anywhere you would use a `sheet.spacet.me` endpoint — including as the
Data Source inside the MESSA app, so a cloud table can drive local SMS campaigns.

## Sync notes

`sheet.spacet.me` is **read-only** (`GET /{sheetId}/{sheetName}.json`). MESSA therefore:

- **Imports** a Google Sheet into a cloud table via `/tables/{id}/import` (or the
  per-table `source_url`).
- **Exports** a cloud table as its own sheet.spacet.me-compatible JSON endpoint, and
  as CSV for pasting back into Google Sheets.

The server's sheet parser accepts both a list of objects and the
`{"values": [[header], [row], ...]}` matrix shape, so no reshuffling is required.

## Security

- Passwords hashed with `password_hash()` (bcrypt). API tokens stored as SHA-256 hashes.
- Admin uses PHP sessions + CSRF tokens; login regenerates the session id.
- Set `APP_DEBUG=false` in production. Never commit `.env` / `config.local.php`.
- Only expose datasets through the public `/sheet/{token}.json` URL that are meant to be public.
