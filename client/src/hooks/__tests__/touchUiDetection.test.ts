import { describe, expect, it, vi, afterEach } from 'vitest'
import { COARSE_POINTER_MEDIA, readCoarsePointerMode } from '../touchUiDetection'

describe('readCoarsePointerMode', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns false when matchMedia is missing', () => {
    vi.stubGlobal('window', { matchMedia: undefined })
    expect(readCoarsePointerMode()).toBe(false)
  })

  it('returns matches from coarse pointer query', () => {
    vi.stubGlobal(
      'window',
      {
        matchMedia: (q: string) => ({
          matches: q === COARSE_POINTER_MEDIA,
        }),
      },
    )
    expect(readCoarsePointerMode()).toBe(true)
  })

  it('returns false when query does not match', () => {
    vi.stubGlobal(
      'window',
      {
        matchMedia: () => ({ matches: false }),
      },
    )
    expect(readCoarsePointerMode()).toBe(false)
  })
})
