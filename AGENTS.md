# AGENTS.md — Contesto per assistenti AI

Riassunto operativo per **Health, Wand and Fire** — fantasy arcade shooter con AI director (Claude).
Dettaglio storico: **`AI_LOG.md`**. Stato file: **`git status`**.

**Aggiornato:** 2026

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
  - Importa CSS: `import '@soli92/solids/css/index.css'` (in `main.tsx`)
  - Preset Tailwind: `import solidsPreset from '@soli92/solids/tailwind-preset'`
  - Tema attivo: `data-theme="fantasy"` su `<body>`
  - ⚠️ I componenti UI (Button, Card, Badge…) vengono dal **registry shadcn** locale (`src/components/ui/`), **non** importati direttamente da `@soli92/solids`
- **Tailwind CSS v3** — usa token semantici: `bg-background`, `text-foreground`, `text-primary`, `border-primary`, `text-muted-foreground`, `bg-accent`
- **react-router-dom v6** — Routes: `/` Menu | `/game` Game | `/gameover` GameOver
- **Zod** — validazione schema condivisa con server

### Backend (`server/`)
- **Express 4** + **TypeScript** (tsx per dev, tsc per build)
- **`server/app.ts`** — `createApp(options?)` costruisce l’app; `index.ts` chiama `listen`
- **`@anthropic-ai/sdk`** — model: `claude-sonnet-4-5`, max_tokens: 256
- **Zod** — validazione body request + response AI
- **`POST /api/next-wave`**: validazione con `NextWaveRequestSchema.safeParse` (evita mismatch `instanceof ZodError` se esistono più copie di `zod` in `node_modules`)
- CORS abilitato per `http://localhost:5173`

### Shared (`shared/`)
- **`shared/package.json`** — dipendenza `zod` così `tsc` risolve i moduli quando si typechecka `shared/types.ts` da client o server
- **`shared/types.ts`** — unica fonte di verità per `PlayerStats` (API), `WaveConfig`, `GameState`
- Il server importa con path relativo `../../shared/types` (o `../shared/types` da `app.ts`)
- Il client importa con path relativi da `client/src/...` (es. `../../../shared/types` da `hooks/`)
- Dopo `npm install` in `client/` o `server/`, lo script **postinstall** esegue `npm install --prefix ../shared`

### Test (Vitest)
- **Client:** `npm test` in `client/` — file in `src/game/__tests__/**/*.test.ts`
- **Server:** `npm test` in `server/` — file in `__tests__/**/*.test.ts`; usa `supertest` + `createApp({ getNextWave })` senza chiamare Claude
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
- `useGameLoop.ts` — hook React che wrappa GameLoop su canvas ref
- `useAIWave.ts` — hook React per `POST /api/next-wave`

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
- **AIDebugPanel** visibile solo se `import.meta.env.DEV === true`
- Errori Zod → risposta 400; errori Claude → fallback WaveConfig hardcoded (non crashare)
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

# Test
cd server && npm test
cd client && npm test

# Env
cp .env.example .env            # aggiungi ANTHROPIC_API_KEY
```

---

## File critici da non toccare senza motivo

- `shared/types.ts` — fonte di verità per tutti i tipi
- `server/services/aiAdapter.ts` — system prompt Claude calibrato
- `client/tailwind.config.ts` — preset SoliDS (non aggiungere colori raw)

---

## Risorse

- [SoliDS Storybook](https://soli92.github.io/solids/) — token disponibili e componenti
- [Anthropic API Docs](https://docs.anthropic.com/)
- [AI_LOG.md](./AI_LOG.md) — storico decisioni AI-assisted
