/** Query used to show on-canvas virtual controls (typical phones / tablets). */
export const COARSE_POINTER_MEDIA = '(pointer: coarse)' as const

export function readCoarsePointerMode(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }
  return window.matchMedia(COARSE_POINTER_MEDIA).matches
}
