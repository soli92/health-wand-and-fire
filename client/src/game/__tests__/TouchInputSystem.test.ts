import { describe, expect, it } from 'vitest'
import {
  clientToGameCoords,
  inFireStrip,
  inJoystickDisc,
} from '../systems/TouchInputSystem'
import { mergeInputState } from '../systems/InputSystem'
import {
  CANVAS_LOGICAL_HEIGHT,
  CANVAS_LOGICAL_WIDTH,
} from '../canvasDimensions'

describe('clientToGameCoords', () => {
  it('maps full CSS rect to canvas logical size', () => {
    const rect = { left: 100, top: 50, width: 240, height: 320 }
    const { gx, gy } = clientToGameCoords(rect, CANVAS_LOGICAL_WIDTH, CANVAS_LOGICAL_HEIGHT, 100, 50)
    expect(gx).toBe(0)
    expect(gy).toBe(0)
  })

  it('maps bottom-right of scaled canvas', () => {
    const rect = { left: 0, top: 0, width: CANVAS_LOGICAL_WIDTH, height: CANVAS_LOGICAL_HEIGHT }
    const { gx, gy } = clientToGameCoords(
      rect,
      CANVAS_LOGICAL_WIDTH,
      CANVAS_LOGICAL_HEIGHT,
      CANVAS_LOGICAL_WIDTH,
      CANVAS_LOGICAL_HEIGHT,
    )
    expect(gx).toBe(CANVAS_LOGICAL_WIDTH)
    expect(gy).toBe(CANVAS_LOGICAL_HEIGHT)
  })
})

describe('inJoystickDisc', () => {
  it('returns true inside radius', () => {
    expect(inJoystickDisc(76, 564, 76, 564, 58)).toBe(true)
  })

  it('returns false outside radius', () => {
    expect(inJoystickDisc(200, 200, 76, 564, 58)).toBe(false)
  })
})

describe('inFireStrip', () => {
  it('returns true in bottom strip away from stick', () => {
    expect(inFireStrip(400, 600, CANVAS_LOGICAL_HEIGHT, 96, 76, 564, 58)).toBe(true)
  })

  it('returns false above fire zone', () => {
    expect(inFireStrip(400, 500, CANVAS_LOGICAL_HEIGHT, 96, 76, 564, 58)).toBe(false)
  })

  it('returns false over joystick disc in corner', () => {
    expect(inFireStrip(76, 600, CANVAS_LOGICAL_HEIGHT, 96, 76, 564, 58)).toBe(false)
  })
})

describe('mergeInputState', () => {
  it('ORs left, right, and fire', () => {
    expect(
      mergeInputState(
        { left: true, right: false, fire: false },
        { left: false, right: true, fire: true },
      ),
    ).toEqual({ left: true, right: true, fire: true })
  })

  it('prefers neither when both false', () => {
    expect(
      mergeInputState(
        { left: false, right: false, fire: false },
        { left: false, right: false, fire: false },
      ),
    ).toEqual({ left: false, right: false, fire: false })
  })
})
