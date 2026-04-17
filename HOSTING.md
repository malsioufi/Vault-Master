# Vault Breaker — Hosting Requirements

## Architecture Overview

The app has **two independently deployed parts**:

| Part | Tech | Purpose |
|------|------|---------|
| **Web / Mobile App** | Expo (React Native) | Game UI, daily puzzle, solo mode |
| **Multiplayer API** | Node.js + Express + WebSocket (`ws`) | Online multiplayer rooms & real-time gameplay |

The daily puzzle and solo mode work **without** the API server — only online multiplayer requires it.

---

## Part 1 — Web App (Expo)

### Build

```bash
cd artifacts/vault-breaker
pnpm run build          # outputs to static-build/
pnpm run serve          # serves locally on $PORT (for testing)
```

The build script calls `expo export --platform web` and produces a fully static directory (`static-build/`) of HTML, JS, and asset files — **no server-side rendering required**.

### Hosting Options

Any static file host works:

| Host | Notes |
|------|-------|
| **Firebase Hosting** | ✅ Fully compatible. Free tier generous. |
| **Vercel** | ✅ Drop in the `static-build/` output directory. |
| **Netlify** | ✅ Drag-and-drop or CLI deploy. |
| **Cloudflare Pages** | ✅ Fast global CDN, free tier. |
| **GitHub Pages** | ✅ Free, but needs base-path config if not at root. |
| **AWS S3 + CloudFront** | ✅ Production-grade, scalable. |

### Firebase Hosting — Step by Step

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Set public directory to: artifacts/vault-breaker/static-build
# Configure as single-page app: Yes
# Rewrite all URLs to index.html: Yes

pnpm --filter @workspace/vault-breaker run build
firebase deploy --only hosting
```

### Environment Variables (Web App)

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_DOMAIN` | Optional | Your deployed domain, used as fallback for share links on native |

Set these at **build time** (they are inlined into the JS bundle by Expo).

---

## Part 2 — Multiplayer API Server

### What It Does

- REST endpoints for room creation/joining
- **WebSocket** (`ws`) for real-time game events
- In-memory room state — no database required
- Stateless sessions via a signed cookie (`SESSION_SECRET`)

### Critical Requirement: WebSocket Support

> ⚠️ The multiplayer API requires **persistent WebSocket connections** (HTTP Upgrade). This rules out serverless functions.

| Host | WebSocket Support | Notes |
|------|-------------------|-------|
| **Firebase Cloud Functions** | ❌ | HTTP only, no WebSocket upgrade |
| **Firebase Cloud Run** | ✅ | Supports HTTP upgrades, recommended with Firebase |
| **Railway** | ✅ | Easiest setup, free tier available |
| **Render** | ✅ | Free tier available (spins down after inactivity) |
| **Fly.io** | ✅ | Global, cheap, no spin-down |
| **Heroku** | ✅ | Supports WebSockets |
| **DigitalOcean App Platform** | ✅ | Simple deployment |
| **AWS EC2 / ECS** | ✅ | Full control, production-grade |
| **Google Cloud Run** | ✅ | Set `--timeout=3600` for long-lived connections |

### Build & Start

```bash
cd artifacts/api-server
pnpm run build           # compiles TypeScript → dist/
pnpm run start           # starts the server on $PORT
```

### Environment Variables (API Server)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | ✅ | Port to listen on (e.g. `8080`) |
| `SESSION_SECRET` | ✅ | Secret for signing session cookies — use a long random string |

### Railway — Quickest Path

```bash
# From project root
railway init
railway up --service api-server
railway variables set SESSION_SECRET=<your-secret>
```

### Firebase Cloud Run — If You Want Everything in Firebase

```bash
# Build a container image for the API server
cd artifacts/api-server
gcloud run deploy vault-breaker-api \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars SESSION_SECRET=<your-secret> \
  --timeout 3600
```

Then point the app's API URL to the Cloud Run service URL.

---

## Part 3 — Mobile App (iOS / Android)

The game runs natively on iOS and Android via **Expo Application Services (EAS)**.

```bash
npm install -g eas-cli
eas login
eas build --platform all      # builds .ipa and .apk
eas submit                    # submits to App Store / Google Play
```

EAS Build handles signing, certificates, and provisioning profiles.

---

## Recommended Production Setup

| Scenario | Web App | API Server |
|----------|---------|------------|
| **Simplest** | Firebase Hosting | Railway |
| **All Firebase** | Firebase Hosting | Firebase Cloud Run |
| **All-in-one** | Replit Deployments | Replit Deployments (built-in) |
| **Full control** | Cloudflare Pages | Fly.io or AWS |

---

## Connecting the App to a Deployed API

After deploying the API server, set the API base URL so the web/mobile app points to it. In `artifacts/vault-breaker/context/MultiplayerContext.tsx` (or wherever the WebSocket URL is configured), update the API URL to your deployed endpoint:

```
wss://your-api-server.railway.app/api/ws    # WebSocket
https://your-api-server.railway.app/api     # HTTP
```

---

## Summary Checklist

- [ ] Build the Expo web app (`pnpm run build` in `artifacts/vault-breaker`)
- [ ] Deploy static output to a static host (Firebase Hosting, Vercel, etc.)
- [ ] Deploy the API server to a host with **WebSocket support** (not serverless functions)
- [ ] Set `SESSION_SECRET` on the API server
- [ ] Update the API URL in the app to point to the deployed server
- [ ] (Optional) Build native mobile app with EAS Build
