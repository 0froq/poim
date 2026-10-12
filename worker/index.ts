import { createError, H3Error } from 'h3'
import { proxyMedia } from '../server/utils/proxy-media'
import { resolvePostFromUrl } from '../server/utils/resolve-post'

function errorResponse(error: H3Error): Response {
  const statusCode = error.statusCode || 500
  const statusMessage = error.statusMessage || 'Error'
  return Response.json({
    statusCode,
    statusMessage,
    message: error.message || statusMessage,
    data: error.data,
  }, { status: statusCode })
}

function fail(statusCode: number, statusMessage: string, data?: Record<string, unknown>): Response {
  return errorResponse(createError({ statusCode, statusMessage, data }))
}

export async function route(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const path = url.pathname.replace(/\/+$/, '') || '/'

  if (!path.startsWith('/api/'))
    return fail(404, 'not found', { error: 'not found' })

  if (request.method !== 'GET' && request.method !== 'HEAD')
    return fail(405, 'Method Not Allowed')

  try {
    if (path === '/api/resolve') {
      const post = await resolvePostFromUrl(url.searchParams.get('url') ?? '')
      return Response.json(post)
    }
    if (path === '/api/media')
      return await proxyMedia(url.searchParams.get('url') ?? '')
    return fail(404, 'not found', { error: 'not found' })
  }
  catch (error) {
    if (error instanceof H3Error)
      return errorResponse(error)
    throw error
  }
}

export default {
  fetch: (request: Request) => route(request),
}
