/**
 * GameOverScreen — shown when the wizard dies.
 * Reads final score and wave from URL state passed by GameScreen.
 */

import { useNavigate, useLocation } from 'react-router-dom'

interface GameOverState {
  score: number
  wave: number
}

export default function GameOverScreen() {
  const navigate = useNavigate()
  const location = useLocation()

  const { score = 0, wave = 1 } = (location.state as GameOverState | null) ?? {}

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-4 text-center">
      {/* Title */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-destructive/70">
          The darkness prevails…
        </p>
        <h1 className="text-5xl font-extrabold tracking-tight text-destructive drop-shadow-[0_0_16px_var(--color-destructive)]">
          Game Over
        </h1>
      </div>

      {/* Skull glyph */}
      <div className="text-6xl select-none" aria-hidden>💀</div>

      {/* Stats card */}
      <div className="rounded-xl border border-border bg-card px-8 py-6 text-card-foreground shadow-lg">
        <p className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">Your legend</p>
        <div className="mt-3 flex gap-10">
          <div>
            <p className="text-3xl font-extrabold text-primary tabular-nums">{score.toString().padStart(6, '0')}</p>
            <p className="text-xs text-muted-foreground">Arcane Points</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-foreground tabular-nums">{wave}</p>
            <p className="text-xs text-muted-foreground">Omen Waves survived</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={() => navigate('/game')}
          className="rounded-lg border border-primary bg-primary px-8 py-3 font-bold text-primary-foreground shadow-[0_0_16px_var(--color-primary)] transition-all hover:scale-105 active:scale-95"
        >
          Rise Again ✦
        </button>
        <button
          onClick={() => navigate('/')}
          className="rounded-lg border border-border bg-card px-8 py-3 font-semibold text-card-foreground transition-all hover:border-primary hover:text-primary active:scale-95"
        >
          Main Menu
        </button>
      </div>
    </div>
  )
}
