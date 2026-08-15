const HOSTS = new Set([
  'pbs.twimg.com',
  'video.twimg.com',
  'abs.twimg.com',
  'ton.twimg.com',
  'api.fxtwitter.com',
])

export function isAllowedMediaUrl(raw: string): boolean {
  try {
    const url = new URL(raw)
    return url.protocol === 'https:' && HOSTS.has(url.hostname)
  }
  catch {
    return false
  }
}

export function toProxyMediaUrl(raw: string): string {
  if (!raw || raw.startsWith('data:') || raw.startsWith('/'))
    return raw
  if (!isAllowedMediaUrl(raw))
    return raw
  return `/api/media?url=${encodeURIComponent(raw)}`
}
