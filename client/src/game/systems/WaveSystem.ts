/**
 * WaveSystem — converts a WaveConfig (from AI) into a set of DarkCreature instances
 * and manages the wave lifecycle (active → complete).
 */

import { DarkCreature, type DarkCreatureOptions } from '../entities/Enemy'
import type { WaveConfig } from '../../../../shared/types'

// Map the shared WaveConfig pattern enum to the DarkCreature's internal patterns.
// Shared: 'swarm' | 'pincer' | 'wall' | 'random' | 'flanking'
// Entity: 'linear' | 'zigzag' | 'dive' | 'hover'
function mapPattern(
  shared: WaveConfig['pattern'],
  index: number,
  total: number,
): DarkCreatureOptions['pattern'] {
  switch (shared) {
    case 'swarm':
      return 'zigzag'
    case 'pincer':
      return index < total / 2 ? 'linear' : 'zigzag'
    case 'wall':
      return 'linear'
    case 'flanking':
      return index % 2 === 0 ? 'dive' : 'hover'
    case 'random':
    default: {
      const patterns: DarkCreatureOptions['pattern'][] = ['linear', 'zigzag', 'dive', 'hover']
      return patterns[index % patterns.length]
    }
  }
}

export class WaveSystem {
  private canvasWidth: number
  private canvasHeight: number

  constructor(canvasWidth = 480, canvasHeight = 640) {
    this.canvasWidth = canvasWidth
    this.canvasHeight = canvasHeight
  }

  /**
   * Spawns a full wave of DarkCreatures based on the WaveConfig from AI.
   * `speed` in WaveConfig is a multiplier (0.5–3.0) → px/sec = speed * 60
   */
  spawnWave(config: WaveConfig): DarkCreature[] {
    const count = config.enemyCount
    const cols  = Math.min(count, 8)

    const cellW  = 48
    const cellH  = 52
    const startX = Math.max(0, (this.canvasWidth - cols * cellW) / 2)
    const startY = 40

    const creatures: DarkCreature[] = []

    for (let i = 0; i < count; i++) {
      const col = i % cols
      const row = Math.floor(i / cols)

      creatures.push(
        new DarkCreature({
          x: startX + col * cellW,
          y: startY + row * cellH,
          pattern: mapPattern(config.pattern, i, count),
          speed: config.speed * 60,          // multiplier → px/sec
          hp: row === 0 ? 2 : 1,
          shootFrequency: config.shootFrequency,
          canvasWidth: this.canvasWidth,
        }),
      )
    }

    return creatures
  }

  /**
   * Returns true when all creatures in the wave are dead or removed.
   */
  isWaveComplete(creatures: DarkCreature[]): boolean {
    return creatures.length === 0 || creatures.every(c => c.isDead)
  }

  resize(w: number, h: number): void {
    this.canvasWidth  = w
    this.canvasHeight = h
  }
}
