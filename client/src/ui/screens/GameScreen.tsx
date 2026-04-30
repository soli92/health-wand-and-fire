/**
 * GameScreen — the main game view.
 * Owns: canvas ref, game state read loop, AI wave fetching, routing.
 * Game logic lives entirely in useGameLoop (pure JS, no React state in hot path).
 *
 * Import depth: client/src/ui/screens/ → ../../../../shared/types
 * (screens → ui → src → client → root → shared/types)
 */

import { useRef, useState, useCallback, useEffect, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameLoop } from '../../hooks/useGameLoop'
import { useAIWave } from '../../hooks/useAIWave'
import { useTouchUiMode } from '../../hooks/useTouchUiMode'
import SoliLogoLoader from '@/components/brand/SoliLogoLoader'
import HUD from '../hud/HUD'
import AIDebugPanel from '../hud/AIDebugPanel'
import VirtualControlsOverlay from '../overlays/VirtualControlsOverlay'
import TouchControlsSettingsPanel from '../overlays/TouchControlsSettingsPanel'
import {
  CANVAS_LOGICAL_HEIGHT,
  CANVAS_LOGICAL_WIDTH,
} from '../../game/canvasDimensions'
import {
  loadTouchControlSettings,
  saveTouchControlSettings,
  type TouchControlSettings,
} from '../../game/touchControlSettings'
import type { GameState } from '../../../../shared/types'
import type { StatsTracker } from '../../game/StatsTracker'

const CANVAS_W = CANVAS_LOGICAL_WIDTH
const CANVAS_H = CANVAS_LOGICAL_HEIGHT

/** Portrait: width-limited; landscape: height-limited. Keeps 480×640 playfield inside safe area. */
const gameViewportStyle: CSSProperties = {
  aspectRatio: `${CANVAS_W} / ${CANVAS_H}`,
  width:
    'min(calc(100vw - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px) - 16px), calc((100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 16px) * 480 / 640))',
  height: 'auto',
  maxWidth: '100%',
}

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
  const touchConfigRef = useRef<TouchControlSettings>(loadTouchControlSettings())

  // HUD state — updated via setInterval, NOT per-frame
  const [hudState, setHudState] = useState<GameState>(INITIAL_STATE)
  const [started, setStarted]   = useState(false)
  const [touchSettings, setTouchSettings] = useState<TouchControlSettings>(() => loadTouchControlSettings())
  const [touchDraft, setTouchDraft] = useState<TouchControlSettings>(() => loadTouchControlSettings())
  const wasPausedRef = useRef(false)

  const { loading, error, lastConfig, fetchNextWave } = useAIWave()
  const touchUiMode = useTouchUiMode()

  useEffect(() => {
    touchConfigRef.current = touchSettings
  }, [touchSettings])

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

  const { startGame, applyNextWave, pauseGame, resumeGame, applyTouchLayout, gameStateRef } =
    useGameLoop({
      canvasRef,
      touchConfigRef,
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

  // When pausing on touch UI, open draft editor from last applied layout
  useEffect(() => {
    if (touchUiMode && hudState.paused && !wasPausedRef.current) {
      setTouchDraft(touchSettings)
    }
    wasPausedRef.current = hudState.paused
  }, [touchUiMode, hudState.paused, touchSettings])

  const handleTouchApply = useCallback(() => {
    saveTouchControlSettings(touchDraft)
    setTouchSettings(touchDraft)
    touchConfigRef.current = touchDraft
    applyTouchLayout()
  }, [touchDraft, applyTouchLayout])

  const handleTouchRevert = useCallback(() => {
    setTouchDraft(touchSettings)
  }, [touchSettings])

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="game-screen flex w-full min-h-[calc(100dvh-3.5rem)] min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center bg-background px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-[max(0.5rem,env(safe-area-inset-top))]">

      {/* Game viewport — scales to fit narrow phones in portrait */}
      <div
        className="relative w-full max-w-full bg-black rounded-xl overflow-hidden shadow-2xl shadow-primary/20 border border-border"
        style={gameViewportStyle}
      >
        {/* Game canvas */}
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="block h-full w-full max-h-full max-w-full"
          aria-label="Health, Wand and Fire — game canvas"
        />

        {/* HUD — always on top when game started */}
        {started && <HUD gameState={hudState} aiLoading={loading} />}

        {/* Pause — touch devices have no P key */}
        {started && touchUiMode && hudState.running && !hudState.paused && !loading && (
          <button
            type="button"
            onClick={pauseGame}
            className="absolute z-[15] rounded-md border border-border bg-background/90 px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-md backdrop-blur-sm active:scale-95"
            style={{
              top: `${(touchSettings.pauseInsetTop / CANVAS_H) * 100}%`,
              right: `${(touchSettings.pauseInsetRight / CANVAS_W) * 100}%`,
            }}
            aria-label="Pause game"
          >
            Pause
          </button>
        )}

        {/* Virtual control zones — visible on coarse pointers (typical mobile) */}
        {started && touchUiMode && hudState.running && !hudState.paused && (
          <VirtualControlsOverlay settings={touchSettings} />
        )}

        {/* Pause overlay */}
        {hudState.paused && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 overflow-y-auto bg-background/80 px-2 py-4 backdrop-blur-sm">
            <p className="text-3xl font-bold text-primary">⏸ Paused</p>
            <p className="text-muted-foreground text-sm text-center px-4">
              {touchUiMode
                ? 'Adjust controls below, then Apply & save. Drag the Move ring and tap the Cast areas on the canvas.'
                : 'Press P to resume'}
            </p>
            {touchUiMode && (
              <TouchControlsSettingsPanel
                value={touchDraft}
                onChange={setTouchDraft}
                onApply={handleTouchApply}
                onReset={handleTouchRevert}
              />
            )}
            <button
              type="button"
              onClick={resumeGame}
              className="mt-1 bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-lg"
            >
              Resume
            </button>
          </div>
        )}

        {/* AI between-waves overlay */}
        {loading && !hudState.paused && (
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-20 pointer-events-none">
            <SoliLogoLoader />
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
                    After you begin, use the <strong className="text-foreground">Move</strong> ring and{' '}
                    <strong className="text-foreground">Cast</strong> zones on the canvas. Open{' '}
                    <strong className="text-foreground">Pause</strong> anytime to change position, size, and
                    transparency — settings are saved on this device.
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
