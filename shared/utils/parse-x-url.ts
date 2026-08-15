export type DetectedPlatform = 'x' | 'youtube' | 'bilibili' | 'xiaohongshu' | 'unknown'

export interface ParsedXUrl {
  platform: 'x'
  id: string
  handle?: string
}

const X_STATUS = /(?:twitter\.com|x\.com)\/(?:i\/web\/status|@?(\w+)\/status)\/(\d+)/i

export function detectPlatform(raw: string): DetectedPlatform {
  const url = raw.trim()
  if (/youtube\.com|youtu\.be/i.test(url))
    return 'youtube'
  if (/bilibili\.com|b23\.tv/i.test(url))
    return 'bilibili'
  if (/xiaohongshu\.com|xhslink\.com/i.test(url))
    return 'xiaohongshu'
  if (X_STATUS.test(url) || /(?:twitter\.com|x\.com)\/.+/i.test(url))
    return 'x'
  return 'unknown'
}

export function parseXStatusUrl(raw: string): ParsedXUrl | null {
  const trimmed = raw.trim()
  const match = trimmed.match(X_STATUS)
  if (!match?.[2])
    return null
  return {
    platform: 'x',
    handle: match[1],
    id: match[2],
  }
}

export function formatHandle(handle: string): string {
  const stripped = handle.replace(/^@/, '')
  return stripped ? `@${stripped}` : ''
}
