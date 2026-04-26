import { describe, expect, it } from 'vitest'
import {
  NextWaveRequestSchema,
  NextWaveResponseSchema,
  WaveConfigSchema,
} from '../../../../shared/types'

describe('shared Zod schemas', () => {
  it('parses a valid next-wave request', () => {
    const parsed = NextWaveRequestSchema.parse({
      stats: {
        wave: 2,
        accuracy: 0.75,
        livesLost: 1,
        timeMs: 5000,
        scoreGained: 200,
      },
    })
    expect(parsed.stats.wave).toBe(2)
  })

  it('parses a valid wave config response', () => {
    const wave = WaveConfigSchema.parse({
      enemyCount: 10,
      speed: 1.2,
      shootFrequency: 0.5,
      pattern: 'swarm',
      powerUpSpawn: false,
      comment: 'The shadows gather.',
    })
    const res = NextWaveResponseSchema.parse({ wave })
    expect(res.wave.enemyCount).toBe(10)
  })
})
