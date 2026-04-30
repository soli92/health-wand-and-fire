/**
 * useAIWave — React hook to fetch the next wave config from the AI backend.
 * POST /api/next-wave → WaveConfig
 */

import { useState, useCallback } from 'react'
import { NextWaveResponseSchema } from '../../../shared/types'
import type { PlayerStats, WaveConfig } from '../../../shared/types'
import { resolveNextWaveApiUrl } from './nextWaveApiUrl'

// Path: client/src/hooks/ → ../../../shared/types

/** POST target for next-wave; uses VITE_API_BASE_URL in production when API is not same-origin. */
export function getNextWaveApiUrl(): string {
  return resolveNextWaveApiUrl(import.meta.env.VITE_API_BASE_URL)
}

export interface UseAIWaveResult {
  loading: boolean
  error: string | null
  lastConfig: WaveConfig | null
  fetchNextWave: (stats: PlayerStats) => Promise<WaveConfig | null>
}

/** Fallback config used when the API call fails — keeps game playable */
const FALLBACK_CONFIG: WaveConfig = {
  enemyCount: 8,
  speed: 1.5,
  shootFrequency: 1.0,
  pattern: 'random',
  powerUpSpawn: false,
  comment: 'The arcane connection falters… but the darkness presses on.',
}

export function useAIWave(): UseAIWaveResult {
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [lastConfig, setLastConfig] = useState<WaveConfig | null>(null)

  const fetchNextWave = useCallback(async (stats: PlayerStats): Promise<WaveConfig | null> => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(getNextWaveApiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stats }),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Server error ${res.status}: ${text}`)
      }

      const json = await res.json()
      const parsed = NextWaveResponseSchema.safeParse(json)

      if (!parsed.success) {
        console.warn('[useAIWave] Invalid response schema — using fallback', parsed.error)
        setLastConfig(FALLBACK_CONFIG)
        return FALLBACK_CONFIG
      }

      setLastConfig(parsed.data.wave)
      return parsed.data.wave

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      console.error('[useAIWave] Fetch failed:', msg)
      setError(msg)
      setLastConfig(FALLBACK_CONFIG)
      return FALLBACK_CONFIG

    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, error, lastConfig, fetchNextWave }
}
