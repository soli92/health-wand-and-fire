import { describe, expect, it } from 'vitest'
import {
  DEFAULT_TOUCH_CONTROL_SETTINGS,
  clampTouchSettings,
  touchSettingsToInputOpts,
} from '../touchControlSettings'
import { inJoystickDisc } from '../systems/TouchInputSystem'

describe('touchSettingsToInputOpts', () => {
  it('maps normalized stick to logical canvas coords', () => {
    const s = clampTouchSettings({
      ...DEFAULT_TOUCH_CONTROL_SETTINGS,
      stickXNorm: 0.5,
      stickYNorm: 0.8,
    })
    const o = touchSettingsToInputOpts(s)
    expect(o.stickCx).toBeCloseTo(240, 5)
    expect(o.stickCy).toBeCloseTo(512, 5)
  })
})

describe('clampTouchSettings', () => {
  it('keeps stick inside canvas for large radius', () => {
    const c = clampTouchSettings({
      ...DEFAULT_TOUCH_CONTROL_SETTINGS,
      stickXNorm: 0,
      stickYNorm: 0.5,
      stickRadius: 90,
    })
    expect(c.stickXNorm).toBeGreaterThan(0)
    expect(c.stickRadius).toBe(90)
  })
})

describe('fire strip vs joystick', () => {
  it('default layout leaves fire strip beside stick', () => {
    const o = touchSettingsToInputOpts(DEFAULT_TOUCH_CONTROL_SETTINGS)
    const gx = o.stickCx + o.stickRadius + 20
    const gy = o.canvasH - 10
    expect(inJoystickDisc(gx, gy, o.stickCx, o.stickCy, o.stickRadius)).toBe(false)
    expect(gy >= o.canvasH - o.fireZoneH).toBe(true)
  })
})
