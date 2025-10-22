# SoulWorld Backend (Express + MongoDB)

## Quick start
## Quickstart (local)

1. Copy `.env.example` to `.env` and fill in your MongoDB credentials (or set `MONGODB_URI`).

2. Install dependencies and start in dev mode:

```powershell
cd backend
npm install
npm run dev
```

3. Useful env variables:

- `MONGODB_URI` — full connection string (recommended)
- `DB_USER`, `DB_PASS`, `DB_HOST`, `DB_NAME` — used to build `MONGODB_URI` automatically if a full URI is not provided
- `ADMIN_KEY` — protects admin endpoints (DELETE operations). When not set and `NODE_ENV` != 'production', the server allows admin actions for convenience during development (not recommended for real environments).

4. Troubleshooting DB connection:

- Use `backend/scripts/test-mongo-conn.js` to validate your connection string.
- If you see `ENOTFOUND _mongodb._tcp...` errors, your `DB_HOST` is likely incomplete — copy the full host from Atlas -> Connect -> Your application.

1. Copy `.env.sample` to `.env` and set `MONGODB_URI` and `PORT`.
2. Install dependencies:
   ```bash
   npm install
