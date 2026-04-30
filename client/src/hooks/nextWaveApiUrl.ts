/**
 * Build POST URL for next-wave. Pass import.meta.env.VITE_API_BASE_URL from the hook.
 * Empty / unset → same-origin `/api/next-wave` (Vite dev proxy).
 */
export function resolveNextWaveApiUrl(apiBaseUrl: string | undefined): string {
  const raw = apiBaseUrl?.trim() ?? ''
  const base = raw.replace(/\/+$/, '')
  return base ? `${base}/api/next-wave` : '/api/next-wave'
}
