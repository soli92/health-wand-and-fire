/**
 * GameScreen — the main game view.
 * Owns: canvas ref, game state read loop, AI wave fetching, routing.
 * Game logic lives entirely in useGameLoop (pure JS, no React state in hot path).
 */

import { useRef, useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameLoop } from '../../hooks/useGameLoop'
import { useAIWave } from '../../hooks/useAIWave'
import HUD from '../hud/HUD'
import AIDebugPanel from '../hud/AIDebugPanel'
import type { GameState } from '../../../../shared/types'
import type { StatsTracker } from '../../game/StatsTracker'

const CANVAS_W = 480
const CANVAS_H = 640

const INITIAL_STATE: GameState = {
  running: false,
  paused: false,
  wave: 1,
  score: 0,
  lives: 3,
  waveConfig: null,
}

export default function GameScreen() {
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // HUD state — updated via setInterval, NOT per-frame
  const [hudState, setHudState] = useState<GameState>(INITIAL_STATE)
  const [started, setStarted] = useState(false)

  const { loading, error, lastConfig, fetchNextWave } = useAIWave()

  // ── Callbacks passed into useGameLoop ────────────────────────────────────

  const handleGameStateChange = useCallback((state: GameState) => {
    setHudState({ ...state })
  }, [])

  const handleWaveEnd = useCallback(
    async (snapshot: ReturnType<StatsTracker['snapshot']>) => {
      // Map StatsTracker snapshot → PlayerStats (shared types)
      const playerStats = {
        wave: snapshot.wave,
        accuracy: snapshot.accuracy,
        livesLost: snapshot.livesLost,
        timeMs: snapshot.waveDurationMs,
        scoreGained: snapshot.scoreGained,
      }

      const config = await fetchNextWave(playerStats)
      if (config) {
        applyNextWave(config)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fetchNextWave],
  )

  const handleGameOver = useCallback(
    (finalScore: number) => {
      navigate('/gameover', {
        state: { score: finalScore, wave: hudState.wave },
      })
    },
    [navigate, hudState.wave],
  )

  // ── Game loop hook ────────────────────────────────────────────────────────

  const { startGame, applyNextWave, pauseGame, resumeGame, gameStateRef } =
    useGameLoop({
      canvasRef,
      onGameStateChange: handleGameStateChange,
      onWaveEnd: handleWaveEnd,
      onGameOver: handleGameOver,
    })

  // ── HUD polling — reads mutable gameStateRef every 200ms ─────────────────

  useEffect(() => {
    if (!started) return
    const id = setInterval(() => {
      setHudState({ ...gameStateRef.current })
    }, 200)
    return () => clearInterval(id)
  }, [started, gameStateRef])

  // ── Start game once canvas is mounted ─────────────────────────────────────

  const handleStart = useCallback(() => {
    setStarted(true)
    setHudState(INITIAL_STATE)
    startGame()
  }, [startGame])

  // ── Keyboard: P to pause ─────────────────────────────────────────────────

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyP') {
        if (gameStateRef.current.paused) resumeGame()
        else pauseGame()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pauseGame, resumeGame, gameStateRef])

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      {/* Game container */}
      <div
        className="relative bg-black rounded-xl overflow-hidden shadow-2xl shadow-primary/20 border border-border"
        style={{ width: CANVAS_W, height: CANVAS_H }}
      >
        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="block"
          aria-label="Health, Wand and Fire game canvas"
        />

        {/* HUD overlay (always on top) */}
        {started && (
          <HUD gameState={hudState} aiLoading={loading} />
        )}

        {/* Pause overlay */}
        {hudState.paused && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-20">
            <p className="text-3xl font-bold text-primary">⏸ Paused</p>
            <p className="text-muted-foreground text-sm">Press P to resume</p>
          </div>
        )}

        {/* AI between-waves overlay */}
        {loading && !hudState.paused && (
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-20 pointer-events-none">
            <div className="text-4xl animate-spin">✨</div>
            <p className="text-primary font-semibold">The AI director prepares the next Omen…</p>
          </div>
        )}

        {/* Start screen */}
        {!started && (
          <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center gap-6 z-20">
            <div className="text-center space-y-2">
              <div className="text-5xl">🧙‍♂️</div>
              <h2 className="text-2xl font-bold text-primary">Ready, Wizard?</h2>
              <p className="text-muted-foreground text-sm max-w-xs text-center px-4">
                Use ← → to move · Space to cast spells · Survive every Omen Wave
              </p>
            </div>
            <button
              onClick={handleStart}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg px-10 py-4 rounded-xl transition-all shadow-lg shadow-primary/30 hover:scale-105 active:scale-95"
            >
              ⚡ Begin
            </button>
          </div>
        )}
      </div>

      {/* Back link */}
      <button
        onClick={() => navigate('/')}
        className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Back to menu
      </button>

      {/* AI Debug Panel (DEV only) */}
      <AIDebugPanel config={lastConfig} loading={loading} error={error} />
    </div>
  )
}
