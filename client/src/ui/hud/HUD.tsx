/**
 * HUD — heads-up display overlay on top of the canvas.
 * Reads from a mutable GameState ref via a polling interval.
 * Uses @soli92/solids semantic Tailwind tokens.
 */

import { useEffect, useState } from 'react'
import type { GameState } from '../../../../shared/types'

interface HUDProps {
  gameStateRef: React.MutableRefObject<GameState>
  aiComment: string | null
}

export default function HUD({ gameStateRef, aiComment }: HUDProps) {
  const [display, setDisplay] = useState({
    score: 0,
    lives: 3,
    wave: 1,
  })
  const [showComment, setShowComment] = useState(false)
  const [currentComment, setCurrentComment] = useState<string | null>(null)

  // Poll game state every 100ms
  useEffect(() => {
    const id = setInterval(() => {
      const gs = gameStateRef.current
      setDisplay({ score: gs.score, lives: gs.lives, wave: gs.wave })
    }, 100)
    return () => clearInterval(id)
  }, [gameStateRef])

  // Flash AI comment when it changes
  useEffect(() => {
    if (!aiComment) return
    setCurrentComment(aiComment)
    setShowComment(true)
    const t = setTimeout(() => setShowComment(false), 4000)
    return () => clearTimeout(t)
  }, [aiComment])

  const hearts = Array.from({ length: Math.max(display.lives, 0) }, (_, i) => i)

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col gap-1 px-3 pt-2 z-10">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        {/* Score */}
        <span className="font-mono text-sm font-bold text-primary tabular-nums">
          ✨ {display.score.toString().padStart(6, '0')}
        </span>

        {/* Lives */}
        <div className="flex items-center gap-1">
          {hearts.map(i => (
            <span key={i} className="text-base leading-none text-destructive">♥</span>
          ))}
        </div>

        {/* Wave */}
        <span className="font-mono text-sm font-bold text-muted-foreground">
          Omen&nbsp;{display.wave}
        </span>
      </div>

      {/* AI comment banner */}
      {showComment && currentComment && (
        <div
          className="mx-auto mt-1 rounded border border-primary/40 bg-background/80 px-3 py-1 text-center text-xs italic text-primary backdrop-blur-sm"
          style={{ opacity: showComment ? 1 : 0, transition: 'opacity 0.7s' }}
        >
          "{currentComment}"
        </div>
      )}
    </div>
  )
}
