/**
 * WaveSystem — spawns and manages waves of DarkCreatures.
 * Translates AI-generated WaveConfig into positioned enemy arrays.
 * Pure TS, no React dependency.
 */

import { DarkCreature } from '../entities/Enemy'
import type { WaveConfig } from '../../../../shared/types'

export interface WaveSystemOptions {
  canvasWidth: number
  canvasHeight: number
}

export interface HealthPotion {
  x: number
  y: number
  width: number
  height: number
  vy: number
  active: boolean
}

const DEFAULT_WAVE: WaveConfig = {
  enemyCount: 6,
  speed: 1.0,
  shootFrequency: 0.5,
  pattern: 'swarm',
  powerUpSpawn: false,
  comment: 'The first Omen Wave approaches…',
}

export class WaveSystem {
  private canvasWidth: number
  private canvasHeight: number
  private currentConfig: WaveConfig = DEFAULT_WAVE

  enemies: DarkCreature[] = []
  healthPotion: HealthPotion | null = null

  constructor(opts: WaveSystemOptions) {
    this.canvasWidth = opts.canvasWidth
    this.canvasHeight = opts.canvasHeight
  }

  /** Apply a new WaveConfig (from AI or default) and spawn the wave */
  applyConfig(config: WaveConfig): void {
    this.currentConfig = config
    this.spawnEnemies()
    if (config.powerUpSpawn) {
      this.spawnHealthPotion()
    } else {
      this.healthPotion = null
    }
  }

  /** Start first wave with default config */
  startDefaultWave(): void {
    this.applyConfig(DEFAULT_WAVE)
  }

  get isWaveCleared(): boolean {
    return this.enemies.length > 0 && this.enemies.every(e => e.isDead)
  }

  get config(): WaveConfig {
    return this.currentConfig
  }

  /** Remove dead enemies and out-of-bounds — returns removed indices for cleanup */
  pruneEnemies(): void {
    this.enemies = this.enemies.filter(e => !e.isDead)
  }

  /** Update all living enemies; returns their fired spells */
  update(dt: number): import('../entities/Bullet').Spell[] {
    const fired: import('../entities/Bullet').Spell[] = []

    for (const enemy of this.enemies) {
      if (enemy.isDead) continue
      enemy.update(dt)
      const spell = enemy.shoot()
      if (spell) fired.push(spell)
    }

    // Update health potion
    if (this.healthPotion?.active) {
      this.healthPotion.y += (this.healthPotion.vy * dt) / 1000
      if (this.healthPotion.y > this.canvasHeight) {
        this.healthPotion.active = false
      }
    }

    return fired
  }

  /** Render all enemies and the health potion */
  render(ctx: CanvasRenderingContext2D): void {
    for (const enemy of this.enemies) {
      if (!enemy.isDead) enemy.render(ctx)
    }
    this.renderHealthPotion(ctx)
  }

  /** Check if player rect overlaps the health potion; consumes it if so */
  checkPotionPickup(playerRect: { x: number; y: number; width: number; height: number }): boolean {
    const p = this.healthPotion
    if (!p?.active) return false
    const overlap =
      playerRect.x < p.x + p.width &&
      playerRect.x + playerRect.width > p.x &&
      playerRect.y < p.y + p.height &&
      playerRect.y + playerRect.height > p.y
    if (overlap) {
      p.active = false
      return true
    }
    return false
  }

  // ─── Private ─────────────────────────────────────────────────────────────

  private spawnEnemies(): void {
    this.enemies = []
    const { enemyCount, speed, shootFrequency, pattern } = this.currentConfig

    const cols = Math.ceil(Math.sqrt(enemyCount))
    const rows = Math.ceil(enemyCount / cols)
    const spacingX = (this.canvasWidth - 60) / cols
    const spacingY = 48

    let count = 0
    for (let row = 0; row < rows && count < enemyCount; row++) {
      for (let col = 0; col < cols && count < enemyCount; col++) {
        const x = 30 + col * spacingX + (spacingX / 2 - 18)
        const y = 40 + row * spacingY

        // Map AI pattern to entity movement pattern
        const entityPattern = this.mapPattern(pattern, count, enemyCount)

        this.enemies.push(
          new DarkCreature({
            x,
            y,
            speed: speed * 80, // AI speed (0.5–3.0) → px/sec
            hp: Math.max(1, Math.floor(speed)),
            pattern: entityPattern,
            shootFrequency,
            canvasWidth: this.canvasWidth,
          }),
        )
        count++
      }
    }
  }

  /** Translate AI pattern name to DarkCreature movement pattern */
  private mapPattern(
    aiPattern: WaveConfig['pattern'],
    index: number,
    total: number,
  ): DarkCreature['pattern'] {
    switch (aiPattern) {
      case 'swarm':   return 'linear'
      case 'wall':    return 'linear'
      case 'random':  return (['linear', 'zigzag', 'hover'] as const)[index % 3]
      case 'pincer':  return index < total / 2 ? 'dive' : 'zigzag'
      case 'flanking': return index % 2 === 0 ? 'dive' : 'hover'
      default:        return 'linear'
    }
  }

  private spawnHealthPotion(): void {
    this.healthPotion = {
      x: Math.random() * (this.canvasWidth - 24),
      y: -30,
      width: 24,
      height: 30,
      vy: 80,
      active: true,
    }
  }

  private renderHealthPotion(ctx: CanvasRenderingContext2D): void {
    const p = this.healthPotion
    if (!p?.active) return

    ctx.save()
    // Bottle body
    ctx.fillStyle = '#22c55e'
    ctx.shadowBlur = 12
    ctx.shadowColor = '#22c55e'
    ctx.beginPath()
    ctx.roundRect(p.x + 4, p.y + 8, p.width - 8, p.height - 8, 4)
    ctx.fill()

    // Bottle neck
    ctx.fillStyle = '#16a34a'
    ctx.shadowBlur = 0
    ctx.fillRect(p.x + 8, p.y + 2, p.width - 16, 8)

    // Cork
    ctx.fillStyle = '#92400e'
    ctx.fillRect(p.x + 7, p.y, p.width - 14, 4)

    // Cross symbol
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    ctx.fillRect(p.x + p.width / 2 - 2, p.y + 12, 4, 12)
    ctx.fillRect(p.x + p.width / 2 - 6, p.y + 16, 12, 4)

    ctx.restore()
  }
}
