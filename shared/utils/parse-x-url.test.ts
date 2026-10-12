import { describe, expect, it } from 'vitest'
import { detectPlatform, parseXStatusUrl } from './parse-x-url'

describe('parseXStatusUrl', () => {
  it('parses x.com status urls', () => {
    expect(parseXStatusUrl('https://x.com/jack/status/20')).toEqual({
      platform: 'x',
      handle: 'jack',
      id: '20',
    })
  })

  it('parses twitter.com and i/web urls', () => {
    expect(parseXStatusUrl('https://twitter.com/jack/status/20')?.id).toBe('20')
    expect(parseXStatusUrl('https://x.com/i/web/status/20')?.id).toBe('20')
  })

  it('returns null for non-status urls', () => {
    expect(parseXStatusUrl('https://x.com/jack')).toBeNull()
  })
})

describe('detectPlatform', () => {
  it('detects x and xiaohongshu', () => {
    expect(detectPlatform('https://www.xiaohongshu.com/explore/1')).toBe('xiaohongshu')
    expect(detectPlatform('https://xhslink.com/abc')).toBe('xiaohongshu')
    expect(detectPlatform('https://x.com/jack/status/20')).toBe('x')
  })

  it('does not recognize video sites', () => {
    expect(detectPlatform('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('unknown')
    expect(detectPlatform('https://youtu.be/dQw4w9WgXcQ')).toBe('unknown')
    expect(detectPlatform('https://www.bilibili.com/video/BV1')).toBe('unknown')
    expect(detectPlatform('https://b23.tv/abc')).toBe('unknown')
  })
})
