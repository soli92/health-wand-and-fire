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
├── shared/          # Zod schemas shared between client and server
├── AGENTS.md        # Context for AI assistants
└── AI_LOG.md        # AI-assisted development log
```

### Tech Stack

| Layer     | Tech |
|-----------|------|
| Frontend  | React 18, Vite 5, TypeScript, Tailwind CSS |
| Design System | `@soli92/solids` (fantasy theme, shadcn/ui registry) |
| Game Engine | HTML Canvas (pure JS, no React in game loop) |
| Backend   | Node.js, Express 4, TypeScript |
| AI        | Anthropic Claude (`claude-sonnet-4-5`) via `@anthropic-ai/sdk` |
| Validation | Zod (shared schemas) |

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
# Server
cd server && npm install

# Client
cd ../client && npm install
```

### 3. Run (two terminals)

```bash
# Terminal 1 — Backend (port 3001)
cd server && npm run dev

# Terminal 2 — Frontend (port 5173)
cd client && npm run dev
```

Open → **http://localhost:5173**

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

| Variable | Description | Required |
|----------|-------------|----------|
| `ANTHROPIC_API_KEY` | Anthropic API key | ✅ |
| `PORT` | Server port (default: 3001) | ❌ |

---

## 🧪 Dev Tools

- **AIDebugPanel**: visible only in `DEV` mode (bottom-right overlay), shows last WaveConfig JSON + AI comment + loading state.
- **Vite proxy**: `/api` → `http://localhost:3001` (no CORS issues in dev)

---

## 📁 Key Files

| File | Role |
|------|------|
| `shared/types.ts` | Zod schemas + TypeScript types (single source of truth) |
| `server/services/aiAdapter.ts` | Claude API integration |
| `server/routes/wave.ts` | `POST /api/next-wave` endpoint |
| `client/src/game/GameLoop.ts` | rAF game loop, pure JS |
| `client/src/game/StatsTracker.ts` | Collects per-wave player stats |
| `client/src/hooks/useAIWave.ts` | React hook → AI wave fetch |
| `client/src/ui/hud/AIDebugPanel.tsx` | Dev-only AI inspector |

---

## 🤝 Contributing

See [AGENTS.md](./AGENTS.md) for AI assistant context and conventions.

---

*"The darkness grows stronger. But so does the Wizard."*
