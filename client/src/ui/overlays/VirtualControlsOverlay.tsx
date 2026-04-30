/**
 * Visual hints for virtual controls. pointer-events: none.
 * Positions use % of the playfield (same aspect as logical 480×640) so scaling stays aligned.
 */

import {
  CANVAS_LOGICAL_HEIGHT,
  CANVAS_LOGICAL_WIDTH,
} from '../../game/canvasDimensions'
import type { TouchControlSettings } from '../../game/touchControlSettings'
import { touchSettingsToInputOpts } from '../../game/touchControlSettings'

interface VirtualControlsOverlayProps {
  settings: TouchControlSettings
}

const W = CANVAS_LOGICAL_WIDTH
const H = CANVAS_LOGICAL_HEIGHT

export default function VirtualControlsOverlay({ settings }: VirtualControlsOverlayProps) {
  const { fireZoneH, stickCx, stickCy, stickRadius } = touchSettingsToInputOpts(settings)
  const stripTop = H - fireZoneH
  const hintOpacity = 0.2 + settings.overlayOpacity * 0.75

  const ringL = ((stickCx - stickRadius) / W) * 100
  const ringT = ((stickCy - stickRadius) / H) * 100
  const ringW = ((2 * stickRadius) / W) * 100
  const ringH = ((2 * stickRadius) / H) * 100

  const stripTopPct = (stripTop / H) * 100
  const stripHPct = (fireZoneH / H) * 100

  const fireLeftW = Math.max(0, (stickCx - stickRadius) / W) * 100
  const fireRightL = ((stickCx + stickRadius) / W) * 100
  const fireRightW = Math.max(0, (W - stickCx - stickRadius) / W) * 100

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[5] select-none"
      aria-hidden="true"
    >
      <div className="absolute inset-0" style={{ opacity: hintOpacity }}>
        <div
          className="absolute rounded-full border-2 border-primary/60 bg-primary/15 shadow-[inset_0_0_12px_rgba(0,0,0,0.25)]"
          style={{
            left: `${ringL}%`,
            top: `${ringT}%`,
            width: `${ringW}%`,
            height: `${ringH}%`,
          }}
        />
        <span
          className="absolute text-[10px] font-semibold uppercase tracking-wide text-primary drop-shadow-sm"
          style={{
            left: `${ringL}%`,
            top: `${Math.max(0, (stickCy - stickRadius - 18) / H) * 100}%`,
            width: `${ringW}%`,
            textAlign: 'center',
          }}
        >
          Move
        </span>

        <div
          className="absolute left-0 border-t border-primary/40 bg-primary/12"
          style={{
            top: `${stripTopPct}%`,
            height: `${stripHPct}%`,
            width: `${fireLeftW}%`,
          }}
        />
        <div
          className="absolute border-t border-primary/40 bg-primary/12"
          style={{
            left: `${fireRightL}%`,
            top: `${stripTopPct}%`,
            height: `${stripHPct}%`,
            width: `${fireRightW}%`,
          }}
        />

        <span
          className="absolute text-[10px] font-semibold uppercase tracking-wide text-primary drop-shadow-sm"
          style={{
            right: '2.5%',
            bottom: `${(10 / H) * 100}%`,
          }}
        >
          Cast
        </span>

        <p
          className="absolute left-0 right-0 text-center text-[9px] leading-tight text-muted-foreground px-[2%]"
          style={{ top: `${((stripTop - 22) / H) * 100}%` }}
        >
          Drag the ring to move · Tap the shaded areas to cast spells
        </p>
      </div>
    </div>
  )
}
