/**
 * WaveSystem — converts a WaveConfig (from AI) into a set of DarkCreature instances
 * and manages the wave lifecycle (active → complete).
 */

import { DarkCreature, type DarkCreatureOptions } from '../entities/Enemy'
import type { WaveConfig } from '../../../../shared/types'

// Map the shared WaveConfig pattern enum to the DarkCreature's internal patterns.
// The shared schema uses: 'swarm' | 'pincer' | 'wall' | 'random' | 'flanking'
// The entity uses:        'linear' | 'zigzag' | 'dive' | 'hover'
function mapPattern(
  shared: WaveConfig['pattern'],
  index: number,
  total: number,
): DarkCreatureOptions['pattern'] {
  switch (shared) {
    case 'swarm':
      return 'zigzag'
    case 'pincer':
      // Alternate: left half → left approaching, right half → right approaching (zigzag)
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
   */
  spawnWave(config: WaveConfig): DarkCreature[] {
    const count = config.enemyCount
    const cols = Math.min(count, 8)
    const rows = Math.ceil(count / cols)

    const startX = (this.canvasWidth - cols * 48) / 2
    const startY = 40

    const creatures: DarkCreature[] = []

    for (let i = 0; i < count; i++) {
      const col = i % cols
      const row = Math.floor(i / cols)

      const x = startX + col * 48
      const y = startY + row * 52

      const pattern = mapPattern(config.pattern, i, count)

      creatures.push(
        new DarkCreature({
          x,
          y,
          pattern,
          speed: config.speed * 60,         // speed in shared schema is a multiplier 0.5–3
          hp: row === 0 ? 2 : 1,             // front row slightly harder
          shootFrequency: config.shootFrequency,
          canvasWidth: this.canvasWidth,
        }),
      )
    }

    return creatures
  }

  /**
   * Returns true when all creatures in the current wave have been defeated.
   */
  isWaveComplete(creatures: DarkCreature[]): boolean {
    return creatures.length === 0 || creatures.every(c => c.isDead)
  }

  /** Called when the canvas is resized */
  resize(w: number, h: number): void {
    this.canvasWidth = w
    this.canvasHeight = h
  }
}
