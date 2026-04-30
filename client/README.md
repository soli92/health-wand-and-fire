# Health, Wand and Fire — Client

Frontend React + Vite + TypeScript application for the **Health, Wand and Fire** arcade game.

## Stack

| Layer | Technology |
|---|---|
| UI framework | React 18 |
| Build tool | Vite 5 |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS 3 + `@soli92/solids` preset |
| Routing | React Router DOM v6 |
| Validation | Zod |
| Theme | `data-theme="fantasy"` via `@soli92/solids` |

## Project Structure

```
client/
├── public/
│   ├── brand/             ← favicon/logo/symbol/app-icon assets
│   └── manifest.webmanifest
├── src/
│   ├── components/
│   │   └── ui/              ← shadcn/ui local registry (Button, Card, Badge)
│   ├── game/
│   │   ├── canvasDimensions.ts  ← CANVAS_LOGICAL_WIDTH / HEIGHT (480×640)
│   │   ├── GameLoop.ts      ← Fixed-timestep RAF loop
│   │   ├── StatsTracker.ts  ← Per-wave performance metrics
│   │   ├── entities/
│   │   │   ├── Player.ts    ← Wizard class
│   │   │   ├── Enemy.ts     ← DarkCreature class
│   │   │   └── Bullet.ts    ← Spell class
│   │   └── systems/
│   │       ├── CollisionSystem.ts
│   │       ├── WaveSystem.ts
│   │       ├── InputSystem.ts
│   │       └── TouchInputSystem.ts  ← pointer joystick + fire strip (merged with keyboard)
│   ├── hooks/
│   │   ├── useGameLoop.ts   ← Wires game engine to canvas ref
│   │   ├── useAIWave.ts     ← POST next-wave (Zod); URL from VITE_API_BASE_URL or /api
│   │   ├── nextWaveApiUrl.ts ← resolveNextWaveApiUrl helper
│   │   ├── useTouchUiMode.ts
│   │   └── touchUiDetection.ts
│   └── ui/
│       ├── hud/
│       │   ├── HUD.tsx
│       │   └── AIDebugPanel.tsx  ← DEV only
│       ├── overlays/
│       │   ├── VirtualControlsOverlay.tsx
│       │   └── TouchControlsSettingsPanel.tsx
│       └── screens/
│           ├── MenuScreen.tsx
│           ├── GameScreen.tsx
│           └── GameOverScreen.tsx
├── index.html
├── vercel.json          ← SPA rewrites for React Router on Vercel
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
└── tsconfig.json
```

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server (proxies /api to localhost:3001)
npm run dev

# Type-check + production build
npm run build
```

## Environment (build / Vercel)

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | API origin without trailing slash; production builds POST to `{base}/api/next-wave`. Omit locally — Vite proxies `/api` to the server. |

See **`client/.env.example`**. For local overrides use `.env.local` (gitignored by Vite convention).

## Deploy on Vercel

Set the Vercel project **Root Directory** to `client`, output **`dist`**, build `npm run build`. Keep **`vercel.json`** so `/game` and `/gameover` are rewritten to `index.html` (avoids 404 on client-side routes).

Add **`VITE_API_BASE_URL`** in the Vercel environment (your deployed Express API origin, no trailing slash). Without it, the browser requests `/api/next-wave` on the static hostname and will not reach the real backend.

---

If `npm run build` fails with `../shared/types.ts: Cannot find module 'zod'`, run:

```bash
npm install --prefix ../shared --no-audit --no-fund
```

## Key Design Decisions

- **All game state lives in refs** — no React `useState` in the hot game loop path to avoid re-render overhead
- **HUD updated via `setInterval`** polling refs — decouples React rendering from 60fps canvas loop
- **AI wave generation** — `useAIWave` POSTs to `resolveNextWaveApiUrl(import.meta.env.VITE_API_BASE_URL)`; graceful client fallback if the request fails or response schema is invalid. Production requires **`VITE_API_BASE_URL`** when the API is not same-origin with the static site.
- **Theme-aware canvas colors** — reads `--color-primary` / `--color-destructive` CSS custom properties at render time
- **`@soli92/solids`** provides only CSS tokens + Tailwind preset; UI components are local shadcn/ui registry copies under `src/components/ui`
- **Touch** — `TouchInputSystem` + `mergeInputState`; layout da `touchControlSettings` (localStorage). In pausa (coarse pointer): pannello **Touch controls** per posizione/trasparenza/Pause. Viewport: zoom disabilitato su mobile.
