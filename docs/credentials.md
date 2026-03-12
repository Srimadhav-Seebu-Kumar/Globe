# Credentials Setup (Local Only)

Do not commit real credentials.

## Required API auth env vars
Set these before running `npm run dev:api`:

- `APP_OPERATOR_EMAIL`
- `APP_OPERATOR_PASSWORD`
- Optional: `APP_ALLOWED_ORIGINS` (comma-separated, defaults to `http://localhost:3000,http://localhost:3001`)

## Example PowerShell session
```powershell
$env:APP_OPERATOR_EMAIL='operator@example.com'
$env:APP_OPERATOR_PASSWORD='replace-with-strong-password'
$env:APP_ALLOWED_ORIGINS='http://localhost:3000,http://localhost:3001'
npm run dev:api
```

## Notes
- Admin endpoints require Bearer token auth.
- Login endpoint: `POST http://localhost:4000/v1/auth/login`.
- Store private credentials in a local secret manager or untracked file.
