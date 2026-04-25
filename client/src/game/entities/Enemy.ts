/**
 * DarkCreature (alias Enemy) — AI-controlled enemy entity.
 * Movement pattern and shoot frequency are driven by WaveConfig.
 */

import { Spell, type Bullet } from './Bullet'

export type EnemyPattern = 'linear' | 'zigzag' | 'dive' | 'hover'

export interface WaveConfig {
  enemyCount: number
  enemySpeed: number          // px/sec
  enemyHp: number
  pattern: EnemyPattern
  shootFrequency: number      // shots per second (0 = never)
  scorePerKill: number
  comment?: string            // AI flavour text
}

export interface DarkCreatureOptions {
  x: number
  y: number
  pattern?: EnemyPattern
  speed?: number
  hp?: number
  shootFrequency?: number
  canvasWidth?: number
}

const ENEMY_W = 36
const ENEMY_H = 36
const ENEMY_BULLET_SPEED = 240

export class DarkCreature {
  x: number
  y: number
  width: number = ENEMY_W
  height: number = ENEMY_H
  speed: number
  hp: number
  pattern: EnemyPattern
  shootFrequency: number

  private canvasWidth: number
  private direction: number = 1       // 1 = right, -1 = left
  private zigzagTimer: number = 0
  private shootTimer: number = 0
  private colorCache: string | null = null
  private diveTarget: number

  constructor(opts: DarkCreatureOptions) {
    this.x = opts.x
    this.y = opts.y
    this.speed = opts.speed ?? 80
    this.hp = opts.hp ?? 1
    this.pattern = opts.pattern ?? 'linear'
    this.shootFrequency = opts.shootFrequency ?? 0
    this.canvasWidth = opts.canvasWidth ?? 480
    this.diveTarget = this.y + 60 + Math.random() * 80
  }

  get isDead(): boolean {
    return this.hp <= 0
  }

  /** Apply damage; returns true if killed */
  hit(dmg: number = 1): boolean {
    this.hp -= dmg
    return this.isDead
  }

  /** Update position. dt in ms. */
  update(dt: number, config?: Partial<WaveConfig>): void {
    if (config?.enemySpeed !== undefined) this.speed = config.enemySpeed
    if (config?.shootFrequency !== undefined) this.shootFrequency = config.shootFrequency

    const s = (this.speed * dt) / 1000

    switch (this.pattern) {
      case 'linear':
        this.x += this.direction * s
        if (this.x <= 0 || this.x + this.width >= this.canvasWidth) {
          this.direction *= -1
          this.y += 12
        }
        break

      case 'zigzag':
        this.zigzagTimer += dt
        this.x += this.direction * s
        if (this.zigzagTimer > 600) {
          this.direction *= -1
          this.zigzagTimer = 0
        }
        this.y += (s * 0.3)
        break

      case 'dive':
        if (this.y < this.diveTarget) {
          this.y += s
        } else {
          this.x += this.direction * s
          if (this.x <= 0 || this.x + this.width >= this.canvasWidth) {
            this.direction *= -1
          }
        }
        break

      case 'hover':
        // Oscillate horizontally without advancing downward
        this.zigzagTimer += dt
        this.x = Math.max(0, Math.min(
          this.canvasWidth - this.width,
          this.x + Math.sin(this.zigzagTimer / 400) * s * 1.5,
        ))
        break
    }

    // Update shoot timer
    if (this.shootFrequency > 0) {
      this.shootTimer += dt
    }
  }

  /** Returns a Spell if shoot timer triggered, null otherwise */
  shoot(): Bullet | null {
    if (this.shootFrequency <= 0) return null
    const interval = 1000 / this.shootFrequency
    if (this.shootTimer < interval) return null
    this.shootTimer = 0

    return new Spell({
      x: this.x + this.width / 2 - 3,
      y: this.y + this.height,
      vx: (Math.random() - 0.5) * 40,
      vy: ENEMY_BULLET_SPEED,
      isPlayerBullet: false,
    })
  }

  /** Render the creature on the canvas */
  render(ctx: CanvasRenderingContext2D): void {
    if (!this.colorCache) {
      const style = getComputedStyle(document.body)
      this.colorCache = style.getPropertyValue('--color-destructive').trim() || '#ef4444'
    }

    ctx.save()
    ctx.shadowBlur = 10
    ctx.shadowColor = this.colorCache
    ctx.fillStyle = this.colorCache

    // Body
    ctx.beginPath()
    ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2)
    ctx.fill()

    // HP pip indicators
    ctx.shadowBlur = 0
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    const maxPips = Math.min(this.hp, 5)
    for (let i = 0; i < maxPips; i++) {
      ctx.beginPath()
      ctx.arc(this.x + 6 + i * 7, this.y + this.height - 6, 2.5, 0, Math.PI * 2)
      ctx.fill()
    }

    // Eyes
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(this.x + 8, this.y + 10, 6, 6)
    ctx.fillRect(this.x + 22, this.y + 10, 6, 6)
    ctx.fillStyle = '#000000'
    ctx.fillRect(this.x + 10, this.y + 12, 3, 3)
    ctx.fillRect(this.x + 24, this.y + 12, 3, 3)

    ctx.restore()
  }
}

// Alias
export type Enemy = DarkCreature
