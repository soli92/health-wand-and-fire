/**
 * HUD — game overlay showing lives (hearts), score and current wave.
 * Props are plain values updated by the parent via setInterval.
 * No direct connection to the game loop state.
 */

interface HUDProps {
  lives: number
  score: number
  wave: number
  maxLives?: number
}

export default function HUD({ lives, score, wave, maxLives = 3 }: HUDProps) {
  return (
    <div
      className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 py-2 pointer-events-none"
      aria-label="Game HUD"
    >
      {/* Lives — heart icons */}
      <div className="flex items-center gap-1" aria-label={`Lives: ${lives}`}>
        {Array.from({ length: maxLives }).map((_, i) => (
          <span
            key={i}
            className={`text-xl transition-all duration-200 ${
              i < lives ? 'text-primary drop-shadow-[0_0_6px_var(--color-primary)]' : 'text-muted-foreground opacity-30'
            }`}
            aria-hidden="true"
          >
            ♥
          </span>
        ))}
      </div>

      {/* Score */}
      <div className="flex flex-col items-center">
        <span className="text-xs text-muted-foreground uppercase tracking-widest">Score</span>
        <span className="text-lg font-bold text-foreground tabular-nums">
          {score.toString().padStart(6, '0')}
        </span>
      </div>

      {/* Wave */}
      <div className="flex flex-col items-end">
        <span className="text-xs text-muted-foreground uppercase tracking-widest">Wave</span>
        <span className="text-lg font-bold text-primary tabular-nums">{wave}</span>
      </div>
    </div>
  )
}
