# Smart Planner Frontend

React + Vite frontend for Smart Planner. This app expects a backend API and Firebase auth.

## Requirements

- Node.js 18+
- Firebase project (API key + config)
- Backend API URL

## Local development

1) Install deps:

```bash
npm install
```

2) Create .env from the example:

```bash
cp .env.example .env
```

3) Run the dev server:

```bash
npm run dev
```

## Environment variables

These are required in production:

- VITE_BACKEND_URL
- VITE_FIREBASE_API_KEY
- VITE_FIREBASE_AUTH_DOMAIN
- VITE_FIREBASE_PROJECT_ID
- VITE_FIREBASE_STORAGE_BUCKET
- VITE_FIREBASE_MESSAGING_SENDER_ID
- VITE_FIREBASE_APP_ID

Optional:

- VITE_FIREBASE_MEASUREMENT_ID
- VITE_APP_NAME
- VITE_APP_ENV

## Deploy to Vercel (GitHub)

1) Push this repo to GitHub.
2) Import the frontend folder in Vercel.
3) Set the build settings:

- Framework Preset: Vite
- Build Command: npm run build
- Output Directory: dist

4) Add the environment variables listed above in Vercel.
5) Deploy.

This repo includes a vercel.json with SPA rewrites and security headers.

## Notes

- If VITE_BACKEND_URL is not set in production, the app will call /api/v1 on the same origin.
- For local dev, the app defaults to http://localhost:8000.
