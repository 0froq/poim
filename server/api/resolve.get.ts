import { detectPlatform, parseXStatusUrl } from '../../shared/utils/parse-x-url'
import { resolveXTweet } from '../utils/fetch-x'

export default defineEventHandler(async (event) => {
  const url = String(getQuery(event).url ?? '').trim()
  if (!url) {
    throw createError({
      statusCode: 400,
      statusMessage: 'invalid',
      data: { error: 'invalid', message: '缺少 url' },
    })
  }

  const platform = detectPlatform(url)
  if (platform === 'youtube' || platform === 'bilibili' || platform === 'xiaohongshu') {
    throw createError({
      statusCode: 400,
      statusMessage: 'unsupported',
      data: {
        error: 'unsupported',
        platform,
        message: '即将支持，v1 只处理 X',
      },
    })
  }

  const parsed = parseXStatusUrl(url)
  if (!parsed) {
    throw createError({
      statusCode: 400,
      statusMessage: 'invalid',
      data: {
        error: platform === 'x' ? 'invalid' : 'unsupported',
        message: platform === 'x' ? '需要帖子状态链接' : '暂不支持该平台',
      },
    })
  }

  const post = await resolveXTweet(parsed.id)
  post.source = 'url'
  post.fetchedAt = new Date().toISOString()
  post.canonicalUrl = post.canonicalUrl ?? `https://x.com/${parsed.handle ?? 'i'}/status/${parsed.id}`
  return post
})
