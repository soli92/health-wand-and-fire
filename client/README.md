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
│   │   ├── useAIWave.ts     ← POST /api/next-wave with Zod validation
│   │   ├── useTouchUiMode.ts
│   │   └── touchUiDetection.ts
│   └── ui/
│       ├── hud/
│       │   ├── HUD.tsx
│       │   └── AIDebugPanel.tsx  ← DEV only
│       ├── overlays/
│       │   └── VirtualControlsOverlay.tsx  ← Move/Cast hints (coarse pointer)
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

## Deploy on Vercel

Set the Vercel project **Root Directory** to `client`, output **`dist`**, build `npm run build`. Keep **`vercel.json`** so `/game` and `/gameover` are rewritten to `index.html` (avoids 404 on client-side routes).

If `npm run build` fails with `../shared/types.ts: Cannot find module 'zod'`, run:

```bash
npm install --prefix ../shared --no-audit --no-fund
```

## Key Design Decisions

- **All game state lives in refs** — no React `useState` in the hot game loop path to avoid re-render overhead
- **HUD updated via `setInterval`** polling refs — decouples React rendering from 60fps canvas loop
- **AI wave generation** includes graceful fallback: if `/api/next-wave` is unavailable, a deterministic local config is used
- **Theme-aware canvas colors** — reads `--color-primary` / `--color-destructive` CSS custom properties at render time
- **`@soli92/solids`** provides only CSS tokens + Tailwind preset; UI components are local shadcn/ui registry copies under `src/components/ui`
- **Touch** — `TouchInputSystem` on the canvas (bottom-left stick, bottom bar for fire); merged each frame with keyboard via `mergeInputState` in `useGameLoop`. When `matchMedia('(pointer: coarse)')` matches, `VirtualControlsOverlay` + **Pause** button keep controls discoverable (`useTouchUiMode`).
