# 🧙‍♂️ Health, Wand and Fire

> *Fantasy arcade space shooter — a Wizard repels waves of Dark Creatures, directed by an AI (Claude) that adapts difficulty in real time.*

[![GitHub](https://img.shields.io/badge/GitHub-soli92%2Fhealth--wand--and--fire-181717?logo=github)](https://github.com/soli92/health-wand-and-fire)
[![Design System](https://img.shields.io/badge/Design%20System-%40soli92%2Fsolids-6d28d9)](https://github.com/soli92/solids)

---

## ✨ Overview

**Health, Wand and Fire** is a Space Invaders-style arcade game with a fantasy skin:

| Game term | Fantasy name |
|-----------|-------------|
| Player    | Wizard       |
| Enemies   | Dark Creatures / Demons |
| Bullets   | Spells       |
| PowerUp   | Health Potion |
| Wave      | Omen Wave    |

After each **Omen Wave**, the Wizard's performance stats are sent to **Claude** (Anthropic API), which generates the next wave's configuration: enemy count, speed, attack patterns and whether a Health Potion drops.

---

## 🏗️ Architecture

```
health-wand-and-fire/
├── client/          # React + Vite + TypeScript + @soli92/solids
├── server/          # Node.js + Express + TypeScript + Anthropic SDK
├── shared/          # Zod schemas (own package.json + zod) for client/server
├── .github/workflows/  # CI: test + build on client and server
├── AGENTS.md        # Context for AI assistants
└── AI_LOG.md        # AI-assisted development log
```

### Tech Stack

| Layer     | Tech |
|-----------|------|
| Frontend  | React 18, Vite 5, TypeScript, Tailwind CSS |
| Design System | `@soli92/solids` (fantasy theme, shadcn/ui registry) |
| Game Engine | HTML Canvas (pure JS, no React in game loop); keyboard + touch (virtual stick + bottom fire strip) |
| Backend   | Node.js, Express 4, TypeScript |
| AI        | Anthropic Claude (`claude-sonnet-4-5`) via `@anthropic-ai/sdk` |
| Validation | Zod (shared schemas) |

### Frontend migration status (Apr 2026)

- `client` migrated to Soli brand assets and app shell:
  - sticky top header (`AppHeader`)
  - logo-based loaders (`SoliLogoLoader`) and menu branding (`SoliBrandLogo`)
  - full PWA metadata (`manifest.webmanifest`, favicon/OG/apple-touch in `index.html`)
- SoliDS dependency on client aligned to `@soli92/solids ^1.14.1`.
- PostCSS config is CJS (`module.exports`) to avoid Vite/Vitest hangs caused by ESM syntax in a non-ESM package.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 22+
- An [Anthropic API key](https://console.anthropic.com/)

### 1. Clone & setup env

```bash
git clone https://github.com/soli92/health-wand-and-fire.git
cd health-wand-and-fire
cp .env.example .env
# Edit .env → add your ANTHROPIC_API_KEY
```

### 2. Install dependencies

```bash
# Server (also installs ../shared for Zod schemas)
cd server && npm install

# Client (postinstall installs ../shared — required for TypeScript)
cd ../client && npm install

# Optional safety step if client build reports
# "../shared/types.ts: Cannot find module 'zod'"
npm install --prefix ../shared --no-audit --no-fund
```

### 3. Run (two terminals)

```bash
# Terminal 1 — Backend (port 3001)
cd server && npm run dev

# Terminal 2 — Frontend (port 5173)
cd client && npm run dev
```

Open → **http://localhost:5173**

### Touch devices

Pinch zoom on the game page is **disabled** via the HTML viewport (`maximum-scale=1`, `user-scalable=no`) so gameplay is not interrupted by accidental browser zoom.

On the game canvas (after **Begin the Omen**): drag in the **Move** ring to strafe; tap the **Cast** regions along the bottom (left and right of the ring) to fire. Keyboard (**A/D**, **Space**) still works on desktop. **Pause** opens the pause menu; on coarse pointers you can **adjust control positions, sizes, hint transparency, and Pause button placement**, then **Apply & save** (stored in `localStorage` on the device).

On **coarse pointers** (typical phones), visible hints match the hit zones; touches still hit the canvas underneath.

In **portrait**, the playfield scales to fit the screen width (minus safe-area insets); the internal resolution stays 480×640 so physics and touch mapping stay aligned.

---

## 🧪 Tests

Vitest is used in **client** and **server**. From each workspace after `npm install` (which also installs `shared/` via `postinstall`):

```bash
cd client && npm test
cd server && npm test
```

- **Client:** `src/game/__tests__/**/*.test.ts`, `src/hooks/__tests__/**/*.test.ts` — shared Zod schemas, `StatsTracker`, `CollisionSystem`, touch input (`TouchInputSystem`, `touchControlSettings`), coarse-pointer detection (`touchUiDetection`).
- **Server:** `server/__tests__/**/*.test.ts` — HTTP contract for `/api/next-wave` and `/health` with a mock `getNextWave` (no API key required); parsing helpers for Claude text output (`parseWaveConfigFromModel`).

On push and pull requests to `main`, GitHub Actions runs `npm ci`, tests, and production builds for both workspaces.

---

## 🚀 Deploy (Vercel — client)

React Router uses paths such as `/game` and `/gameover`. A static host must **rewrite** unknown paths to `index.html`, otherwise you get **404 NOT_FOUND** (for example from region `fra1`) when opening or refreshing a deep link.

This repo includes **`client/vercel.json`** with a catch-all rewrite to `/index.html`. In the Vercel project settings:

| Setting | Value |
|--------|--------|
| **Root Directory** | `client` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

**Environment variable for production:** set **`VITE_API_BASE_URL`** to your deployed API origin **without** a trailing slash (example: `https://your-api.onrender.com`). The client then POSTs to `{VITE_API_BASE_URL}/api/next-wave`. If unset, requests use `/api/next-wave` (works in dev with the Vite proxy only — **not** enough when the UI is served from a static host that rewrites everything to `index.html`).

The game still needs a reachable **`POST /api/next-wave`** on that API host (separate Node deploy or serverless). In dev, Vite proxies `/api` to port 3001 (`vite.config.ts`).

**CORS:** the Express server reads **`CORS_ORIGINS`** (comma-separated list). Default is `http://localhost:5173`. Add your production site origin(s) so the browser can call the API from your deployed client.

---

## 🔮 AI Wave System

At the end of each Omen Wave, `StatsTracker.snapshot()` captures:

- `wave` — current wave number
- `accuracy` — shots hit / shots fired (0–1)
- `livesLost` — lives lost this wave
- `timeMs` — wave duration in milliseconds
- `scoreGained` — score earned this wave

These stats are POSTed to `POST /api/next-wave`. Claude responds with a `WaveConfig`:

```ts
{
  enemyCount:     number,   // 3–30
  speed:          number,   // 0.5–3.0
  shootFrequency: number,   // 0.1–2.0
  pattern:        'swarm' | 'pincer' | 'wall' | 'random' | 'flanking',
  powerUpSpawn:   boolean,
  comment:        string    // epic fantasy flavour text
}
```

**Balancing rules** Claude follows:
- `accuracy > 0.7` → harder wave
- `livesLost >= 2` → easier wave + Health Potion
- `wave > 5` → advanced patterns (pincer, flanking)

---

## 🎨 Design System

Uses [`@soli92/solids`](https://github.com/soli92/solids) with the **fantasy** theme.

```html
<body data-theme="fantasy">
```

Canvas reads CSS custom properties for colours:
```ts
const style = getComputedStyle(document.body)
const primary = style.getPropertyValue('--color-primary').trim()
```

UI components (Button, Card, Badge…) come from the **shadcn/ui registry** (`src/components/ui/`), not imported directly from `@soli92/solids`.

---

## 🌍 Environment Variables

### Server (`server/`, copy root `.env.example` → `.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `ANTHROPIC_API_KEY` | Anthropic API key | ✅ |
| `PORT` | Server port (default: 3001) | ❌ |
| `CORS_ORIGINS` | Comma-separated allowed browser origins (e.g. `http://localhost:5173,https://your-app.vercel.app`) | ❌ (default: localhost dev client) |

### Client build (`client/` — e.g. Vercel project env)

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_BASE_URL` | API origin **without** trailing slash; client calls `{base}/api/next-wave`. Omit for local dev (Vite proxy). **Set for production** when the API is not same-origin with the static app. | ❌ locally; ✅ typical production |

## 🧪 Dev Tools

- **AIDebugPanel**: visible only in `DEV` mode (bottom-right overlay), shows resolved `POST` URL, last WaveConfig + AI comment + loading/error state.
- **Vite proxy**: `/api` → `http://localhost:3001` when `VITE_API_BASE_URL` is unset (no CORS issues in dev)

Invalid `POST /api/next-wave` bodies return **400** with Zod field errors. The route uses `safeParse` so validation works even when multiple copies of the `zod` package are present in `node_modules` (e.g. under `shared/`). Claude failures or unparseable model text result in a **fallback** `WaveConfig` with HTTP **200** from the adapter (`server/services/aiAdapter.ts`); injected test doubles that throw still yield **500**.

## 📁 Key Files

| File | Role |
|------|------|
| `shared/types.ts` | Zod schemas + TypeScript types (single source of truth) |
| `server/services/aiAdapter.ts` | Claude API integration + fallback wave |
| `server/services/parseWaveConfigFromModel.ts` | Parse model text → `WaveConfig` (markdown fences, embedded `{…}`) |
| `server/app.ts` | Express app factory (`createApp`) — testable without listening; `CORS_ORIGINS` |
| `server/routes/wave.ts` | `createWaveRouter(getNextWave)` — `POST /api/next-wave` |
| `client/src/game/GameLoop.ts` | rAF game loop, pure JS |
| `client/src/game/StatsTracker.ts` | Collects per-wave player stats |
| `client/src/hooks/useAIWave.ts` | React hook → AI wave fetch |
| `client/src/hooks/nextWaveApiUrl.ts` | Resolves `POST` URL from `VITE_API_BASE_URL` |
| `client/src/game/touchControlSettings.ts` | Persisted touch layout + `touchSettingsToInputOpts` for engine/UI |
| `client/src/ui/overlays/VirtualControlsOverlay.tsx` | Visible Move/Cast hints when `(pointer: coarse)` |
| `client/src/ui/hud/AIDebugPanel.tsx` | Dev-only AI inspector |
| `client/vercel.json` | SPA rewrites for React Router on Vercel |

---

## 🤝 Contributing

See [AGENTS.md](./AGENTS.md) for AI assistant context and conventions.

---

*"The darkness grows stronger. But so does the Wizard."*
