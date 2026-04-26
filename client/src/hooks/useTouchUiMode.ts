import { useEffect, useState } from 'react'
import { COARSE_POINTER_MEDIA, readCoarsePointerMode } from './touchUiDetection'

/**
 * True when the primary pointer is coarse (typical phones/tablets).
 * Used to show on-canvas virtual control hints; keyboard still works on hybrid laptops.
 */
export function useTouchUiMode(): boolean {
  const [touchUi, setTouchUi] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(COARSE_POINTER_MEDIA)
    const apply = () => setTouchUi(readCoarsePointerMode())
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  return touchUi
}
