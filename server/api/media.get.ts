import { isAllowedMediaUrl } from '../../shared/utils/media-url'

export default defineEventHandler(async (event) => {
  const url = String(getQuery(event).url ?? '')
  if (!isAllowedMediaUrl(url)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'invalid',
      data: { error: 'invalid', message: '媒体域名不允许' },
    })
  }

  const res = await fetch(url, {
    headers: { 'user-agent': 'poim/0.1' },
  })
  if (!res.ok) {
    throw createError({
      statusCode: 502,
      statusMessage: 'unavailable',
      data: { error: 'unavailable' },
    })
  }

  const type = res.headers.get('content-type') ?? 'application/octet-stream'
  setHeader(event, 'content-type', type)
  setHeader(event, 'cache-control', 'public, max-age=86400')
  setHeader(event, 'access-control-allow-origin', '*')
  return new Uint8Array(await res.arrayBuffer())
})
