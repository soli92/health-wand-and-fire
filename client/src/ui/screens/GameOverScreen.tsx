import { useNavigate, useLocation } from 'react-router-dom'

interface LocationState {
  score?: number
  wave?: number
}

export default function GameOverScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state ?? {}) as LocationState
  const score = state.score ?? 0
  const wave = state.wave ?? 1

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background flex flex-col items-center justify-center gap-8 p-6">
      {/* Icon */}
      <div className="text-7xl animate-pulse">💀</div>

      {/* Title */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-destructive tracking-tight">
          The Wizard Falls
        </h1>
        <p className="text-muted-foreground text-base max-w-xs mx-auto">
          The darkness has consumed the realm. But every end is a new beginning…
        </p>
      </div>

      {/* Stats card */}
      <div className="bg-card border border-border rounded-xl p-6 w-full max-w-xs space-y-4">
        <p className="text-sm font-semibold text-foreground uppercase tracking-widest text-center">
          Final Stats
        </p>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground text-sm">Score</span>
            <span className="text-2xl font-bold text-primary">{score.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center border-t border-border pt-3">
            <span className="text-muted-foreground text-sm">Omen Waves survived</span>
            <span className="text-xl font-bold text-foreground">{Math.max(0, wave - 1)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={() => navigate('/game')}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base px-8 py-3 rounded-xl transition-all shadow-lg shadow-primary/30 hover:scale-105 active:scale-95"
        >
          ⚡ Try Again
        </button>
        <button
          onClick={() => navigate('/')}
          className="bg-transparent border border-border hover:border-primary text-muted-foreground hover:text-foreground font-medium text-base px-8 py-3 rounded-xl transition-all"
        >
          ← Return to Menu
        </button>
      </div>

      <p className="text-xs text-muted-foreground italic">
        "Even the mightiest wizard must rest before the next storm."
      </p>
    </div>
  )
}
