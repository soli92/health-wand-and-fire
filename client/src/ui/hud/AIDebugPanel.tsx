/**
 * AIDebugPanel — developer overlay showing the last AI WaveConfig.
 * Rendered ONLY when import.meta.env.DEV === true.
 */

import type { WaveConfig } from '../../../../shared/types'

interface AIDebugPanelProps {
  config: WaveConfig | null
  loading: boolean
  error: string | null
}

export default function AIDebugPanel({ config, loading, error }: AIDebugPanelProps) {
  if (!import.meta.env.DEV) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 w-72 bg-card/95 border border-primary/40 rounded-xl shadow-xl backdrop-blur-sm overflow-hidden text-xs font-mono">
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
        {error && (
          <div className="text-destructive bg-destructive/10 rounded px-2 py-1">
            ⚠ {error}
          </div>
        )}

        {config ? (
          <>
            {/* AI comment */}
            <p className="text-primary/80 italic leading-snug">
              "{config.comment}"
            </p>

            {/* Config values */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-muted-foreground">
              <span>enemyCount</span>
              <span className="text-foreground">{config.enemyCount}</span>

              <span>speed</span>
              <span className="text-foreground">{config.speed.toFixed(2)}×</span>

              <span>shootFreq</span>
              <span className="text-foreground">{config.shootFrequency.toFixed(2)}/s</span>

              <span>pattern</span>
              <span className="text-foreground">{config.pattern}</span>

              <span>powerUp</span>
              <span className={config.powerUpSpawn ? 'text-green-400' : 'text-muted-foreground'}>
                {config.powerUpSpawn ? '✓ yes' : '✗ no'}
              </span>
            </div>
          </>
        ) : (
          <p className="text-muted-foreground">No wave config yet.</p>
        )}
      </div>
    </div>
  )
}
