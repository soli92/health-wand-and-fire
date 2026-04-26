import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { StatsTracker } from '../StatsTracker'

describe('StatsTracker', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: 10_000 })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('snapshot exposes accuracy as hit ratio when shots were fired', () => {
    const t = new StatsTracker()
    t.recordShot()
    t.recordShot()
    t.recordHit()
    t.addScore(50)
    t.recordLifeLost()

    const s = t.snapshot(3)
    expect(s.wave).toBe(3)
    expect(s.shotsFired).toBe(2)
    expect(s.hits).toBe(1)
    expect(s.accuracy).toBe(0.5)
    expect(s.scoreGained).toBe(50)
    expect(s.livesLost).toBe(1)
    expect(s.waveDurationMs).toBe(0)
  })

  it('accuracy is 0 when no shots fired', () => {
    const t = new StatsTracker()
    expect(t.snapshot(1).accuracy).toBe(0)
  })

  it('reset clears counters and restarts duration', () => {
    const t = new StatsTracker()
    t.recordShot()
    t.recordHit()
    vi.setSystemTime(11_000)
    t.reset()
    const s = t.snapshot(2)
    expect(s.shotsFired).toBe(0)
    expect(s.hits).toBe(0)
    expect(s.waveDurationMs).toBe(0)
  })
})
