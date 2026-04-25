/**
 * useGameLoop — React hook that wires up the full game engine to a canvas ref.
 * All game state lives in refs to avoid React re-render overhead.
 */

import { useRef, useCallback, useEffect } from 'react'
import { GameLoop } from '@/game/GameLoop'
import { Wizard } from '@/game/entities/Player'
import { type Spell } from '@/game/entities/Bullet'
import { type DarkCreature } from '@/game/entities/Enemy'
import { WaveSystem, type WaveConfig } from '@/game/systems/WaveSystem'
import { InputSystem } from '@/game/systems/InputSystem'
import { checkCollisions } from '@/game/systems/CollisionSystem'
import { StatsTracker } from '@/game/StatsTracker'

export type GameStatus = 'idle' | 'playing' | 'wave_complete' | 'game_over'

export interface GameState {
  status: GameStatus
  score: number
  wave: number
  lives: number
}

interface UseGameLoopReturn {
  gameStateRef: React.MutableRefObject<GameState>
  startGame: () => void
  stopGame: () => void
  applyNextWave: (config: WaveConfig) => void
  statsTracker: StatsTracker
}

export function useGameLoop(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  onWaveComplete: (wave: number) => void,
  onGameOver: () => void,
): UseGameLoopReturn {
  // ── Stable refs (never re-created after mount) ──────────────────────────────
  const gameLoopRef = useRef<GameLoop>(new GameLoop())
  const inputRef    = useRef<InputSystem>(new InputSystem())
  const waveRef     = useRef<WaveSystem>(new WaveSystem())
  const statsRef    = useRef<StatsTracker>(new StatsTracker())

  const playerRef        = useRef<Wizard | null>(null)
  const enemiesRef       = useRef<DarkCreature[]>([])
  const playerBulletsRef = useRef<Spell[]>([])
  const enemyBulletsRef  = useRef<Spell[]>([])

  const gameStateRef = useRef<GameState>({
    status: 'idle',
    score: 0,
    wave: 0,
    lives: 3,
  })

  // ── Canvas helpers ────────────────────────────────────────────────────────
  const getCtx = useCallback((): CanvasRenderingContext2D | null => {
    return canvasRef.current?.getContext('2d') ?? null
  }, [canvasRef])

  const getCanvas = useCallback(() => canvasRef.current, [canvasRef])

  // ── Update (fixed timestep) ───────────────────────────────────────────────
  const update = useCallback((dt: number) => {
    const state = gameStateRef.current
    if (state.status !== 'playing') return

    const canvas = getCanvas()
    const player = playerRef.current
    if (!player || !canvas) return

    const input = inputRef.current.getState()
    player.update(dt, input)

    // Player fires
    if (input.fire) {
      const bullet = player.shoot()
      if (bullet) {
        playerBulletsRef.current.push(bullet)
        statsRef.current.recordShot()
      }
    }

    // Update enemies + collect their shots
    for (const enemy of enemiesRef.current) {
      enemy.update(dt)
      const shot = enemy.shoot()
      if (shot) enemyBulletsRef.current.push(shot)
    }

    // Update bullets
    playerBulletsRef.current.forEach(b => b.update(dt))
    enemyBulletsRef.current.forEach(b => b.update(dt))

    // Cull out-of-bounds bullets
    const { width: W, height: H } = canvas
    playerBulletsRef.current = playerBulletsRef.current.filter(b => !b.isOutOfBounds(W, H))
    enemyBulletsRef.current  = enemyBulletsRef.current.filter(b => !b.isOutOfBounds(W, H))

    // Collision detection
    const result = checkCollisions(
      player,
      enemiesRef.current,
      playerBulletsRef.current,
      enemyBulletsRef.current,
      waveRef.current.getConfig().scorePerKill,
    )

    if (result.enemiesKilled > 0) statsRef.current.recordHit()
    if (result.livesLost > 0) statsRef.current.recordLifeLost()

    state.score += result.scoreGained
    state.lives  = player.lives

    // Game over check
    if (player.isDead) {
      state.status = 'game_over'
      gameLoopRef.current.stop()
      inputRef.current.stopListening()
      onGameOver()
      return
    }

    // Wave complete check
    if (waveRef.current.isWaveComplete(enemiesRef.current)) {
      state.status = 'wave_complete'
      onWaveComplete(state.wave)
    }
  }, [getCanvas, onGameOver, onWaveComplete])

  // ── Render ────────────────────────────────────────────────────────────────
  const render = useCallback(() => {
    const ctx = getCtx()
    const canvas = getCanvas()
    if (!ctx || !canvas) return

    // Clear with dark background
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const style = getComputedStyle(document.body)
    const bgColor = style.getPropertyValue('--color-background').trim() || '#0d0d1a'
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw starfield (simple static pattern)
    ctx.fillStyle = 'rgba(255,255,255,0.25)'
    for (let i = 0; i < 40; i++) {
      const sx = ((i * 137.5) % canvas.width)
      const sy = ((i * 97.3) % canvas.height)
      ctx.fillRect(sx, sy, 1, 1)
    }

    // Draw entities
    playerRef.current?.render(ctx)
    enemiesRef.current.forEach(e => e.render(ctx))
    playerBulletsRef.current.forEach(b => b.render(ctx))
    enemyBulletsRef.current.forEach(b => b.render(ctx))
  }, [getCtx, getCanvas])

  // ── Public API ────────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    const canvas = getCanvas()
    if (!canvas) return

    // Resize canvas to its layout size
    canvas.width  = canvas.offsetWidth  || 480
    canvas.height = canvas.offsetHeight || 640

    // Reset wave system with first-wave dimensions
    waveRef.current = new WaveSystem(canvas.width, canvas.height)
    statsRef.current.reset()

    const initialState: GameState = {
      status: 'playing',
      score: 0,
      wave: 1,
      lives: 3,
    }
    gameStateRef.current = initialState

    // Spawn player
    playerRef.current = new Wizard({
      canvasWidth:  canvas.width,
      canvasHeight: canvas.height,
    })

    // Spawn first wave
    enemiesRef.current      = waveRef.current.spawnWave()
    playerBulletsRef.current = []
    enemyBulletsRef.current  = []

    inputRef.current.startListening()
    gameLoopRef.current.setUpdateCallback(update)
    gameLoopRef.current.setRenderCallback(render)
    gameLoopRef.current.start()
  }, [getCanvas, update, render])

  const stopGame = useCallback(() => {
    gameLoopRef.current.stop()
    inputRef.current.stopListening()
    gameStateRef.current.status = 'idle'
  }, [])

  /** Called after AI returns the next wave config */
  const applyNextWave = useCallback((config: WaveConfig) => {
    const canvas = getCanvas()
    if (!canvas) return

    const state = gameStateRef.current
    state.wave++
    state.status = 'playing'
    statsRef.current.reset()

    waveRef.current.applyConfig(config)
    enemiesRef.current      = waveRef.current.spawnWave()
    playerBulletsRef.current = []
    enemyBulletsRef.current  = []

    if (!gameLoopRef.current.isRunning) {
      gameLoopRef.current.setUpdateCallback(update)
      gameLoopRef.current.setRenderCallback(render)
      gameLoopRef.current.start()
    }
  }, [getCanvas, update, render])

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      gameLoopRef.current.stop()
      inputRef.current.stopListening()
    }
  }, [])

  return {
    gameStateRef,
    startGame,
    stopGame,
    applyNextWave,
    statsTracker: statsRef.current,
  }
}
