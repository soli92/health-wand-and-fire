/**
 * GameScreen — the main game view.
 *
 * Layout:
 *   - <canvas> fills the viewport (game renders here)
 *   - HUD overlay (absolute positioned)
 *   - AIDebugPanel overlay (DEV only)
 *
 * Orchestration:
 *   useGameLoop  → drives the game (update + render)
 *   useAIWave    → POSTs stats at wave end, receives next WaveConfig
 *
 * On wave complete:
 *   1. useGameLoop.onWaveComplete fires → we call useAIWave.fetchNextWave(stats)
 *   2. AI responds → we call useGameLoop.applyNextWave(config)
 *   3. Game loop spawns next wave with new config
 */

import { useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameLoop } from '../../hooks/useGameLoop'
import { useAIWave } from '../../hooks/useAIWave'
import HUD from '../hud/HUD'
import AIDebugPanel from '../hud/AIDebugPanel'
import type { PlayerStats, WaveConfig } from '../../../../../shared/types'

// Default wave for wave #1 (before AI takes over)
const INITIAL_WAVE_CONFIG: WaveConfig = {
  enemyCount: 6,
  speed: 1.0,
  shootFrequency: 0.4,
  pattern: 'swarm',
  powerUpSpawn: false,
  comment: 'The first Omen arrives. Show them your power, wizard.',
}

export default function GameScreen() {
  const navigate   = useNavigate()
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const { waveConfig, isLoading, error, lastComment, fetchNextWave } = useAIWave()

  // ─── Callbacks ─────────────────────────────────────────────────────────────
  const handleWaveComplete = useCallback(
    async (stats: PlayerStats, _waveNumber: number) => {
      const nextConfig = await fetchNextWave(stats)
      if (nextConfig) {
        applyNextWave(nextConfig)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fetchNextWave],
  )

  const handleGameOver = useCallback(
    (finalScore: number, wave: number) => {
      navigate('/gameover', { state: { score: finalScore, wave } })
    },
    [navigate],
  )

  // ─── Game loop ─────────────────────────────────────────────────────────────
  const { gameStateRef, applyNextWave, startGame, stopGame } = useGameLoop({
    canvasRef,
    initialWaveConfig: INITIAL_WAVE_CONFIG,
    onWaveComplete: handleWaveComplete,
    onGameOver: handleGameOver,
  })

  // ─── Canvas sizing ─────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      // Keep a fixed-ratio viewport (480×640) centred; canvas CSS fills container
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    const obs = new ResizeObserver(resize)
    obs.observe(canvas)
    return () => obs.disconnect()
  }, [])

  // ─── Start game on mount ───────────────────────────────────────────────────
  useEffect(() => {
    startGame()
    return () => stopGame()
  }, [startGame, stopGame])

  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-background">
      {/* Game canvas — fills screen */}
      <canvas
        ref={canvasRef}
        className="h-full w-full max-w-xl"
        style={{ imageRendering: 'pixelated' }}
      />

      {/* HUD overlay */}
      <HUD gameStateRef={gameStateRef} aiComment={lastComment} />

      {/* AI Debug Panel — DEV only */}
      <AIDebugPanel
        waveConfig={waveConfig}
        isLoading={isLoading}
        error={error}
      />

      {/* AI loading indicator (mid-game wave transition) */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-xl border border-primary/40 bg-background/80 px-6 py-3 text-sm font-semibold text-primary backdrop-blur-sm animate-pulse">
            ✨ The oracle decides your fate…
          </div>
        </div>
      )}
    </div>
  )
}
