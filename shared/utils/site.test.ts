import { describe, expect, it } from 'vitest'
import { canonicalUrl, OG_IMAGE_URL, SITE_ORIGIN } from './site'

describe('canonicalUrl', () => {
  it('uses a trailing slash on the origin', () => {
    expect(canonicalUrl('/')).toBe(`${SITE_ORIGIN}/`)
    expect(canonicalUrl('')).toBe(`${SITE_ORIGIN}/`)
  })

  it('keeps page paths without a trailing slash', () => {
    expect(canonicalUrl('/cases')).toBe(`${SITE_ORIGIN}/cases`)
  })
})

describe('oG_IMAGE_URL', () => {
  it('is an absolute https URL on the production origin', () => {
    expect(OG_IMAGE_URL).toBe(`${SITE_ORIGIN}/og.png`)
    expect(OG_IMAGE_URL.startsWith('https://')).toBe(true)
  })
})
