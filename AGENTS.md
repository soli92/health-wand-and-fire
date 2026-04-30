# AGENTS.md — Contesto per assistenti AI

Riassunto operativo per **Health, Wand and Fire** — fantasy arcade shooter con AI director (Claude).
Dettaglio storico: **`AI_LOG.md`**. Stato file: **`git status`**.

**Aggiornato:** 2026-04-30

---

## Repo

**`soli92/health-wand-and-fire`** — monorepo con tre workspace:

| Cartella | Stack | Note |
|----------|-------|-------|
| `client/` | React 18 + Vite 5 + TypeScript | Frontend gioco |
| `server/` | Node.js + Express + TypeScript | Backend AI |
| `shared/` | TypeScript + Zod | Tipi condivisi |

---

## Stack & Dipendenze chiave

### Frontend (`client/`)
- **React 18** + **Vite 5** + **TypeScript**
- **`@soli92/solids`** — Design System
  - Versione attuale: `^1.14.1`
  - Importa CSS: `import '@soli92/solids/css/index.css'` (in `main.tsx`)
  - Preset Tailwind: `import solidsPreset from '@soli92/solids/tailwind-preset'`
  - Tema attivo: `data-theme="fantasy"` su `<body>`
  - ⚠️ I componenti UI (Button, Card, Badge…) vengono dal **registry shadcn** locale (`src/components/ui/`), **non** importati direttamente da `@soli92/solids`
- Branding/PWA frontend: header brand (`AppHeader`), logo loader AI (`SoliLogoLoader`), manifest (`client/public/manifest.webmanifest`) e asset in `client/public/brand/*`
- **Tailwind CSS v3** — usa token semantici: `bg-background`, `text-foreground`, `text-primary`, `border-primary`, `text-muted-foreground`, `bg-accent`
- **react-router-dom v6** — Routes: `/` Menu | `/game` Game | `/gameover` GameOver
- **Zod** — validazione schema condivisa con server
- Config PostCSS client in formato CJS (`client/postcss.config.js` con `module.exports`) per compatibilità toolchain (Vite/Vitest con package non ESM)

### Backend (`server/`)
- **Express 4** + **TypeScript** (tsx per dev, tsc per build)
- **`server/app.ts`** — `createApp(options?)` costruisce l’app; `index.ts` chiama `listen`
- **`@anthropic-ai/sdk`** — model: `claude-sonnet-4-5`, max_tokens: 256
- **Zod** — validazione body request + response AI
- **`POST /api/next-wave`**: validazione con `NextWaveRequestSchema.safeParse` (evita mismatch `instanceof ZodError` se esistono più copie di `zod` in `node_modules`)
- **`VITE_API_BASE_URL`** (facoltativo, build client): se impostato, `useAIWave` chiama `{base}/api/next-wave`; se vuoto, usa `/api/next-wave` (proxy Vite in dev). Obbligatorio in produzione quando il client statico (es. Vercel) e l’API Express sono su host diversi — vedi `client/.env.example`
- CORS: variabile **`CORS_ORIGINS`** (lista separata da virgole); default `http://localhost:5173`. In produzione includere l’origine del frontend (es. URL Vercel)

### Shared (`shared/`)
- **`shared/package.json`** — dipendenza `zod` così `tsc` risolve i moduli quando si typechecka `shared/types.ts` da client o server
- **`shared/types.ts`** — unica fonte di verità per `PlayerStats` (API), `WaveConfig`, `GameState`
- Il server importa con path relativo `../../shared/types` (o `../shared/types` da `app.ts`)
- Il client importa con path relativi da `client/src/...` (es. `../../../shared/types` da `hooks/`)
- Dopo `npm install` in `client/` o `server/`, lo script **postinstall** esegue `npm install --prefix ../shared`

### Deploy (Vercel, solo client)

- **Root Directory** del progetto Vercel: `client` — output build: `dist`
- **`client/vercel.json`**: rewrite catch-all → `index.html` così `/game`, `/gameover` e refresh non danno 404
- L’API AI va deployata separatamente; in dev il proxy Vite manda `/api` al server su 3001
- **Produzione:** impostare **`VITE_API_BASE_URL`** sul progetto che fa il build del client (URL dell’API senza slash finale) e **`CORS_ORIGINS`** sul server con l’origine del sito; senza la base URL il browser continuerebbe a chiamare solo l’host statico (rewrite SPA → nessuna API reale)

### Test (Vitest)
- **Client:** `npm test` in `client/` — `src/**/__tests__/**/*.test.ts` (game, hooks es. `nextWaveApiUrl`, schemi condivisi, touch)
- **Server:** `npm test` in `server/` — `__tests__/**/*.test.ts`; `supertest` + `createApp({ getNextWave })` senza Claude; test su `parseWaveConfigFromModel` (JSON da modello con fence markdown / testo attorno)
- **CI:** `.github/workflows/ci.yml` esegue test + build su entrambi i workspace (branch `main`)

---

## Architettura Game Loop

**Regola fondamentale**: il game state è un **oggetto JS mutabile**, NON React state.

```
Canvas (puro JS) → gestisce: Wizard, DarkCreatures, Spells, collisioni, rendering
React → gestisce: MenuScreen, GameScreen layout, HUD (via ref + setInterval), GameOverScreen
```

- `GameLoop.ts` — requestAnimationFrame con fixed timestep (60fps)
- `StatsTracker.ts` — accumula stats per-wave, `snapshot(wave)` al termine
- `InputSystem.ts` — tastiera; `TouchInputSystem.ts` — pointer sul canvas (joystick basso-sinistra + fire sulla striscia bassa). In `useGameLoop` gli snapshot si uniscono con `mergeInputState` (OR).
- **Modalità UI touch** — `matchMedia('(pointer: coarse)')` (`useTouchUiMode`): overlay **Move** / **Cast** in % del playfield (allineato allo scaling); pulsante **Pause** posizionato con impostazioni salvate; pannello regolazione in **pausa** (`TouchControlsSettingsPanel`)
- `useGameLoop.ts` — hook React che wrappa GameLoop su canvas ref
- `GameScreen` — viewport canvas **responsive** (portrait: larghezza schermo − safe area, altezza proporzionale 640/480); buffer di gioco sempre **480×640** (`canvasDimensions.ts`)
- `touchControlSettings.ts` — impostazioni touch serializzate (`localStorage`); `useGameLoop` riceve `touchConfigRef` e `applyTouchLayout()` dopo modifica in pausa

---

## Fantasy Naming Conventions

| Termine tecnico | Nome fantasy |
|----------------|-------------|
| Player         | Wizard       |
| Enemy          | Dark Creature / Demon |
| Bullet         | Spell        |
| PowerUp        | Health Potion |
| Wave           | Omen Wave    |

---

## Endpoint API

### `POST /api/next-wave`

**Request body** (validato con `NextWaveRequestSchema`):
```json
{ "stats": { "wave": 1, "accuracy": 0.8, "livesLost": 0, "timeMs": 12000, "scoreGained": 350 } }
```

**Response** (validato con `WaveConfigSchema`):
```json
{
  "wave": {
    "enemyCount": 12, "speed": 1.5, "shootFrequency": 0.8,
    "pattern": "pincer", "powerUpSpawn": false,
    "comment": "The goblin horde grows smarter. Brace yourself, wizard."
  }
}
```

---

## Convenzioni di codice

- **Nessun `React.state` nel game loop** — usa refs + mutable objects
- **Canvas colors** da CSS custom properties:
  ```ts
  const style = getComputedStyle(document.body)
  const primary = style.getPropertyValue('--color-primary').trim()
  ```
- **AIDebugPanel** visibile solo se `import.meta.env.DEV === true`; mostra anche l’URL risolto `POST …/api/next-wave` (`getNextWaveApiUrl`)
- Errori Zod richiesta → **400**; errori Claude / JSON modello non validabile → **`WaveConfig` di fallback** con **200** (`aiAdapter`); callback `getNextWave` iniettata che lancia ancora → **500**
- Commit message: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`

---

## Comandi rapidi

```bash
# Dev (due terminali)
cd server && npm run dev        # porta 3001
cd client && npm run dev        # porta 5173

# Build
cd server && npm run build
cd client && npm run build

# Se build client fallisce su "Cannot find module 'zod'" da shared/types.ts
npm install --prefix shared --no-audit --no-fund
cd client && npm run build

# Test
cd server && npm test
cd client && npm test

# Env
cp .env.example .env                       # server: ANTHROPIC_API_KEY, CORS_ORIGINS
# Client produzione (es. Vercel): VITE_API_BASE_URL → vedi client/.env.example
```

---

## File critici da non toccare senza motivo

- `shared/types.ts` — fonte di verità per tutti i tipi
- `server/services/aiAdapter.ts` — system prompt Claude calibrato
- `server/services/parseWaveConfigFromModel.ts` — estrazione JSON dalla risposta testuale del modello (blocco markdown opzionale, oggetto `{…}` anche se circondato da testo)
- `client/tailwind.config.ts` — preset SoliDS (non aggiungere colori raw)

---

## Risorse

- [SoliDS Storybook](https://soli92.github.io/solids/) — token disponibili e componenti
- [Anthropic API Docs](https://docs.anthropic.com/)
- [AI_LOG.md](./AI_LOG.md) — storico decisioni AI-assisted
