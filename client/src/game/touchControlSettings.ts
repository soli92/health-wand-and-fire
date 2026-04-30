/**
 * Persisted touch / virtual control layout (canvas logical 480×640 space).
 * Stored in localStorage as JSON.
 */

import {
  CANVAS_LOGICAL_HEIGHT,
  CANVAS_LOGICAL_WIDTH,
} from './canvasDimensions'
import { TOUCH_DEFAULTS } from './systems/TouchInputSystem'

export const TOUCH_CONTROL_STORAGE_KEY = 'hwf-touch-controls-v1'

/** Normalized 0–1 positions; sizes in logical pixels. */
export interface TouchControlSettings {
  /** Joystick centre X as fraction of canvas width (0–1). */
  stickXNorm: number
  /** Joystick centre Y as fraction of canvas height (0–1). */
  stickYNorm: number
  /** Height of the bottom fire strip (logical px). */
  fireZoneH: number
  stickRadius: number
  stickDead: number
  /** Visual overlay only: ring + strip alpha multiplier (0–1). */
  overlayOpacity: number
  /** Pause button inset from canvas right edge (logical px, clamped in UI). */
  pauseInsetRight: number
  /** Pause button inset from canvas top (below HUD; logical px). */
  pauseInsetTop: number
}

export const DEFAULT_TOUCH_CONTROL_SETTINGS: TouchControlSettings = {
  stickXNorm: TOUCH_DEFAULTS.stickCx / CANVAS_LOGICAL_WIDTH,
  stickYNorm: TOUCH_DEFAULTS.stickCy / CANVAS_LOGICAL_HEIGHT,
  fireZoneH: TOUCH_DEFAULTS.fireZoneH,
  stickRadius: TOUCH_DEFAULTS.stickRadius,
  stickDead: TOUCH_DEFAULTS.stickDead,
  overlayOpacity: 0.55,
  pauseInsetRight: 8,
  pauseInsetTop: 40,
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n))
}

export function clampTouchSettings(s: TouchControlSettings): TouchControlSettings {
  const r = clamp(s.stickRadius, 36, 90)
  return {
    stickXNorm: clamp(s.stickXNorm, r / CANVAS_LOGICAL_WIDTH, 1 - r / CANVAS_LOGICAL_WIDTH),
    stickYNorm: clamp(s.stickYNorm, r / CANVAS_LOGICAL_HEIGHT, 1 - r / CANVAS_LOGICAL_HEIGHT),
    fireZoneH: clamp(s.fireZoneH, 56, 140),
    stickRadius: r,
    stickDead: clamp(s.stickDead, 8, 36),
    overlayOpacity: clamp(s.overlayOpacity, 0.15, 1),
    pauseInsetRight: clamp(s.pauseInsetRight, 4, 120),
    pauseInsetTop: clamp(s.pauseInsetTop, 28, 120),
  }
}

/** Arguments for TouchInputSystem (logical canvas coords). */
export function touchSettingsToInputOpts(s: TouchControlSettings) {
  const c = clampTouchSettings(s)
  return {
    canvasW: CANVAS_LOGICAL_WIDTH,
    canvasH: CANVAS_LOGICAL_HEIGHT,
    fireZoneH: c.fireZoneH,
    stickCx: c.stickXNorm * CANVAS_LOGICAL_WIDTH,
    stickCy: c.stickYNorm * CANVAS_LOGICAL_HEIGHT,
    stickRadius: c.stickRadius,
    stickDead: c.stickDead,
  }
}

export function loadTouchControlSettings(): TouchControlSettings {
  if (typeof localStorage === 'undefined') return { ...DEFAULT_TOUCH_CONTROL_SETTINGS }
  try {
    const raw = localStorage.getItem(TOUCH_CONTROL_STORAGE_KEY)
    if (!raw) return { ...DEFAULT_TOUCH_CONTROL_SETTINGS }
    const p = JSON.parse(raw) as Partial<TouchControlSettings>
    return clampTouchSettings({
      ...DEFAULT_TOUCH_CONTROL_SETTINGS,
      ...p,
    })
  } catch {
    return { ...DEFAULT_TOUCH_CONTROL_SETTINGS }
  }
}

export function saveTouchControlSettings(s: TouchControlSettings): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(TOUCH_CONTROL_STORAGE_KEY, JSON.stringify(clampTouchSettings(s)))
  } catch {
    /* ignore quota */
  }
}
