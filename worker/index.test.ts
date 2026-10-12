import { afterEach, describe, expect, it, vi } from 'vitest'
import { route } from './index'

const ORIGIN = 'https://poim.example'

function call(path: string, init: RequestInit = {}): Promise<Response> {
  return route(new Request(`${ORIGIN}${path}`, init))
}

function stubFetch(status: number, body?: unknown, headers: Record<string, string> = {}): void {
  vi.stubGlobal('fetch', vi.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (name: string) => headers[name.toLowerCase()] ?? null,
    },
    json: async () => body,
    body: typeof body === 'string' ? body : JSON.stringify(body ?? null),
  })))
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('worker /api', () => {
  it('rejects POST with 405', async () => {
    const response = await call('/api/resolve', { method: 'POST' })
    expect(response.status).toBe(405)
  })

  it('unknown API path returns 404 JSON', async () => {
    const response = await call('/api/nope')
    expect(response.status).toBe(404)
    expect(await response.json()).toMatchObject({ statusCode: 404, data: { error: 'not found' } })
  })

  it('resolve without url returns 400 invalid', async () => {
    const response = await call('/api/resolve')
    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({
      statusMessage: 'invalid',
      data: { error: 'invalid', message: '缺少 url' },
    })
  })

  it('resolve video site urls return generic unsupported', async () => {
    for (const raw of ['https://youtu.be/dQw4w9WgXcQ', 'https://www.bilibili.com/video/BV1xx411c7mD', 'https://b23.tv/abc']) {
      const response = await call(`/api/resolve?url=${encodeURIComponent(raw)}`)
      expect(response.status).toBe(400)
      const body = await response.json() as { data?: { platform?: string } }
      expect(body).toMatchObject({
        statusMessage: 'invalid',
        data: { error: 'unsupported', message: '暂不支持该平台' },
      })
      expect(body.data?.platform).toBeUndefined()
      expect(JSON.stringify(body)).not.toMatch(/youtube|bilibili/i)
    }
  })

  it('resolve xiaohongshu url returns 400 unsupported with platform', async () => {
    const response = await call(`/api/resolve?url=${encodeURIComponent('https://www.xiaohongshu.com/explore/1')}`)
    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({
      statusMessage: 'unsupported',
      data: { error: 'unsupported', platform: 'xiaohongshu' },
    })
  })

  it('resolve x status url returns post json', async () => {
    stubFetch(200, {
      tweet: {
        id: '20',
        url: 'https://x.com/jack/status/20',
        text: 'hello',
        author: { name: 'Jack', screen_name: 'jack' },
      },
    })
    const response = await call(`/api/resolve?url=${encodeURIComponent('https://x.com/jack/status/20')}`)
    expect(response.status).toBe(200)
    const post = await response.json() as { id: string, fetchedAt: string, canonicalUrl: string, text: string }
    expect(post.id).toBe('20')
    expect(post.text).toBe('hello')
    expect(post.canonicalUrl).toBe('https://x.com/jack/status/20')
    expect(post.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('media rejects non-allowlisted host', async () => {
    stubFetch(200)
    const response = await call(`/api/media?url=${encodeURIComponent('https://evil.example/x.jpg')}`)
    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ data: { error: 'invalid' } })
    expect(vi.mocked(fetch)).not.toHaveBeenCalled()
  })

  it('media proxies allowlisted host with cache and cors headers', async () => {
    stubFetch(200, 'BINARY', { 'content-type': 'video/mp4' })
    const response = await call(`/api/media?url=${encodeURIComponent('https://video.twimg.com/ext_tw_video/1.mp4')}`)
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('video/mp4')
    expect(response.headers.get('cache-control')).toBe('public, max-age=86400')
    expect(response.headers.get('access-control-allow-origin')).toBe('*')
    expect(await response.text()).toBe('BINARY')
  })
})
