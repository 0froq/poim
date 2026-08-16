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

// 快照里的媒体 URL 必须可移植（合同 §5：走本站 CDN URL），不能留相对路径。
// 相对代理路径补成绝对 URL；data:/http(s) 原样返回。
export function absolutizeProxyUrl(path: string, origin: string): string {
  if (!path.startsWith('/'))
    return path
  return new URL(path, origin).href
}
