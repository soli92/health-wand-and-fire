/**
 * AIDebugPanel — developer overlay showing the last AI WaveConfig + comment.
 * Rendered ONLY when import.meta.env.DEV === true.
 *
 * Import depth: client/src/ui/hud/ → ../../../../shared/types
 */

import type { WaveConfig } from '../../../../shared/types'
import { getNextWaveApiUrl } from '../../hooks/useAIWave'

interface AIDebugPanelProps {
  config: WaveConfig | null
  loading: boolean
  error: string | null
}

export default function AIDebugPanel({ config, loading, error }: AIDebugPanelProps) {
  if (!import.meta.env.DEV) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[min(18rem,calc(100vw-1rem))] max-h-[50dvh] overflow-y-auto bg-card/95 border border-primary/40 rounded-xl shadow-xl backdrop-blur-sm text-xs font-mono mb-[max(0.5rem,env(safe-area-inset-bottom))] mr-[max(0.5rem,env(safe-area-inset-right))]">

      {/* Header */}
      <div className="flex items-center gap-2 bg-primary/10 border-b border-primary/30 px-3 py-2">
        <span className="text-primary">✨</span>
        <span className="text-primary font-semibold">AI Director Debug</span>
        {loading && (
          <span className="ml-auto text-muted-foreground animate-pulse">asking Claude…</span>
        )}
      </div>

      {/* Body */}
      <div className="p-3 space-y-2">
        <p className="text-muted-foreground text-[10px] break-all border-b border-border/50 pb-2">
          POST {getNextWaveApiUrl()}
        </p>
        {error && (
          <div className="text-destructive bg-destructive/10 rounded px-2 py-1 text-[11px]">
            ⚠ {error}
          </div>
        )}

        {config ? (
          <>
            {/* AI flavour comment */}
            <p className="text-primary/80 italic leading-snug">
              "{config.comment}"
            </p>

            {/* Wave config values */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-muted-foreground">
              <span>enemyCount</span>
              <span className="text-foreground font-semibold">{config.enemyCount}</span>

              <span>speed</span>
              <span className="text-foreground font-semibold">{config.speed.toFixed(2)}×</span>

              <span>shootFreq</span>
              <span className="text-foreground font-semibold">{config.shootFrequency.toFixed(2)}/s</span>

              <span>pattern</span>
              <span className="text-foreground font-semibold">{config.pattern}</span>

              <span>powerUp</span>
              <span className={config.powerUpSpawn ? 'text-green-400 font-semibold' : 'text-muted-foreground'}>
                {config.powerUpSpawn ? '✓ yes' : '✗ no'}
              </span>
            </div>
          </>
        ) : (
          <p className="text-muted-foreground">No wave config yet — survive wave 1 first.</p>
        )}
      </div>
    </div>
  )
}
