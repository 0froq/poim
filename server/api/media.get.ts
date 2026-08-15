import { createError, defineEventHandler, getQuery, setHeader } from 'h3'
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
  setHeader(event, 'content-type', type)
  setHeader(event, 'cache-control', 'public, max-age=86400')
  setHeader(event, 'access-control-allow-origin', '*')

  // 流式透传，不把大 MP4 整段读进 Worker 内存
  return upstream.body ?? new Uint8Array()
})
