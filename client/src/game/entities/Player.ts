/**
 * Wizard (alias Player) — the player-controlled character.
 * Moves horizontally, fires upward Spell projectiles.
 */

import { Spell, type Bullet } from './Bullet'
import type { InputState } from '../systems/InputSystem'

const PLAYER_SPEED = 280         // px/sec
const SPELL_COOLDOWN_MS = 300    // minimum ms between shots
const SPELL_SPEED = 520          // px/sec upward
const INITIAL_LIVES = 3

export interface WizardOptions {
  x?: number
  y?: number
  canvasWidth?: number
  canvasHeight?: number
}

export class Wizard {
  x: number
  y: number
  width: number = 40
  height: number = 48
  speed: number = PLAYER_SPEED
  lives: number = INITIAL_LIVES
  spellCooldown: number = 0       // countdown in ms; 0 = can shoot

  private canvasWidth: number
  private canvasHeight: number
  private colorCache: string | null = null
  private invincibleMs: number = 0  // brief invincibility after taking damage

  constructor(opts: WizardOptions = {}) {
    this.canvasWidth = opts.canvasWidth ?? 480
    this.canvasHeight = opts.canvasHeight ?? 640
    this.x = opts.x ?? this.canvasWidth / 2 - this.width / 2
    this.y = opts.y ?? this.canvasHeight - this.height - 16
  }

  /** Update position and cooldowns. dt in ms. */
  update(dt: number, inputState: InputState): void {
    const ds = (this.speed * dt) / 1000

    if (inputState.left) this.x = Math.max(0, this.x - ds)
    if (inputState.right) this.x = Math.min(this.canvasWidth - this.width, this.x + ds)

    if (this.spellCooldown > 0) this.spellCooldown = Math.max(0, this.spellCooldown - dt)
    if (this.invincibleMs > 0) this.invincibleMs = Math.max(0, this.invincibleMs - dt)
  }

  /** Returns a new Spell if cooldown has elapsed, otherwise null */
  shoot(): Bullet | null {
    if (this.spellCooldown > 0) return null
    this.spellCooldown = SPELL_COOLDOWN_MS

    return new Spell({
      x: this.x + this.width / 2 - 3,
      y: this.y - 14,
      vx: 0,
      vy: -SPELL_SPEED,
      isPlayerBullet: true,
    })
  }

  /** Take a hit — reduces lives if not invincible */
  takeHit(): boolean {
    if (this.invincibleMs > 0) return false
    this.lives--
    this.invincibleMs = 1200 // 1.2 sec invincibility window
    return true
  }

  get isDead(): boolean {
    return this.lives <= 0
  }

  get isInvincible(): boolean {
    return this.invincibleMs > 0
  }

  /** Render the wizard on the canvas */
  render(ctx: CanvasRenderingContext2D): void {
    if (!this.colorCache) {
      const style = getComputedStyle(document.body)
      this.colorCache = style.getPropertyValue('--color-primary').trim() || '#a855f7'
    }

    const cx = this.x + this.width / 2
    const flicker = this.invincibleMs > 0 && Math.floor(this.invincibleMs / 100) % 2 === 0

    ctx.save()
    if (flicker) ctx.globalAlpha = 0.35

    // Robe / body
    ctx.fillStyle = this.colorCache
    ctx.shadowBlur = 12
    ctx.shadowColor = this.colorCache
    ctx.beginPath()
    ctx.moveTo(this.x + 4, this.y + this.height)
    ctx.lineTo(this.x, this.y + this.height - 10)
    ctx.lineTo(this.x + 12, this.y + 8)
    ctx.lineTo(cx, this.y)
    ctx.lineTo(this.x + this.width - 12, this.y + 8)
    ctx.lineTo(this.x + this.width, this.y + this.height - 10)
    ctx.lineTo(this.x + this.width - 4, this.y + this.height)
    ctx.closePath()
    ctx.fill()

    // Hat
    ctx.beginPath()
    ctx.moveTo(this.x + 8, this.y + 12)
    ctx.lineTo(cx, this.y - 14)
    ctx.lineTo(this.x + this.width - 8, this.y + 12)
    ctx.closePath()
    ctx.fill()

    // Eyes
    ctx.shadowBlur = 0
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(cx - 8, this.y + 14, 5, 5)
    ctx.fillRect(cx + 3, this.y + 14, 5, 5)

    ctx.restore()
  }
}

// Alias
export type Player = Wizard
