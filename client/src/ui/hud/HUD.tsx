/**
 * HUD — in-game heads-up display overlay.
 * Reads GameState via props (updated by setInterval from GameScreen).
 * Uses SoliDS semantic tokens only.
 */

import type { GameState } from '../../../../shared/types'

interface HUDProps {
  gameState: GameState
  aiLoading: boolean
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <span
      className={`text-xl transition-all ${filled ? 'text-destructive' : 'text-muted-foreground/30'}`}
      aria-hidden="true"
    >
      ♥
    </span>
  )
}

export default function HUD({ gameState, aiLoading }: HUDProps) {
  const { wave, score, lives } = gameState
  const maxLives = 3

  return (
    <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 py-2 bg-background/80 backdrop-blur-sm border-b border-border">
      {/* Lives */}
      <div className="flex items-center gap-1" aria-label={`Lives: ${lives}`}>
        {Array.from({ length: maxLives }).map((_, i) => (
          <HeartIcon key={i} filled={i < lives} />
        ))}
      </div>

      {/* Wave */}
      <div className="flex flex-col items-center">
        <span className="text-xs text-muted-foreground uppercase tracking-widest">
          Omen Wave
        </span>
        <span className="text-lg font-bold text-primary leading-none">{wave}</span>
      </div>

      {/* Score */}
      <div className="flex flex-col items-end">
        <span className="text-xs text-muted-foreground uppercase tracking-widest">Score</span>
        <span className="text-lg font-bold text-foreground leading-none tabular-nums">
          {score.toLocaleString()}
        </span>
      </div>

      {/* AI loading indicator */}
      {aiLoading && (
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary/20">
          <div className="h-full bg-primary animate-pulse w-full" />
        </div>
      )}
    </div>
  )
}
