/**
 * On-canvas hints for virtual controls (pointer: coarse). pointer-events: none so touches reach the canvas.
 * Geometry matches TouchInputSystem TOUCH_DEFAULTS.
 */

import { TOUCH_DEFAULTS } from '../../game/systems/TouchInputSystem'

const { canvasH, fireZoneH, stickCx, stickCy, stickRadius } = TOUCH_DEFAULTS

export default function VirtualControlsOverlay() {
  const stripTop = canvasH - fireZoneH
  /** Circle center relative to the bottom strip box (top = stripTop). */
  const holeCx = stickCx
  const holeCy = stickCy - stripTop

  const fireMask = `radial-gradient(circle ${stickRadius}px at ${holeCx}px ${holeCy}px, transparent 99.5%, black 100%)`

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[5] select-none"
      aria-hidden="true"
    >
      {/* Joystick zone */}
      <div
        className="absolute rounded-full border-2 border-primary/55 bg-primary/10 shadow-[inset_0_0_12px_rgba(0,0,0,0.25)]"
        style={{
          left: stickCx - stickRadius,
          top: stickCy - stickRadius,
          width: stickRadius * 2,
          height: stickRadius * 2,
        }}
      />
      <span
        className="absolute text-[10px] font-semibold uppercase tracking-wide text-primary/90 drop-shadow-sm"
        style={{
          left: stickCx - stickRadius,
          top: stickCy - stickRadius - 18,
          width: stickRadius * 2,
          textAlign: 'center',
        }}
      >
        Move
      </span>

      {/* Fire strip (bottom bar with hole over joystick) */}
      <div
        className="absolute left-0 right-0 border-t border-primary/40 bg-primary/12"
        style={{
          top: stripTop,
          height: fireZoneH,
          WebkitMaskImage: fireMask,
          maskImage: fireMask,
        }}
      />
      <span
        className="absolute text-[10px] font-semibold uppercase tracking-wide text-primary/90 drop-shadow-sm"
        style={{
          right: 12,
          bottom: 10,
        }}
      >
        Cast
      </span>

      {/* Help line — inside canvas footprint */}
      <p
        className="absolute left-0 right-0 text-center text-[9px] leading-tight text-muted-foreground/90 px-3"
        style={{ top: stripTop - 22 }}
      >
        Drag the ring to move · Tap the shaded bar to cast spells
      </p>
    </div>
  )
}
