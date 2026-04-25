/**
 * Spell (alias Bullet) — projectile fired by the player or enemies.
 * Uses CSS custom properties for theme-aware colors on canvas.
 */

export interface BulletOptions {
  x: number
  y: number
  vx: number
  vy: number
  isPlayerBullet?: boolean
  width?: number
  height?: number
}

export class Spell {
  x: number
  y: number
  vx: number
  vy: number
  width: number
  height: number
  isPlayerBullet: boolean

  /** Resolved at first render for theme-aware coloring */
  private colorCache: string | null = null

  constructor(opts: BulletOptions) {
    this.x = opts.x
    this.y = opts.y
    this.vx = opts.vx
    this.vy = opts.vy
    this.isPlayerBullet = opts.isPlayerBullet ?? true
    this.width = opts.width ?? 6
    this.height = opts.height ?? 14
  }

  /** Update position using dt in ms */
  update(dt: number): void {
    const s = dt / 1000
    this.x += this.vx * s
    this.y += this.vy * s
  }

  /** Render on canvas context */
  render(ctx: CanvasRenderingContext2D): void {
    if (!this.colorCache) {
      const style = getComputedStyle(document.body)
      this.colorCache = this.isPlayerBullet
        ? style.getPropertyValue('--color-primary').trim() || '#a855f7'
        : style.getPropertyValue('--color-destructive').trim() || '#ef4444'
    }

    ctx.save()
    ctx.shadowBlur = 8
    ctx.shadowColor = this.colorCache
    ctx.fillStyle = this.colorCache

    // Draw orb shape
    ctx.beginPath()
    ctx.ellipse(
      this.x + this.width / 2,
      this.y + this.height / 2,
      this.width / 2,
      this.height / 2,
      0, 0, Math.PI * 2,
    )
    ctx.fill()

    // Bright core
    ctx.shadowBlur = 0
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.beginPath()
    ctx.ellipse(
      this.x + this.width / 2,
      this.y + this.height / 2,
      this.width / 4,
      this.height / 4,
      0, 0, Math.PI * 2,
    )
    ctx.fill()
    ctx.restore()
  }

  /** Returns true when the projectile is fully outside the canvas bounds */
  isOutOfBounds(canvasW: number, canvasH: number): boolean {
    return (
      this.x + this.width < 0 ||
      this.x > canvasW ||
      this.y + this.height < 0 ||
      this.y > canvasH
    )
  }
}

// Alias
export type Bullet = Spell
