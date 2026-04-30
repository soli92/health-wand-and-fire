import { describe, expect, it } from 'vitest'
import { resolveNextWaveApiUrl } from '../nextWaveApiUrl'

describe('resolveNextWaveApiUrl', () => {
  it('returns same-origin path when base is empty', () => {
    expect(resolveNextWaveApiUrl(undefined)).toBe('/api/next-wave')
    expect(resolveNextWaveApiUrl('')).toBe('/api/next-wave')
    expect(resolveNextWaveApiUrl('   ')).toBe('/api/next-wave')
  })

  it('prefixes API base without trailing slash', () => {
    expect(resolveNextWaveApiUrl('https://api.example.com')).toBe(
      'https://api.example.com/api/next-wave',
    )
    expect(resolveNextWaveApiUrl('https://api.example.com/')).toBe(
      'https://api.example.com/api/next-wave',
    )
  })
})
