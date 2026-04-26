/**
 * GameScreen — the main game view.
 * Owns: canvas ref, game state read loop, AI wave fetching, routing.
 * Game logic lives entirely in useGameLoop (pure JS, no React state in hot path).
 *
 * Import depth: client/src/ui/screens/ → ../../../../shared/types
 * (screens → ui → src → client → root → shared/types)
 */

import { useRef, useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameLoop } from '../../hooks/useGameLoop'
import { useAIWave } from '../../hooks/useAIWave'
import { useTouchUiMode } from '../../hooks/useTouchUiMode'
import HUD from '../hud/HUD'
import AIDebugPanel from '../hud/AIDebugPanel'
import VirtualControlsOverlay from '../overlays/VirtualControlsOverlay'
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
  const [started, setStarted]   = useState(false)

  const { loading, error, lastConfig, fetchNextWave } = useAIWave()
  const touchUiMode = useTouchUiMode()

  // ── Callbacks ─────────────────────────────────────────────────────────────

  const handleGameStateChange = useCallback((state: GameState) => {
    setHudState({ ...state })
  }, [])

  const handleGameOver = useCallback(
    (finalScore: number) => {
      navigate('/gameover', {
        state: { score: finalScore, wave: hudState.wave },
      })
    },
    [navigate, hudState.wave],
  )

  // ── Game loop hook (must be defined before handleWaveEnd uses applyNextWave) ─

  const { startGame, applyNextWave, pauseGame, resumeGame, gameStateRef } =
    useGameLoop({
      canvasRef,
      onGameStateChange: handleGameStateChange,
      onWaveEnd: async (snapshot: ReturnType<StatsTracker['snapshot']>) => {
        const playerStats = {
          wave:        snapshot.wave,
          accuracy:    snapshot.accuracy,
          livesLost:   snapshot.livesLost,
          timeMs:      snapshot.waveDurationMs,
          scoreGained: snapshot.scoreGained,
        }
        const config = await fetchNextWave(playerStats)
        if (config) applyNextWave(config)
      },
      onGameOver: handleGameOver,
    })

  // ── HUD polling — reads mutable ref every 200ms ───────────────────────────

  useEffect(() => {
    if (!started) return
    const id = setInterval(() => {
      setHudState({ ...gameStateRef.current })
    }, 200)
    return () => clearInterval(id)
  }, [started, gameStateRef])

  // ── Start ─────────────────────────────────────────────────────────────────

  const handleStart = useCallback(() => {
    setStarted(true)
    setHudState(INITIAL_STATE)
    startGame()
  }, [startGame])

  // ── P = pause/resume ──────────────────────────────────────────────────────

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'KeyP') return
      if (gameStateRef.current.paused) resumeGame()
      else pauseGame()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pauseGame, resumeGame, gameStateRef])

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">

      {/* Fixed-size game viewport */}
      <div
        className="relative bg-black rounded-xl overflow-hidden shadow-2xl shadow-primary/20 border border-border"
        style={{ width: CANVAS_W, height: CANVAS_H }}
      >
        {/* Game canvas */}
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="block"
          aria-label="Health, Wand and Fire — game canvas"
        />

        {/* HUD — always on top when game started */}
        {started && <HUD gameState={hudState} aiLoading={loading} />}

        {/* Pause — touch devices have no P key */}
        {started && touchUiMode && hudState.running && !hudState.paused && !loading && (
          <button
            type="button"
            onClick={pauseGame}
            className="absolute right-2 top-10 z-[15] rounded-md border border-border bg-background/90 px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-md backdrop-blur-sm active:scale-95"
            aria-label="Pause game"
          >
            Pause
          </button>
        )}

        {/* Virtual control zones — visible on coarse pointers (typical mobile) */}
        {started && touchUiMode && hudState.running && !hudState.paused && (
          <VirtualControlsOverlay />
        )}

        {/* Pause overlay */}
        {hudState.paused && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-20">
            <p className="text-3xl font-bold text-primary">⏸ Paused</p>
            <p className="text-muted-foreground text-sm text-center px-4">
              {touchUiMode
                ? 'Tap Resume below. On the canvas: drag the Move ring and tap the Cast strip to play.'
                : 'Press P to resume'}
            </p>
            <button
              type="button"
              onClick={resumeGame}
              className="mt-2 bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-lg"
            >
              Resume
            </button>
          </div>
        )}

        {/* AI between-waves overlay */}
        {loading && !hudState.paused && (
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-20 pointer-events-none">
            <div className="text-4xl animate-spin">✨</div>
            <p className="text-primary font-semibold text-center px-6">
              The AI Director prepares the next Omen Wave…
            </p>
          </div>
        )}

        {/* Pre-start overlay */}
        {!started && (
          <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center gap-6 z-20">
            <div className="text-center space-y-2">
              <div className="text-5xl">🧙‍♂️</div>
              <h2 className="text-2xl font-bold text-primary">Ready, Wizard?</h2>
              <p className="text-muted-foreground text-sm max-w-xs text-center px-4">
                Survive every Omen Wave. The AI adapts — and so must you.
              </p>
            </div>

            {/* Controls */}
            <div className="text-xs text-muted-foreground space-y-2 text-center max-w-[300px]">
              {touchUiMode ? (
                <>
                  <p className="text-primary/90 font-medium text-[13px]">On-screen controls</p>
                  <p className="text-[11px] leading-relaxed">
                    After you begin, you will see a <strong className="text-foreground">Move</strong> ring
                    bottom-left and a shaded <strong className="text-foreground">Cast</strong> strip along
                    the bottom edge. Drag inside the ring to strafe; tap the strip (outside the ring) to
                    fire. Use the <strong className="text-foreground">Pause</strong> button (top-right) to
                    stop, then <strong className="text-foreground">Resume</strong> here.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    <kbd className="bg-muted px-1.5 py-0.5 rounded text-foreground">← →</kbd>
                    {' / '}
                    <kbd className="bg-muted px-1.5 py-0.5 rounded text-foreground">A D</kbd>
                    {'  '}Move
                  </p>
                  <p>
                    <kbd className="bg-muted px-1.5 py-0.5 rounded text-foreground">Space</kbd>
                    {'  '}Cast Spell
                    {'  '}
                    <kbd className="bg-muted px-1.5 py-0.5 rounded text-foreground">P</kbd>
                    {'  '}Pause
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    Touch devices: you can still use the on-screen ring and bottom bar after starting.
                  </p>
                </>
              )}
            </div>

            <button
              onClick={handleStart}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg px-10 py-4 rounded-xl transition-all shadow-lg shadow-primary/30 hover:scale-105 active:scale-95"
            >
              ⚡ Begin the Omen
            </button>

            <button
              onClick={() => navigate('/')}
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              ← Back to Menu
            </button>
          </div>
        )}
      </div>

      {/* AI Debug Panel — DEV only, outside canvas so it floats freely */}
      <AIDebugPanel config={lastConfig} loading={loading} error={error} />
    </div>
  )
}
