/**
 * WaveSystem — spawns and manages enemy waves from AI-generated configs.
 */

import { DarkCreature, type Enemy, type WaveConfig } from '../entities/Enemy'

export type { WaveConfig }

const DEFAULT_CONFIG: WaveConfig = {
  enemyCount: 8,
  enemySpeed: 80,
  enemyHp: 1,
  pattern: 'linear',
  shootFrequency: 0,
  scorePerKill: 100,
  comment: 'The shadows stir...',
}

export class WaveSystem {
  private config: WaveConfig = { ...DEFAULT_CONFIG }
  private canvasWidth: number
  private canvasHeight: number

  constructor(canvasWidth: number = 480, canvasHeight: number = 640) {
    this.canvasWidth = canvasWidth
    this.canvasHeight = canvasHeight
  }

  /** Update the active wave configuration */
  applyConfig(config: Partial<WaveConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /** Get current config (read-only copy) */
  getConfig(): WaveConfig {
    return { ...this.config }
  }

  /**
   * Spawn a new wave of enemies arranged in a grid.
   * Optionally merge in a fresh config before spawning.
   */
  spawnWave(config?: Partial<WaveConfig>): Enemy[] {
    if (config) this.applyConfig(config)

    const { enemyCount, enemySpeed, enemyHp, pattern, shootFrequency } = this.config
    const enemies: Enemy[] = []

    const cols = Math.min(enemyCount, 8)
    const rows = Math.ceil(enemyCount / cols)
    const hGap = this.canvasWidth / (cols + 1)
    const vGap = 52

    let spawned = 0
    outer: for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (spawned >= enemyCount) break outer

        enemies.push(new DarkCreature({
          x: hGap * (col + 1) - DarkCreature.prototype.width / 2,
          y: 40 + row * vGap,
          speed: enemySpeed,
          hp: enemyHp,
          pattern,
          shootFrequency,
          canvasWidth: this.canvasWidth,
        }))
        spawned++
      }
    }

    return enemies
  }

  /** Returns true when all enemies in the provided array are dead */
  isWaveComplete(enemies: Enemy[]): boolean {
    return enemies.length === 0
  }
}
