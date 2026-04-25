/**
 * GameScreen — main gameplay screen.
 * - Mounts a <canvas> for game rendering
 * - Overlays React HUD (updated via setInterval polling refs, not game loop state)
 * - Orchestrates useGameLoop + useAIWave
 * - On wave complete: snapshot stats → fetchNextWave → applyNextWave
 * - On game over: navigate to /gameover with final score
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameLoop } from '@/hooks/useGameLoop'
import { useAIWave } from '@/hooks/useAIWave'
import HUD from '@/ui/hud/HUD'
import AIDebugPanel from '@/ui/hud/AIDebugPanel'
import type { WaveConfig } from '@/game/entities/Enemy'

// HUD polling interval (ms) — low enough to feel responsive, high enough to not thrash
const HUD_POLL_INTERVAL = 120

export default function GameScreen() {
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // HUD display state — deliberately separate from game loop refs
  const [hudLives, setHudLives] = useState(3)
  const [hudScore, setHudScore] = useState(0)
  const [hudWave,  setHudWave]  = useState(1)

  // AI debug state
  const [lastWaveConfig, setLastWaveConfig] = useState<WaveConfig | null>(null)

  // Track if we're transitioning between waves to avoid double-triggering
  const isTransitioningRef = useRef(false)

  const { fetchNextWave, isLoading, error, lastComment } = useAIWave()

  // ── Wave complete callback (called from game loop) ───────────────────────
  const handleWaveComplete = useCallback((completedWave: number) => {
    if (isTransitioningRef.current) return
    isTransitioningRef.current = true

    // snapshot is pulled inside applyNextWave via statsTracker ref
    // We need a slight defer so the loop settles before we call fetchNextWave
    setTimeout(async () => {
      try {
        const stats = statsTracker.snapshot(completedWave)
        const config = await fetchNextWave(stats)
        setLastWaveConfig(config)
        applyNextWave(config)
      } finally {
        isTransitioningRef.current = false
      }
    }, 400) // brief pause between waves for UX breathing room
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchNextWave])

  // ── Game over callback ────────────────────────────────────────────────────
  const handleGameOver = useCallback(() => {
    // Read final state from refs before navigating
    setTimeout(() => {
      navigate('/gameover', {
        state: {
          score: gameStateRef.current.score,
          wave:  gameStateRef.current.wave,
          lastStats: statsTracker.snapshot(gameStateRef.current.wave),
        },
      })
    }, 300)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate])

  const { gameStateRef, startGame, stopGame, applyNextWave, statsTracker } = useGameLoop(
    canvasRef as React.RefObject<HTMLCanvasElement>,
    handleWaveComplete,
    handleGameOver,
  )

  // ── HUD polling via setInterval ───────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      const s = gameStateRef.current
      setHudLives(s.lives)
      setHudScore(s.score)
      setHudWave(s.wave)
    }, HUD_POLL_INTERVAL)
    return () => clearInterval(id)
  }, [gameStateRef])

  // ── Start game on mount ───────────────────────────────────────────────────
  useEffect(() => {
    // Small delay to ensure canvas has layout dimensions
    const t = setTimeout(() => startGame(), 50)
    return () => {
      clearTimeout(t)
      stopGame()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Handle canvas resize ──────────────────────────────────────────────────
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      const canvas = canvasRef.current
      if (canvas && gameStateRef.current.status === 'idle') {
        canvas.width  = canvas.offsetWidth
        canvas.height = canvas.offsetHeight
      }
    })
    if (canvasRef.current) observer.observe(canvasRef.current)
    return () => observer.disconnect()
  }, [gameStateRef])

  return (
    <div
      className="game-screen relative w-full h-screen overflow-hidden bg-background flex items-center justify-center"
      aria-label="Game arena"
    >
      {/* Canvas — fills available space, constrained to a sensible aspect ratio */}
      <canvas
        ref={canvasRef}
        className="w-full h-full max-w-lg object-contain"
        style={{ touchAction: 'none' }}
        aria-label="Game canvas"
        tabIndex={0}
      />

      {/* React HUD overlay */}
      <HUD lives={hudLives} score={hudScore} wave={hudWave} />

      {/* Wave transition overlay */}
      {isTransitioningRef.current && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center space-y-2">
            <p className="text-2xl font-bold text-primary animate-pulse drop-shadow-[0_0_12px_var(--color-primary)]">
              ✨ Wave Complete ✨
            </p>
            {isLoading && (
              <p className="text-sm text-muted-foreground animate-pulse">
                The oracle weaves the next trial…
              </p>
            )}
            {error && (
              <p className="text-xs text-destructive/70">
                Oracle is silent — conjuring from memory
              </p>
            )}
          </div>
        </div>
      )}

      {/* AI Debug Panel (DEV only) */}
      <AIDebugPanel
        lastWaveConfig={lastWaveConfig}
        isLoading={isLoading}
        lastComment={lastComment}
      />
    </div>
  )
}
