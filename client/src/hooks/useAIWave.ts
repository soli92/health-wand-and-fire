/**
 * useAIWave — React hook that calls POST /api/next-wave
 * and returns the AI-generated WaveConfig for the next wave.
 */

import { useState, useCallback } from 'react'
import { z } from 'zod'
import type { PlayerStats } from '@/game/StatsTracker'
import type { WaveConfig } from '@/game/entities/Enemy'

// Runtime validation schema for the API response
const WaveConfigSchema = z.object({
  enemyCount: z.number().int().min(1).max(30),
  enemySpeed: z.number().min(20).max(500),
  enemyHp: z.number().int().min(1).max(20),
  pattern: z.enum(['linear', 'zigzag', 'dive', 'hover']),
  shootFrequency: z.number().min(0).max(5),
  scorePerKill: z.number().min(10),
  comment: z.string().optional(),
})

interface UseAIWaveReturn {
  fetchNextWave: (stats: PlayerStats) => Promise<WaveConfig>
  isLoading: boolean
  error: string | null
  lastComment: string | null
}

// Sensible fallback in case the API is unavailable
function buildFallbackConfig(stats: PlayerStats): WaveConfig {
  const difficulty = Math.min(stats.wave * 0.15, 1.5)
  return {
    enemyCount: Math.min(6 + stats.wave, 20),
    enemySpeed: Math.round(70 + difficulty * 80),
    enemyHp: Math.ceil(1 + difficulty),
    pattern: (['linear', 'zigzag', 'dive', 'hover'] as const)[stats.wave % 4],
    shootFrequency: Math.min(stats.wave * 0.1, 1.5),
    scorePerKill: Math.round(100 + stats.wave * 20),
    comment: 'The oracle is silent... the darkness decides.',
  }
}

export function useAIWave(): UseAIWaveReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastComment, setLastComment] = useState<string | null>(null)

  const fetchNextWave = useCallback(async (stats: PlayerStats): Promise<WaveConfig> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/next-wave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stats),
        signal: AbortSignal.timeout(8000), // 8 second timeout
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      const raw: unknown = await response.json()
      const parsed = WaveConfigSchema.safeParse(raw)

      if (!parsed.success) {
        console.warn('[useAIWave] Invalid API response, using fallback:', parsed.error.format())
        throw new Error('Invalid wave config received from server')
      }

      const config = parsed.data as WaveConfig
      if (config.comment) setLastComment(config.comment)
      return config

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      console.error('[useAIWave] Falling back to local config:', message)
      const fallback = buildFallbackConfig(stats)
      if (fallback.comment) setLastComment(fallback.comment)
      return fallback

    } finally {
      setIsLoading(false)
    }
  }, [])

  return { fetchNextWave, isLoading, error, lastComment }
}
