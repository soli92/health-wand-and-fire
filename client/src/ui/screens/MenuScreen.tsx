import { useNavigate } from 'react-router-dom'

export default function MenuScreen() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-8 p-6">
      {/* Title */}
      <div className="text-center space-y-3">
        <div className="text-6xl">🧙‍♂️</div>
        <h1 className="text-4xl font-bold text-primary tracking-tight">
          Health, Wand &amp; Fire
        </h1>
        <p className="text-muted-foreground text-lg max-w-sm mx-auto">
          A wizard stands alone against the endless dark. Each Omen Wave, shaped by an ancient intelligence.
        </p>
      </div>

      {/* Controls reference */}
      <div className="bg-card border border-border rounded-xl p-5 w-full max-w-xs space-y-3">
        <p className="text-sm font-semibold text-foreground uppercase tracking-widest text-center">
          Controls
        </p>
        <div className="grid grid-cols-2 gap-y-2 text-sm text-muted-foreground">
          <span>← → / A D</span>      <span className="text-foreground">Move</span>
          <span>Space / Z</span>       <span className="text-foreground">Cast Spell</span>
          <span>💊 Green orb</span>   <span className="text-foreground">Health Potion</span>
        </div>
      </div>

      {/* AI badge */}
      <div className="flex items-center gap-2 bg-accent/20 border border-primary/30 rounded-full px-4 py-2 text-sm text-primary">
        <span>✨</span>
        <span>Waves directed by Claude AI</span>
      </div>

      {/* CTA */}
      <button
        onClick={() => navigate('/game')}
        className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg px-10 py-4 rounded-xl transition-all shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-105 active:scale-95"
      >
        Begin the Omen
      </button>

      <p className="text-xs text-muted-foreground">
        Survive as many waves as you can. The AI adapts. You must too.
      </p>
    </div>
  )
}
