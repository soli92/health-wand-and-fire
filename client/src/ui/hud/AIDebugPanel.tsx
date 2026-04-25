/**
 * AIDebugPanel — development-only overlay showing AI wave debug info.
 * Rendered only when import.meta.env.DEV === true.
 */

import type { WaveConfig } from '@/game/entities/Enemy'

interface AIDebugPanelProps {
  lastWaveConfig: WaveConfig | null
  isLoading: boolean
  lastComment: string | null
}

export default function AIDebugPanel({ lastWaveConfig, isLoading, lastComment }: AIDebugPanelProps) {
  // Strip in production builds — tree-shaken by Vite
  if (!import.meta.env.DEV) return null

  return (
    <div
      className={[
        'fixed bottom-4 right-4 z-50',
        'max-w-xs w-full rounded-lg p-3',
        'bg-accent/80 backdrop-blur-sm',
        'border border-primary',
        'text-muted-foreground text-xs',
        'shadow-lg shadow-primary/20',
      ].join(' ')}
      role="complementary"
      aria-label="AI Debug Panel"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-primary tracking-wide uppercase text-[10px]">
          🔮 AI Debug
        </span>
        {isLoading && (
          <span className="text-[10px] animate-pulse text-primary">fetching…</span>
        )}
      </div>

      {lastComment && (
        <p className="italic mb-2 text-foreground/70 border-b border-primary/30 pb-2 leading-snug">
          &ldquo;{lastComment}&rdquo;
        </p>
      )}

      {lastWaveConfig ? (
        <pre className="whitespace-pre-wrap break-all leading-relaxed">
          {JSON.stringify(lastWaveConfig, null, 2)}
        </pre>
      ) : (
        <p className="opacity-50">No wave config yet</p>
      )}
    </div>
  )
}
