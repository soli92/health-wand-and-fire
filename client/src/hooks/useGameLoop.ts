/**
 * useGameLoop — React hook that wires the canvas game engine to React lifecycle.
 * Manages: GameLoop, InputSystem, WaveSystem, StatsTracker, CollisionSystem.
 * Game state lives in a mutable ref — NO React.setState in hot path.
 */

import { useRef, useEffect, useCallback } from 'react'
import { GameLoop } from '../game/GameLoop'
import { Wizard } from '../game/entities/Player'
import { Spell } from '../game/entities/Bullet'
import { InputSystem } from '../game/systems/InputSystem'
import { WaveSystem } from '../game/systems/WaveSystem'
import { StatsTracker } from '../game/StatsTracker'
import { runCollisions } from '../game/systems/CollisionSystem'
import type { WaveConfig, GameState } from '../../../shared/types'

export interface UseGameLoopOptions {
  canvasRef: React.RefObject<HTMLCanvasElement>
  onGameStateChange: (state: GameState) => void
  onWaveEnd: (stats: ReturnType<StatsTracker['snapshot']>) => void
  onGameOver: (finalScore: number) => void
}

const CANVAS_W = 480
const CANVAS_H = 640
const STARS_COUNT = 60

interface Star { x: number; y: number; r: number; speed: number }

export function useGameLoop({
  canvasRef,
  onGameStateChange,
  onWaveEnd,
  onGameOver,
}: UseGameLoopOptions) {
  const loopRef = useRef<GameLoop | null>(null)
  const inputRef = useRef<InputSystem | null>(null)
  const waveRef = useRef<WaveSystem | null>(null)
  const statsRef = useRef<StatsTracker | null>(null)
  const wizardRef = useRef<Wizard | null>(null)
  const spellsRef = useRef<Spell[]>([])
  const starsRef = useRef<Star[]>([])
  const gameStateRef = useRef<GameState>({
    running: false,
    paused: false,
    wave: 1,
    score: 0,
    lives: 3,
    waveConfig: null,
  })
  const waitingForAIRef = useRef(false)

  /** Initialize stars background */
  const initStars = useCallback(() => {
    starsRef.current = Array.from({ length: STARS_COUNT }, () => ({
      x: Math.random() * CANVAS_W,
      y: Math.random() * CANVAS_H,
      r: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 20 + 10,
    }))
  }, [])

  /** Render starfield */
  const renderStars = useCallback((ctx: CanvasRenderingContext2D, dt: number) => {
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    for (const star of starsRef.current) {
      star.y += (star.speed * dt) / 1000
      if (star.y > CANVAS_H) star.y = 0
      ctx.beginPath()
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [])

  const startGame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Init subsystems
    const loop = new GameLoop()
    const input = new InputSystem()
    const wave = new WaveSystem({ canvasWidth: CANVAS_W, canvasHeight: CANVAS_H })
    const stats = new StatsTracker()
    const wizard = new Wizard({ canvasWidth: CANVAS_W, canvasHeight: CANVAS_H })

    loopRef.current = loop
    inputRef.current = input
    waveRef.current = wave
    statsRef.current = stats
    wizardRef.current = wizard
    spellsRef.current = []

    // Reset game state
    gameStateRef.current = {
      running: true,
      paused: false,
      wave: 1,
      score: 0,
      lives: wizard.lives,
      waveConfig: null,
    }
    waitingForAIRef.current = false

    initStars()
    input.startListening()
    wave.startDefaultWave()

    // ── Update ──────────────────────────────────────────────────────────────
    loop.setUpdateCallback((dt) => {
      const gs = gameStateRef.current
      if (!gs.running || gs.paused || waitingForAIRef.current) return

      const inputState = input.getState()

      // Player update
      wizard.update(dt, inputState)

      // Auto-fire on FIRE held
      if (inputState.fire) {
        const spell = wizard.shoot()
        if (spell) {
          spellsRef.current.push(spell)
          stats.recordShot()
        }
      }

      // Wave / enemy update
      const newSpells = wave.update(dt)
      spellsRef.current.push(...newSpells)

      // Spell update + out-of-bounds prune
      spellsRef.current.forEach(s => s.update(dt))
      spellsRef.current = spellsRef.current.filter(
        s => !s.isOutOfBounds(CANVAS_W, CANVAS_H),
      )

      // Collision
      const col = runCollisions(wizard, wave.enemies, spellsRef.current)

      // Remove hit spells
      spellsRef.current = spellsRef.current.filter((_, i) => !col.playerSpellHits.has(i) && !col.enemySpellHits.has(i))

      // Stats
      if (col.hitsRegistered > 0) {
        for (let i = 0; i < col.hitsRegistered; i++) stats.recordHit()
      }
      if (col.playerWasHit) stats.recordLifeLost()
      if (col.scoreGained > 0) {
        stats.addScore(col.scoreGained)
        gs.score += col.scoreGained
      }

      // Prune dead enemies
      wave.pruneEnemies()

      // Health potion pickup
      if (wave.checkPotionPickup(wizard)) {
        if (wizard.lives < 3) wizard.lives++
      }

      // Sync lives
      gs.lives = wizard.lives

      // Game over check
      if (wizard.isDead) {
        gs.running = false
        input.stopListening()
        loop.stop()
        onGameOver(gs.score)
        return
      }

      // Wave clear check
      if (wave.isWaveCleared && !waitingForAIRef.current) {
        waitingForAIRef.current = true
        const snapshot = stats.snapshot(gs.wave)
        stats.reset()
        onWaveEnd(snapshot)
      }
    })

    // ── Render ──────────────────────────────────────────────────────────────
    loop.setRenderCallback(() => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Background
      const style = getComputedStyle(document.body)
      const bg = style.getPropertyValue('--color-background').trim() || '#0a0a14'
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

      renderStars(ctx, 16) // approx 60fps dt

      // Entities
      wave.render(ctx)
      spellsRef.current.forEach(s => s.render(ctx))
      wizard.render(ctx)
    })

    loop.start()
    onGameStateChange({ ...gameStateRef.current })
  }, [canvasRef, initStars, renderStars, onGameStateChange, onWaveEnd, onGameOver])

  /** Called by React (useAIWave) when AI returns next wave config */
  const applyNextWave = useCallback((config: WaveConfig) => {
    const gs = gameStateRef.current
    gs.wave += 1
    gs.waveConfig = config
    waveRef.current?.applyConfig(config)
    spellsRef.current = []
    waitingForAIRef.current = false
    onGameStateChange({ ...gs })
  }, [onGameStateChange])

  const pauseGame = useCallback(() => {
    gameStateRef.current.paused = true
    onGameStateChange({ ...gameStateRef.current })
  }, [onGameStateChange])

  const resumeGame = useCallback(() => {
    gameStateRef.current.paused = false
    onGameStateChange({ ...gameStateRef.current })
  }, [onGameStateChange])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      loopRef.current?.stop()
      inputRef.current?.stopListening()
    }
  }, [])

  return { startGame, applyNextWave, pauseGame, resumeGame, gameStateRef }
}
