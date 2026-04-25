/**
 * useGameLoop — React hook that manages the full game lifecycle on a canvas ref.
 *
 * Responsibilities:
 * - Instantiates GameLoop, Wizard, WaveSystem, InputSystem, StatsTracker
 * - Drives the update → render cycle
 * - Detects wave completion → calls onWaveComplete with the stats snapshot
 * - Detects game over → calls onGameOver
 * - Exposes a mutable gameState ref for the HUD to read
 */

import { useRef, useEffect, useCallback } from 'react'
import { GameLoop } from '../game/GameLoop'
import { Wizard } from '../game/entities/Player'
import { DarkCreature } from '../game/entities/Enemy'
import { Spell } from '../game/entities/Bullet'
import { InputSystem } from '../game/systems/InputSystem'
import { WaveSystem } from '../game/systems/WaveSystem'
import { CollisionSystem } from '../game/systems/CollisionSystem'
import { StatsTracker } from '../game/StatsTracker'
import type { WaveConfig, PlayerStats, GameState } from '../../../shared/types'

interface UseGameLoopOptions {
  canvasRef: React.RefObject<HTMLCanvasElement>
  initialWaveConfig: WaveConfig
  onWaveComplete: (stats: PlayerStats, waveNumber: number) => void
  onGameOver: (finalScore: number, wave: number) => void
}

interface UseGameLoopReturn {
  gameStateRef: React.MutableRefObject<GameState>
  applyNextWave: (config: WaveConfig) => void
  startGame: () => void
  stopGame: () => void
}

// Health Potion power-up (simple rect)
interface PowerUp {
  x: number
  y: number
  width: number
  height: number
  vy: number
  color: string
}

export function useGameLoop({
  canvasRef,
  initialWaveConfig,
  onWaveComplete,
  onGameOver,
}: UseGameLoopOptions): UseGameLoopReturn {
  // ─── Mutable game state (NOT React state) ─────────────────────────────────
  const gameStateRef = useRef<GameState>({
    running: false,
    paused: false,
    wave: 1,
    score: 0,
    lives: 3,
    waveConfig: initialWaveConfig,
  })

  // ─── Game object refs ──────────────────────────────────────────────────────
  const loopRef       = useRef<GameLoop>(new GameLoop())
  const inputRef      = useRef<InputSystem>(new InputSystem())
  const statsRef      = useRef<StatsTracker>(new StatsTracker())
  const waveSystemRef = useRef<WaveSystem | null>(null)
  const wizardRef     = useRef<Wizard | null>(null)
  const enemiesRef    = useRef<DarkCreature[]>([])
  const bulletsRef    = useRef<Spell[]>([])
  const powerUpsRef   = useRef<PowerUp[]>([])
  const pendingWaveCfgRef = useRef<WaveConfig | null>(null)
  const waveCompleteRef   = useRef(false)

  // ─── Apply next wave config (called from GameScreen after AI responds) ─────
  const applyNextWave = useCallback((config: WaveConfig) => {
    pendingWaveCfgRef.current = config
  }, [])

  // ─── Spawn power-up (Health Potion) ───────────────────────────────────────
  const spawnPowerUp = useCallback((x: number, y: number) => {
    const style = getComputedStyle(document.body)
    const color = style.getPropertyValue('--color-accent').trim() || '#22c55e'
    powerUpsRef.current.push({ x, y, width: 18, height: 22, vy: 60, color })
  }, [])

  // ─── Main update function ──────────────────────────────────────────────────
  const update = useCallback((dt: number) => {
    const gs = gameStateRef.current
    if (!gs.running || gs.paused) return

    const canvas = canvasRef.current
    if (!canvas || !wizardRef.current) return

    const wizard  = wizardRef.current
    const input   = inputRef.current
    const stats   = statsRef.current
    const W       = canvas.width
    const H       = canvas.height

    // ── 1. Wizard update ─────────────────────────────────────────────────────
    wizard.update(dt, input.getState())

    // Auto-fire when Space held
    if (input.getState().fire) {
      const spell = wizard.shoot()
      if (spell) {
        bulletsRef.current.push(spell)
        stats.recordShot()
      }
    }

    // ── 2. Enemies update ────────────────────────────────────────────────────
    const enemies = enemiesRef.current
    for (const enemy of enemies) {
      enemy.update(dt)
      const shot = enemy.shoot()
      if (shot) bulletsRef.current.push(shot)
    }

    // ── 3. Bullets update & out-of-bounds cleanup ─────────────────────────────
    bulletsRef.current = bulletsRef.current.filter(b => {
      b.update(dt)
      return !b.isOutOfBounds(W, H)
    })

    // ── 4. Power-ups update ───────────────────────────────────────────────────
    powerUpsRef.current = powerUpsRef.current.filter(p => {
      p.y += (p.vy * dt) / 1000

      // Check collision with wizard
      if (CollisionSystem.aabb(p, wizard)) {
        wizard.lives = Math.min(wizard.lives + 1, 5)
        gs.lives = wizard.lives
        return false
      }
      return !CollisionSystem.isOutOfBounds(p, W, H)
    })

    // ── 5. Collision: player bullets vs enemies ────────────────────────────────
    const remainingBullets: Spell[] = []
    for (const bullet of bulletsRef.current) {
      if (!bullet.isPlayerBullet) {
        remainingBullets.push(bullet)
        continue
      }
      let hit = false
      for (const enemy of enemies) {
        if (enemy.isDead) continue
        if (CollisionSystem.aabb(bullet, enemy)) {
          const killed = enemy.hit(1)
          stats.recordHit()
          if (killed) {
            gs.score += 100
            stats.addScore(100)
          }
          hit = true
          break
        }
      }
      if (!hit) remainingBullets.push(bullet)
    }
    bulletsRef.current = remainingBullets

    // ── 6. Collision: enemy bullets vs wizard ──────────────────────────────────
    bulletsRef.current = bulletsRef.current.filter(bullet => {
      if (bullet.isPlayerBullet) return true
      if (CollisionSystem.aabb(bullet, wizard)) {
        const lost = wizard.takeHit()
        if (lost) {
          gs.lives = wizard.lives
          stats.recordLifeLost()
        }
        return false
      }
      return true
    })

    // ── 7. Enemy reaches bottom → hit wizard ──────────────────────────────────
    for (const enemy of enemies) {
      if (!enemy.isDead && enemy.y + enemy.height >= H - 20) {
        const lost = wizard.takeHit()
        if (lost) {
          gs.lives = wizard.lives
          stats.recordLifeLost()
        }
        enemy.hp = 0
      }
    }

    // ── 8. Remove dead enemies ────────────────────────────────────────────────
    enemiesRef.current = enemies.filter(e => !e.isDead)

    // ── 9. Game over check ────────────────────────────────────────────────────
    if (wizard.isDead) {
      gs.running = false
      loopRef.current.stop()
      inputRef.current.stopListening()
      onGameOver(gs.score, gs.wave)
      return
    }

    // ── 10. Wave complete check ───────────────────────────────────────────────
    if (enemiesRef.current.length === 0 && !waveCompleteRef.current) {
      waveCompleteRef.current = true
      const snapshot = stats.snapshot(gs.wave)

      // Spawn power-up if the completed wave config says so
      if (gs.waveConfig?.powerUpSpawn) {
        spawnPowerUp(W / 2 - 9, 20)
      }

      onWaveComplete(snapshot, gs.wave)
    }

    // ── 11. Apply pending wave config when ready ───────────────────────────────
    if (pendingWaveCfgRef.current && waveCompleteRef.current) {
      const cfg = pendingWaveCfgRef.current
      pendingWaveCfgRef.current = null
      waveCompleteRef.current = false

      gs.wave += 1
      gs.waveConfig = cfg
      gs.lives = wizardRef.current?.lives ?? gs.lives

      statsRef.current.reset()
      enemiesRef.current = waveSystemRef.current?.spawnWave(cfg) ?? []
    }
  }, [canvasRef, onWaveComplete, onGameOver, spawnPowerUp])

  // ─── Render function ───────────────────────────────────────────────────────
  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height

    // Background
    const style = getComputedStyle(document.body)
    const bg = style.getPropertyValue('--color-background').trim() || '#0d0d1a'
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    // Stars (static seed per frame)
    ctx.fillStyle = 'rgba(255,255,255,0.15)'
    for (let i = 0; i < 60; i++) {
      const sx = ((i * 137.5) % W)
      const sy = ((i * 73.1) % H)
      const r = i % 3 === 0 ? 1.5 : 0.8
      ctx.beginPath()
      ctx.arc(sx, sy, r, 0, Math.PI * 2)
      ctx.fill()
    }

    // Entities
    const wizard = wizardRef.current
    if (wizard) wizard.render(ctx)

    for (const enemy of enemiesRef.current) enemy.render(ctx)
    for (const bullet of bulletsRef.current) bullet.render(ctx)

    // Power-ups (Health Potions)
    for (const p of powerUpsRef.current) {
      ctx.save()
      ctx.shadowBlur = 12
      ctx.shadowColor = p.color
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.roundRect(p.x, p.y, p.width, p.height, 4)
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 12px serif'
      ctx.textAlign = 'center'
      ctx.fillText('♥', p.x + p.width / 2, p.y + p.height - 4)
      ctx.restore()
    }
  }, [canvasRef])

  // ─── Start / stop ──────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const W = canvas.width
    const H = canvas.height

    // Reset game state
    const gs = gameStateRef.current
    gs.running = true
    gs.paused = false
    gs.wave = 1
    gs.score = 0
    gs.lives = 3
    gs.waveConfig = initialWaveConfig

    // Init systems
    waveSystemRef.current = new WaveSystem(W, H)
    wizardRef.current = new Wizard({ canvasWidth: W, canvasHeight: H })
    enemiesRef.current = waveSystemRef.current.spawnWave(initialWaveConfig)
    bulletsRef.current = []
    powerUpsRef.current = []
    waveCompleteRef.current = false
    statsRef.current.reset()

    inputRef.current.startListening()

    const loop = loopRef.current
    loop.setUpdateCallback(update)
    loop.setRenderCallback(render)
    loop.start()
  }, [canvasRef, initialWaveConfig, update, render])

  const stopGame = useCallback(() => {
    loopRef.current.stop()
    inputRef.current.stopListening()
    gameStateRef.current.running = false
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      loopRef.current.stop()
      inputRef.current.stopListening()
    }
  }, [])

  return { gameStateRef, applyNextWave, startGame, stopGame }
}
