import { z } from 'zod'

// ─── Player Stats ────────────────────────────────────────────────────────────
export const PlayerStatsSchema = z.object({
  wave:        z.number().int().min(1),
  accuracy:    z.number().min(0).max(1),
  livesLost:   z.number().int().min(0),
  timeMs:      z.number().positive(),
  scoreGained: z.number().int(),
})

// ─── Wave Config ─────────────────────────────────────────────────────────────
export const WaveConfigSchema = z.object({
  enemyCount:     z.number().int().min(3).max(30),
  speed:          z.number().min(0.5).max(3.0),
  shootFrequency: z.number().min(0.1).max(2.0),
  pattern:        z.enum(['swarm', 'pincer', 'wall', 'random', 'flanking']),
  powerUpSpawn:   z.boolean(),
  comment:        z.string().max(120),
})

export type PlayerStats = z.infer<typeof PlayerStatsSchema>
export type WaveConfig  = z.infer<typeof WaveConfigSchema>

// ─── API Request / Response ───────────────────────────────────────────────────
export const NextWaveRequestSchema = z.object({
  stats: PlayerStatsSchema,
})

export const NextWaveResponseSchema = z.object({
  wave: WaveConfigSchema,
})

export type NextWaveRequest  = z.infer<typeof NextWaveRequestSchema>
export type NextWaveResponse = z.infer<typeof NextWaveResponseSchema>

// ─── Game Entities ────────────────────────────────────────────────────────────
export interface Position {
  x: number
  y: number
}

export interface Velocity {
  vx: number
  vy: number
}

export type EnemyPattern = WaveConfig['pattern']

// ─── Game State (plain mutable object, NOT React state) ───────────────────────
export interface GameState {
  running:    boolean
  paused:     boolean
  wave:       number
  score:      number
  lives:      number
  waveConfig: WaveConfig | null
}
