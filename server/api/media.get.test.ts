import type { H3Event } from 'h3'
import { afterEach, describe, expect, it, vi } from 'vitest'
import mediaHandler from './media.get'

function fakeEvent(path: string): H3Event & { __headers: Map<string, string> } {
  const headers = new Map<string, string>()
  const event = {
    path,
    node: {
      res: {
        setHeader(name: string, value: string) {
          headers.set(name.toLowerCase(), String(value))
        },
      },
    },
    __headers: headers,
  }
  return event as unknown as H3Event & { __headers: Map<string, string> }
}

function stubFetch(status: number, body?: unknown, headers: Record<string, string> = {}): void {
  vi.stubGlobal('fetch', vi.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (name: string) => headers[name.toLowerCase()] ?? null,
    },
    body,
  })))
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('media 代理（GET /api/media）', () => {
  it('非白名单域名 → 400 invalid，不请求上游', async () => {
    stubFetch(200)
    const event = fakeEvent('/api/media?url=https%3A%2F%2Fevil.example%2Fx.jpg')
    await expect(mediaHandler(event)).rejects.toMatchObject({
      statusCode: 400,
      data: { error: 'invalid' },
    })
    expect(vi.mocked(fetch)).not.toHaveBeenCalled()
  })

  it('白名单域名 → 流式透传同源响应，带缓存头与 CORS', async () => {
    stubFetch(200, 'BINARY', { 'content-type': 'video/mp4' })
    const event = fakeEvent('/api/media?url=https%3A%2F%2Fvideo.twimg.com%2Fext_tw_video%2F1.mp4')
    const result = await mediaHandler(event)

    expect(event.__headers.get('content-type')).toBe('video/mp4')
    expect(event.__headers.get('cache-control')).toBe('public, max-age=86400')
    expect(event.__headers.get('access-control-allow-origin')).toBe('*')
    expect(result).toBe('BINARY')
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('上游 404 → 502 unavailable', async () => {
    stubFetch(404)
    const event = fakeEvent('/api/media?url=https%3A%2F%2Fpbs.twimg.com%2Fmedia%2Fgone.jpg')
    await expect(mediaHandler(event)).rejects.toMatchObject({
      statusCode: 502,
      data: { error: 'unavailable' },
    })
  })

  it('缺失 url → 400', async () => {
    const event = fakeEvent('/api/media')
    await expect(mediaHandler(event)).rejects.toMatchObject({ statusCode: 400 })
  })
})
