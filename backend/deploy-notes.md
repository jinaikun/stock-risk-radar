# Deploy Notes

This backend now runs locally and is shaped to move to a small cloud VM later.

## Current shape

- Single Node process
- JSON file persistence at `backend/data/store.json`
- Frontend can talk to backend when `http://localhost:8787` is reachable

## Recommended first cloud shape

1. Ubuntu 22.04 light server
2. Install Node LTS
3. Run backend with `pm2`
4. Put `nginx` in front of it
5. Only expose ports `80` and `443`
6. Keep backend on localhost, for example `127.0.0.1:8787`

## Before public launch

- Replace JSON file storage with SQLite or Postgres
- Add simple auth or at least an admin token for write APIs
- Add rate limiting
- Add request logging
- Add daily store backup

## Why not expose the backend port directly

Directly exposing `8787` is easy, but not a good long-term habit.
`nginx` plus HTTPS is safer and easier to control.
