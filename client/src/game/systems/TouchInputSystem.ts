/**
 * TouchInputSystem — virtual joystick (movement) + bottom fire strip for mobile.
 * Pointer events on the canvas; coordinates mapped from CSS pixels to canvas space.
 * Pure TS except DOM; pair with InputSystem and merge InputState in the game loop.
 */

import type { InputState } from './InputSystem'
import {
  CANVAS_LOGICAL_HEIGHT,
  CANVAS_LOGICAL_WIDTH,
} from '../canvasDimensions'

export type TouchLayoutOptions = {
  canvasW: number
  canvasH: number
  fireZoneH: number
  stickCx: number
  stickCy: number
  stickRadius: number
  stickDead: number
}

export const TOUCH_DEFAULTS: TouchLayoutOptions = {
  canvasW: CANVAS_LOGICAL_WIDTH,
  canvasH: CANVAS_LOGICAL_HEIGHT,
  fireZoneH: 96,
  stickCx: 76,
  stickCy: CANVAS_LOGICAL_HEIGHT - 76,
  stickRadius: 58,
  stickDead: 16,
}

/** Map client coordinates to canvas logical coordinates (handles CSS scaling). */
export function clientToGameCoords(
  rect: { left: number; top: number; width: number; height: number },
  canvasW: number,
  canvasH: number,
  clientX: number,
  clientY: number,
): { gx: number; gy: number } {
  const w = rect.width || 1
  const h = rect.height || 1
  const gx = ((clientX - rect.left) / w) * canvasW
  const gy = ((clientY - rect.top) / h) * canvasH
  return { gx, gy }
}

export function inJoystickDisc(
  gx: number,
  gy: number,
  cx: number,
  cy: number,
  radius: number,
): boolean {
  const dx = gx - cx
  const dy = gy - cy
  return dx * dx + dy * dy <= radius * radius
}

/** Bottom strip for casting, excluding the joystick disc so move + fire stay separate. */
export function inFireStrip(
  gx: number,
  gy: number,
  canvasH: number,
  fireZoneH: number,
  stickCx: number,
  stickCy: number,
  stickRadius: number,
): boolean {
  if (gy < canvasH - fireZoneH) return false
  if (inJoystickDisc(gx, gy, stickCx, stickCy, stickRadius)) return false
  return true
}

export class TouchInputSystem {
  private canvas: HTMLCanvasElement | null = null
  private readonly canvasW: number
  private readonly canvasH: number
  private fireZoneH: number
  private stickCx: number
  private stickCy: number
  private stickRadius: number
  private stickDead: number

  private stickPointerId: number | null = null
  private readonly firePointerIds = new Set<number>()
  private stickLeft = false
  private stickRight = false

  private boundDown: (e: PointerEvent) => void
  private boundMove: (e: PointerEvent) => void
  private boundUp: (e: PointerEvent) => void
  private boundCancel: (e: PointerEvent) => void

  constructor(opts: Partial<TouchLayoutOptions> = {}) {
    const d = { ...TOUCH_DEFAULTS, ...opts }
    this.canvasW = d.canvasW
    this.canvasH = d.canvasH
    this.fireZoneH = d.fireZoneH
    this.stickCx = d.stickCx
    this.stickCy = d.stickCy
    this.stickRadius = d.stickRadius
    this.stickDead = d.stickDead

    this.boundDown = this.onPointerDown.bind(this)
    this.boundMove = this.onPointerMove.bind(this)
    this.boundUp = this.onPointerUp.bind(this)
    this.boundCancel = this.onPointerCancel.bind(this)
  }

  /** Update hit zones without re-attaching listeners (e.g. user moved controls). */
  applyLayout(opts: Partial<TouchLayoutOptions>): void {
    const d = { ...TOUCH_DEFAULTS, ...opts }
    this.fireZoneH = d.fireZoneH
    this.stickCx = d.stickCx
    this.stickCy = d.stickCy
    this.stickRadius = d.stickRadius
    this.stickDead = d.stickDead
  }

  attach(canvas: HTMLCanvasElement): void {
    this.detach()
    this.canvas = canvas
    canvas.addEventListener('pointerdown', this.boundDown)
    canvas.addEventListener('pointermove', this.boundMove)
    canvas.addEventListener('pointerup', this.boundUp)
    canvas.addEventListener('pointercancel', this.boundCancel)
    canvas.style.touchAction = 'none'
  }

  detach(): void {
    const c = this.canvas
    if (!c) return
    c.removeEventListener('pointerdown', this.boundDown)
    c.removeEventListener('pointermove', this.boundMove)
    c.removeEventListener('pointerup', this.boundUp)
    c.removeEventListener('pointercancel', this.boundCancel)
    this.clearStick()
    this.firePointerIds.clear()
    this.canvas = null
  }

  getState(): InputState {
    return {
      left: this.stickLeft,
      right: this.stickRight,
      fire: this.firePointerIds.size > 0,
    }
  }

  private rect(): DOMRect {
    return this.canvas?.getBoundingClientRect() ?? new DOMRect(0, 0, this.canvasW, this.canvasH)
  }

  private toGame(clientX: number, clientY: number): { gx: number; gy: number } {
    return clientToGameCoords(this.rect(), this.canvasW, this.canvasH, clientX, clientY)
  }

  private onPointerDown(e: PointerEvent): void {
    if (!this.canvas || e.button !== 0) return
    const { gx, gy } = this.toGame(e.clientX, e.clientY)

    if (inJoystickDisc(gx, gy, this.stickCx, this.stickCy, this.stickRadius)) {
      if (this.stickPointerId === null) {
        this.stickPointerId = e.pointerId
        this.canvas.setPointerCapture(e.pointerId)
        this.updateStickFromGx(gx)
      }
      return
    }

    if (inFireStrip(gx, gy, this.canvasH, this.fireZoneH, this.stickCx, this.stickCy, this.stickRadius)) {
      this.firePointerIds.add(e.pointerId)
      this.canvas.setPointerCapture(e.pointerId)
    }
  }

  private onPointerMove(e: PointerEvent): void {
    if (e.pointerId !== this.stickPointerId) return
    const { gx } = this.toGame(e.clientX, e.clientY)
    this.updateStickFromGx(gx)
  }

  private onPointerUp(e: PointerEvent): void {
    if (!this.canvas) return
    if (this.firePointerIds.has(e.pointerId)) {
      this.firePointerIds.delete(e.pointerId)
    }
    if (e.pointerId === this.stickPointerId) {
      this.clearStick()
      try {
        this.canvas.releasePointerCapture(e.pointerId)
      } catch {
        /* ignore if not captured */
      }
    }
  }

  private onPointerCancel(e: PointerEvent): void {
    this.onPointerUp(e)
  }

  private updateStickFromGx(gx: number): void {
    const d = gx - this.stickCx
    this.stickLeft = d < -this.stickDead
    this.stickRight = d > this.stickDead
  }

  private clearStick(): void {
    this.stickPointerId = null
    this.stickLeft = false
    this.stickRight = false
  }
}
