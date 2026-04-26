/**
 * HUD — in-game heads-up display overlay.
 * Reads GameState via props (updated by setInterval from GameScreen).
 * Uses SoliDS semantic tokens only — no raw colors.
 *
 * Import depth: client/src/ui/hud/ → ../../../../shared/types
 */

import type { GameState } from '../../../../shared/types'

interface HUDProps {
  gameState: GameState
  aiLoading: boolean
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <span
      className={`text-xl transition-all duration-300 ${
        filled ? 'text-destructive drop-shadow-sm' : 'text-muted-foreground/25'
      }`}
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
      <div className="flex items-center gap-0.5" aria-label={`Lives: ${lives}`}>
        {Array.from({ length: maxLives }).map((_, i) => (
          <HeartIcon key={i} filled={i < lives} />
        ))}
      </div>

      {/* Wave counter */}
      <div className="flex flex-col items-center">
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none mb-0.5">
          Omen Wave
        </span>
        <span className="text-lg font-bold text-primary leading-none tabular-nums">{wave}</span>
      </div>

      {/* Score */}
      <div className="flex flex-col items-end">
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none mb-0.5">
          Score
        </span>
        <span className="text-lg font-bold text-foreground leading-none tabular-nums">
          {score.toLocaleString()}
        </span>
      </div>

      {/* AI loading bar — thin strip at bottom of HUD */}
      {aiLoading && (
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary/20 overflow-hidden">
          <div className="h-full w-1/2 bg-primary animate-[slide_1s_linear_infinite]" />
        </div>
      )}
    </div>
  )
}
