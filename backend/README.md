# Backend

This folder contains a minimal backend scaffold for the Stock Discipline Assistant.

## What it does

- Serves quotes for known stock codes
- Stores positions, watchlist items, feedback, and events in a local JSON file
- Exposes simple JSON APIs for the frontend

## Run locally

```bash
cd backend
node server.js
```

The server starts on `http://localhost:8787` by default.

## Main endpoints

- `GET /health`
- `GET /api/version`
- `GET /api/state`
- `GET /api/quotes?codes=002436,600519`
- `POST /api/positions`
- `DELETE /api/positions/:id`
- `POST /api/watchlist`
- `DELETE /api/watchlist/:id`
- `POST /api/feedback`
- `GET /api/feedback`
- `POST /api/events`

## Why this exists

The current product can no longer rely only on local browser storage if it needs real usage, shared data, and reliable feedback collection.
This backend is the first step toward that.

## Toward cloud deployment

- `PORT` is already configurable by environment variable
- The frontend now detects whether the backend is online and falls back to demo mode when it is not
- See [deploy-notes.md](./deploy-notes.md) for the next production-minded steps
