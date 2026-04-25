/**
 * AIDebugPanel — visible only in DEV mode (import.meta.env.DEV).
 * Shows the last WaveConfig JSON returned by Claude + loading state + error.
 */

import type { WaveConfig } from '../../../../shared/types'

interface AIDebugPanelProps {
  waveConfig: WaveConfig | null
  isLoading: boolean
  error: string | null
}

export default function AIDebugPanel({ waveConfig, isLoading, error }: AIDebugPanelProps) {
  if (!import.meta.env.DEV) return null

  return (
    <div className="pointer-events-none absolute bottom-2 right-2 z-20 w-64 rounded-lg border border-primary/30 bg-background/90 p-3 font-mono text-xs backdrop-blur-sm">
      <p className="mb-1 font-bold text-primary">🤖 AI Director</p>

      {isLoading && (
        <p className="animate-pulse text-muted-foreground">Consulting the oracle…</p>
      )}

      {error && (
        <p className="text-destructive">⚠ {error}</p>
      )}

      {waveConfig && !isLoading && (
        <pre className="overflow-auto text-muted-foreground whitespace-pre-wrap break-all">
          {JSON.stringify(waveConfig, null, 2)}
        </pre>
      )}

      {!waveConfig && !isLoading && !error && (
        <p className="text-muted-foreground italic">Awaiting first wave…</p>
      )}
    </div>
  )
}
