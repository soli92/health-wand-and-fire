# AI Log — Health, Wand and Fire

Memoria di sviluppo AI-assisted. Annotazioni su decisioni architetturali, pattern emersi e scelte di design durante la costruzione di questo progetto con il supporto di Soli (AI agent).

---

## Overview del progetto · scaffold iniziale

**"Health, Wand and Fire"** — Fantasy arcade space shooter (Space Invaders style) con AI director dinamico.

**Stack scelto:**
- Frontend: React 18 + Vite 5 + TypeScript + `@soli92/solids` (tema `fantasy`)
- Backend: Node.js + Express + TypeScript + Anthropic SDK
- Shared: Zod schemas come unica fonte di verità per tipi condivisi
- AI model: `claude-sonnet-4-5`

---

## Fasi di sviluppo

### Fase 1 — Scaffold iniziale

**Cosa è stato fatto:**
- Creata repo GitHub `soli92/health-wand-and-fire`
- Definiti tipi condivisi in `shared/types.ts` con Zod
- Backend Express con route `POST /api/next-wave` e servizio `aiAdapter.ts`
- Game engine puro TS: `GameLoop`, `StatsTracker`, `Player` (Wizard), `Enemy` (DarkCreature), `Bullet` (Spell), `InputSystem`
- Integrazione `@soli92/solids` con tema `fantasy` su `<body data-theme="fantasy">`
- File `AGENTS.md` e `AI_LOG.md` inclusi

**Decisioni chiave:**

#### 1. Game loop puro JS, non React
Il game state (Wizard, DarkCreatures, Spells) vive in un oggetto JS mutabile.
React gestisce solo Menu, HUD (via `setInterval` su ref), GameOver.
Motivazione: evitare re-render React ogni frame (60fps) — performance critica.

#### 2. Shared types con Zod
`shared/types.ts` è importato sia da client che server, garantendo type safety end-to-end.
Zod valida: request body del server, response JSON di Claude, prevenendo runtime crash.

#### 3. Claude fallback hardcoded
Se Claude risponde con JSON malformato o l'API è down, `aiAdapter.ts` ritorna una `WaveConfig` di fallback.
Il gioco non si interrompe mai per un errore AI.

#### 4. @soli92/solids: registry shadcn, non import diretto
- `import '@soli92/solids/css/index.css'` per CSS e token (exports package SoliDS 1.7+)
- `import solidsPreset from '@soli92/solids/tailwind-preset'` per il preset
- Componenti (Button, Card, Badge) → `src/components/ui/` (registry locale shadcn)
- ⚠️ NON `import { Button } from '@soli92/solids'`

#### 5. Modello Claude
`claude-sonnet-4-5` — adattato da `claude-sonnet-4-20250514` del prompt originale.

#### 6. AIDebugPanel solo in DEV
Wrappato in `import.meta.env.DEV === true`. Non esposto in produzione.

---

### Fase 2 — Completamento layer React + fix import paths

**Cosa è stato fatto:**

#### File creati
- `client/src/game/systems/CollisionSystem.ts` — AABB collision detection, restituisce `CollisionResult` con set di indici (no mutation diretta)
- `client/src/game/systems/WaveSystem.ts` — spawning nemici da `WaveConfig` AI, gestione Health Potion, render canvas
- `client/src/hooks/useGameLoop.ts` — hook React che orchestra tutti i subsistemi, starfield background
- `client/src/hooks/useAIWave.ts` — fetch `POST /api/next-wave`, Zod parse response, fallback
- `client/src/ui/screens/MenuScreen.tsx` — schermata titolo con controls reference e AI badge
- `client/src/ui/screens/GameScreen.tsx` — canvas + HUD overlay + overlays (pause, AI loading, pre-start)
- `client/src/ui/screens/GameOverScreen.tsx` — stats finali (score, wave), CTA retry/menu
- `client/src/ui/hud/HUD.tsx` — lives (cuori), wave counter, score, AI loading bar animata
- `client/src/ui/hud/AIDebugPanel.tsx` — pannello debug DEV con WaveConfig JSON + commento Claude
- `client/src/components/ui/button.tsx` — Button shadcn/ui locale con varianti SoliDS
- `client/src/components/ui/card.tsx` — Card, CardHeader, CardContent, CardFooter
- `client/src/components/ui/badge.tsx` — Badge con varianti semantic
- `client/public/favicon.svg` — wizard hat SVG inline
- `.env.example` — template variabili d'ambiente

#### Fix critici
- **Import paths `shared/types`**: ogni file usa il path relativo corretto in base alla propria profondità nella cartella `client/src/`:
  - `hooks/` → `../../../shared/types` (3 livelli)
  - `ui/screens/` e `ui/hud/` → `../../../../shared/types` (4 livelli)
  - `game/systems/` → `../../../../shared/types` (4 livelli)
- **`GameScreen.tsx` troncato**: riscritto completo con AIDebugPanel correttamente wirato
- **`index.css`**: aggiunto keyframe `@keyframes slide` per la loading bar HUD

#### Pattern emersi

**CollisionSystem con index sets**
```ts
// Usa Set<number> di indici invece di mutare gli array durante l'iterazione
const col = runCollisions(wizard, wave.enemies, spellsRef.current)
spellsRef.current = spellsRef.current.filter(
  (_, i) => !col.playerSpellHits.has(i) && !col.enemySpellHits.has(i)
)
```

**WaveSystem: AI speed → px/sec**
```ts
speed: speed * 80  // AI range 0.5–3.0 → 40–240 px/sec
hp: Math.max(1, Math.floor(speed))  // hp scale con difficoltà
```

**onWaveEnd inline in useGameLoop call**
Per evitare il problema delle dependency stale di `applyNextWave`, la callback `onWaveEnd` è definita inline nel JSX che chiama `useGameLoop`, dove `applyNextWave` è già nel closure scope.

---

### Fase 3 — Test unitari, app testabile, validazione Zod robusta

**Cosa è stato fatto:**

- **Client (Vitest):** test su `StatsTracker` (accuracy, reset, durata), `CollisionSystem` (`rectsOverlap`, kill punteggio, invincibilità), schemi Zod in `shared/types.ts` (già presenti, estesi con suite dedicate).
- **Server (Vitest + supertest):** `server/app.ts` con `createApp({ getNextWave? })` per montare Express senza ascoltare la porta; `createWaveRouter` riceve la callback AI iniettata. Test HTTP su `POST /api/next-wave` (200, 400, 500) e `GET /health`.
- **Route `/api/next-wave`:** passaggio da `parse` + `instanceof ZodError` a **`NextWaveRequestSchema.safeParse`**, così gli errori di validazione restano **400** anche quando `zod` è duplicato in `node_modules` (es. sotto `shared/`) e `instanceof` fallirebbe.
- **CI:** workflow GitHub Actions esegue anche `npm test` sul server, non solo build.

**File principali:** `server/app.ts`, `server/__tests__/wave.test.ts`, `server/vitest.config.ts`, `client/src/game/__tests__/*.test.ts`, `.github/workflows/ci.yml`.

**Vercel / 404 su route client:** senza rewrite, percorsi come `/game` non esistono come file in `dist/` → errore tipo `404 NOT_FOUND` (edge `fra1`). Aggiunto `client/vercel.json` con rewrite a `index.html` e documentazione deploy in README / AGENTS.

---

## TODO / Roadmap

**Stato repo (ultima verifica codice):** input di gioco solo tastiera (`client/src/game/systems/InputSystem.ts`); nessun audio Web, Supabase, `localStorage` per high score, particelle a morte nemici, né modalità manuale che bypassi l’AI. Il server espone CORS solo verso `http://localhost:5173` (`server/app.ts`) — va esteso per un client in produzione.

- [ ] Touch controls per mobile (joystick virtuale canvas)
- [ ] Sound effects con Web Audio API (tono fantasy)
- [ ] Leaderboard con Supabase
- [x] Deploy client su Vercel — `client/vercel.json` (rewrite SPA → `index.html`); in dashboard Vercel: Root Directory `client`, output `dist`
- [ ] Deploy server `POST /api/next-wave` (Railway, Render, serverless, ecc.) + segreti / `ANTHROPIC_API_KEY` + **CORS** allineato all’origine del frontend
- [x] GitHub Actions CI — `npm ci`, test e build su **client e server** (`.github/workflows/ci.yml`, branch `main`)
- [ ] Modalità difficoltà manuale (bypass AI director)
- [ ] Animazioni particelle alla morte nemici
- [ ] High score localStorage

---

## Link utili

- Repo: https://github.com/soli92/health-wand-and-fire
- SoliDS Storybook: https://soli92.github.io/solids/
- Anthropic Console: https://console.anthropic.com/
