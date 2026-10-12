import { createError } from 'h3'
import { isAllowedMediaUrl } from '../../shared/utils/media-url'

/** 白名单媒体代理。Nitro `/api/media` 与 Worker 入口共用。 */
export async function proxyMedia(url: string): Promise<Response> {
  if (!isAllowedMediaUrl(url)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'invalid',
      data: { error: 'invalid', message: '媒体域名不允许' },
    })
  }

  let upstream: Response
  try {
    upstream = await fetch(url, { headers: { 'user-agent': 'poim/0.1' } })
  }
  catch {
    throw createError({
      statusCode: 502,
      statusMessage: 'unavailable',
      data: { error: 'unavailable', message: '媒体源不可用' },
    })
  }
  if (!upstream.ok) {
    throw createError({
      statusCode: 502,
      statusMessage: 'unavailable',
      data: { error: 'unavailable', message: '媒体源不可用' },
    })
  }

  const type = upstream.headers.get('content-type') ?? 'application/octet-stream'
  return new Response(upstream.body, {
    headers: {
      'content-type': type,
      'cache-control': 'public, max-age=86400',
      'access-control-allow-origin': '*',
    },
  })
}
