# AI Log — Health, Wand and Fire

Memoria di sviluppo AI-assisted. Annotazioni su decisioni architetturali, pattern emersi e scelte di design durante la costruzione di questo progetto con il supporto di Soli (AI agent).

---

## Overview del progetto · scaffold iniziale

**"Health, Wand and Fire"** — Fantasy arcade space shooter (Space Invaders style) con AI director dinamico.

**Stack scelto:**
- Frontend: React 18 + Vite 5 + TypeScript + `@soli92/solids` (tema `fantasy`)
- Backend: Node.js + Express + TypeScript + Anthropic SDK
- Shared: Zod schemas come unica fonte di verità per tipi condivisi
- AI model: `claude-sonnet-4-5` (adattato da `claude-sonnet-4-20250514` del prompt originale)

---

## Fasi di sviluppo

### Fase 1 — Scaffold iniziale · 2025

**Cosa è stato fatto:**
- Creata repo GitHub `soli92/health-wand-and-fire`
- Definiti tipi condivisi in `shared/types.ts` con Zod: `PlayerStatsSchema`, `WaveConfigSchema`, `GameState`
- Backend Express con route `POST /api/next-wave` e servizio `aiAdapter.ts`
- Frontend React con HTML Canvas game loop puro (nessun React state nel loop)
- Integrazione `@soli92/solids` con tema `fantasy` su `<body data-theme="fantasy">`
- File `AGENTS.md` e `AI_LOG.md` inclusi per continuità AI-assisted

**Decisioni chiave:**

#### 1. Game loop puro JS, non React
Il game state (Wizard, DarkCreatures, Spells) vive in un oggetto JS mutabile.
React gestisce solo Menu, HUD (via `setInterval` su ref), GameOver.
Motivazione: evitare re-render React ogni frame (60fps) — performance critica per un gioco.

#### 2. Shared types con Zod
`shared/types.ts` è importato sia da client che server, garantendo type safety end-to-end senza duplicazione.
Zod valida: request body del server, response JSON di Claude, prevenendo runtime crash.

#### 3. Claude fallback hardcoded
Se Claude risponde con JSON malformato o l'API è down, `aiAdapter.ts` ritorna una `WaveConfig` di fallback (media difficoltà).
Il gioco non si interrompe mai per un errore AI.

#### 4. @soli92/solids: registry shadcn, non import diretto
Dalla knowledge base: i componenti SoliDS seguono il **registry shadcn**. Quindi:
- `import '@soli92/solids/dist/index.css'` per CSS e token
- `import solidsPreset from '@soli92/solids/tailwind'` per il preset
- Componenti (Button, Card, Badge) → `src/components/ui/` (registry locale shadcn)
- ⚠️ NON `import { Button } from '@soli92/solids'`

#### 5. Modello Claude adattato
Il prompt originale specificava `claude-sonnet-4-20250514`. Adattato a `claude-sonnet-4-5` per allineamento con le convenzioni del progetto e disponibilità API attuale.

#### 6. AIDebugPanel solo in DEV
Il pannello debug AI (WaveConfig JSON, commento Claude, loading state) è wrappato in `import.meta.env.DEV === true`. Non esposto in produzione.

---

## Pattern & Convenzioni emerse

### Canvas + CSS Custom Properties
```ts
// Legge i colori del tema SoliDS dal DOM, non hardcoded
const style = getComputedStyle(document.body)
const primary = style.getPropertyValue('--color-primary').trim()
```

### Stats Snapshot al termine wave
```
Wave ends → StatsTracker.snapshot(wave) → useAIWave.fetchNextWave(stats) → WaveSystem.applyConfig(waveConfig)
```

### Error handling API
- Zod parse error → 400 Bad Request + messaggio dettagliato
- Claude API error → 500 + fallback WaveConfig (non blocca il gioco)
- Claude JSON malformato → parse + fallback WaveConfig

---

## TODO / Roadmap

- [ ] Power-up rendering su canvas (Health Potion drop)
- [ ] Sound effects con Web Audio API (tono fantasy)
- [ ] Leaderboard con Supabase
- [ ] Deploy: client su Vercel, server su Railway/Render
- [ ] GitHub Actions CI (lint + typecheck)
- [ ] Mobile responsive (touch controls per mobile)
- [ ] Modalità difficoltà manuale (bypass AI director)

---

## Link utili

- Repo: https://github.com/soli92/health-wand-and-fire
- SoliDS Storybook: https://soli92.github.io/solids/
- Anthropic Console: https://console.anthropic.com/
