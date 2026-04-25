/**
 * useAIWave — React hook that POSTs end-of-wave stats to the backend
 * and returns the AI-generated WaveConfig for the next wave.
 */

import { useState, useCallback } from 'react'
import type { PlayerStats, WaveConfig } from '../../../shared/types'

interface UseAIWaveState {
  waveConfig: WaveConfig | null
  isLoading: boolean
  error: string | null
  lastComment: string | null
}

interface UseAIWaveReturn extends UseAIWaveState {
  fetchNextWave: (stats: PlayerStats) => Promise<WaveConfig | null>
  reset: () => void
}

const FALLBACK_WAVE: WaveConfig = {
  enemyCount: 8,
  speed: 1.5,
  shootFrequency: 1.0,
  pattern: 'random',
  powerUpSpawn: false,
  comment: 'The mist thickens… the wizard stands firm.',
}

export function useAIWave(): UseAIWaveReturn {
  const [state, setState] = useState<UseAIWaveState>({
    waveConfig: null,
    isLoading: false,
    error: null,
    lastComment: null,
  })

  const fetchNextWave = useCallback(async (stats: PlayerStats): Promise<WaveConfig | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const res = await fetch('/api/next-wave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stats }),
      })

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error(errBody?.error ?? `HTTP ${res.status}`)
      }

      const data = await res.json() as { wave: WaveConfig }
      const config = data.wave

      setState({
        waveConfig: config,
        isLoading: false,
        error: null,
        lastComment: config.comment,
      })

      return config
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.warn('[useAIWave] Error fetching wave config — using fallback:', message)

      setState({
        waveConfig: FALLBACK_WAVE,
        isLoading: false,
        error: message,
        lastComment: FALLBACK_WAVE.comment,
      })

      return FALLBACK_WAVE
    }
  }, [])

  const reset = useCallback(() => {
    setState({ waveConfig: null, isLoading: false, error: null, lastComment: null })
  }, [])

  return { ...state, fetchNextWave, reset }
}
