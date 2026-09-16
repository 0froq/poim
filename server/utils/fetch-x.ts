import type { PoimMedia, PoimPost } from '../../shared/types/post'
import { createError, H3Error } from 'h3'
import { emptyPost } from '../../shared/utils/empty-post'

/**
 * X 帖子解析：FxEmbed 主、syndication 备（v1 不接官方 X API）。
 * 纯服务端逻辑；失败一律抛 H3Error（404 not_found / 502 unavailable），
 * 不把网络异常透传成 500。
 */

export interface FxAuthor {
  name?: string
  screen_name?: string
  avatar_url?: string
}

export interface FxMediaItem {
  type?: string
  url?: string
  thumbnail_url?: string
  width?: number
  height?: number
  duration?: number
}

export interface FxTweet {
  id?: string
  url?: string
  text?: string
  created_at?: string
  created_timestamp?: number
  possibly_sensitive?: boolean
  author?: FxAuthor
  likes?: number
  retweets?: number
  replies?: number
  views?: number | null
  quote?: FxTweet
  replying_to?: string | null
  /** 被回复帖的 snowflake；有则再拉一层原帖体。 */
  replying_to_status?: string | number | null
  reposted_by?: FxAuthor | null
  media?: {
    photos?: FxMediaItem[]
    videos?: FxMediaItem[]
    gifs?: FxMediaItem[]
    all?: FxMediaItem[]
  }
}

const FETCH_TIMEOUT_MS = 8_000

function failure(statusCode: 404 | 502, error: 'not_found' | 'unavailable', message: string): H3Error {
  return createError({
    statusCode,
    statusMessage: error,
    data: { error, message },
  })
}

function notFound(message = '帖子不存在、已删除或不可见'): H3Error {
  return failure(404, 'not_found', message)
}

function unavailable(message = '第三方解析服务暂不可用'): H3Error {
  return failure(502, 'unavailable', message)
}

function isFailure(error: unknown, code: 'not_found' | 'unavailable'): boolean {
  return error instanceof H3Error && (error.data as { error?: string } | undefined)?.error === code
}

/** 拉 JSON；404 → not_found，非 2xx / 网络 / 超时 → unavailable。 */
async function fetchJson(url: string): Promise<unknown> {
  try {
    const res = await fetch(url, {
      headers: { 'accept': 'application/json', 'user-agent': 'poim/0.1' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    if (res.status === 404 || res.status === 401)
      throw notFound()
    if (!res.ok)
      throw unavailable()
    return await res.json() as unknown
  }
  catch (error) {
    if (error instanceof H3Error)
      throw error
    throw unavailable()
  }
}

function createdAt(tweet: FxTweet): string | undefined {
  if (tweet.created_timestamp)
    return new Date(tweet.created_timestamp * 1000).toISOString()
  if (tweet.created_at) {
    const parsed = new Date(tweet.created_at)
    if (!Number.isNaN(parsed.getTime()))
      return parsed.toISOString()
  }
  return undefined
}

function mapMedia(tweet: FxTweet): PoimMedia[] {
  const photos = tweet.media?.photos ?? []
  const videos = tweet.media?.videos ?? []
  const gifs = tweet.media?.gifs ?? []
  const items: PoimMedia[] = []
  for (const photo of photos) {
    if (!photo.url)
      continue
    items.push({
      type: 'image',
      url: photo.url,
      width: photo.width,
      height: photo.height,
    })
  }
  for (const gif of gifs) {
    if (!gif.url)
      continue
    items.push({
      type: 'gif',
      url: gif.url,
      poster: gif.thumbnail_url,
      width: gif.width,
      height: gif.height,
    })
  }
  for (const video of videos) {
    if (!video.url)
      continue
    items.push({
      type: 'video',
      url: video.url,
      poster: video.thumbnail_url,
      width: video.width,
      height: video.height,
    })
  }
  return items
}

export function mapFxTweet(tweet: FxTweet, source: PoimPost['source']): PoimPost {
  const post: PoimPost = {
    version: 1,
    platform: 'x',
    source,
    id: tweet.id,
    canonicalUrl: tweet.url,
    text: tweet.text ?? '',
    createdAt: createdAt(tweet),
    author: {
      name: tweet.author?.name ?? '',
      handle: tweet.author?.screen_name ?? '',
      avatar: tweet.author?.avatar_url,
    },
    media: mapMedia(tweet),
    metrics: {
      likes: tweet.likes,
      retweets: tweet.retweets,
      replies: tweet.replies,
      views: tweet.views ?? undefined,
    },
  }
  const replyHandle = asHandle(tweet.replying_to)
  if (replyHandle)
    post.replyToHandle = replyHandle
  if (tweet.reposted_by) {
    post.repostedBy = {
      name: tweet.reposted_by.name ?? '',
      handle: tweet.reposted_by.screen_name ?? '',
      avatar: tweet.reposted_by.avatar_url,
    }
  }
  // 契约：只保留一层引用（quote）
  if (tweet.quote)
    post.quote = mapFxTweet({ ...tweet.quote, quote: undefined }, source)
  return post
}

export async function fetchFxTweet(id: string): Promise<FxTweet> {
  const body = await fetchJson(`https://api.fxtwitter.com/status/${id}`) as { code?: number, tweet?: FxTweet | null }
  if (!body.tweet)
    throw notFound()
  return body.tweet
}

function syndicationToken(id: string): string {
  return ((Number(id) / 1e15) * Math.PI).toString(36)
}

interface SyndicationUser {
  name?: string
  screen_name?: string
  profile_image_url_https?: string
}

interface SyndicationPhoto {
  url?: string
  width?: number
  height?: number
}

interface SyndicationVideo {
  poster?: string
  variants?: { type?: string, src?: string }[]
}

interface SyndicationTweet {
  id_str?: string
  text?: string
  created_at?: string
  favorite_count?: number
  conversation_count?: number
  user?: SyndicationUser
  photos?: SyndicationPhoto[]
  video?: SyndicationVideo
  quoted_tweet?: SyndicationTweet
}

function mapSyndicationTweet(body: SyndicationTweet): FxTweet {
  const id = body.id_str ?? ''
  const screenName = body.user?.screen_name
  const videoVariant = body.video?.variants?.find(v => v.type?.includes('mp4') && v.src)
  const tweet: FxTweet = {
    id,
    url: `https://x.com/${screenName ?? 'i'}/status/${id}`,
    text: body.text,
    created_at: body.created_at,
    author: {
      name: body.user?.name,
      screen_name: screenName,
      avatar_url: body.user?.profile_image_url_https?.replace('_normal', '_200x200'),
    },
    likes: body.favorite_count,
    replies: body.conversation_count,
    media: {
      photos: body.photos,
      videos: videoVariant?.src
        ? [{ url: videoVariant.src, thumbnail_url: body.video?.poster }]
        : [],
    },
  }
  if (body.quoted_tweet)
    tweet.quote = mapSyndicationTweet(body.quoted_tweet)
  return tweet
}

export async function fetchSyndicationTweet(id: string): Promise<FxTweet> {
  const url = new URL('https://cdn.syndication.twimg.com/tweet-result')
  url.searchParams.set('id', id)
  url.searchParams.set('lang', 'en')
  url.searchParams.set('token', syndicationToken(id))
  const body = await fetchJson(url.toString()) as SyndicationTweet | null
  // 200 但无 id_str（errors 载荷）→ 视为不可见（私密 / 年龄限制等）
  if (!body?.id_str)
    throw notFound()
  return mapSyndicationTweet(body)
}

async function resolveRawTweet(id: string): Promise<FxTweet> {
  try {
    return await fetchFxTweet(id)
  }
  catch (error) {
    // FxEmbed 明确 404（删除/私密）是权威结论，不再回落 syndication
    if (isFailure(error, 'not_found'))
      throw error
    try {
      return await fetchSyndicationTweet(id)
    }
    catch (fallbackError) {
      if (isFailure(fallbackError, 'not_found'))
        throw fallbackError
      // 两个第三方都不可用 → 明确失败态，不冒充已拉取
      throw unavailable()
    }
  }
}

function asHandle(raw: unknown): string | undefined {
  if (typeof raw !== 'string')
    return undefined
  const handle = raw.replace(/^@/, '').trim()
  return handle || undefined
}

function asStatusId(raw: unknown): string | undefined {
  if (raw == null || raw === '')
    return undefined
  const id = String(raw).trim()
  return id || undefined
}

function stubParentPost(handle?: string, id?: string): PoimPost {
  const post = emptyPost()
  post.source = 'url'
  post.id = id
  const h = handle ?? ''
  post.author = { name: h, handle: h }
  post.text = ''
  post.media = []
  return post
}

async function fetchFxUser(handle: string): Promise<FxAuthor | null> {
  try {
    const body = await fetchJson(`https://api.fxtwitter.com/${encodeURIComponent(handle)}`) as { user?: FxAuthor | null }
    return body.user ?? null
  }
  catch {
    return null
  }
}

async function resolveParentPost(tweet: FxTweet, childId: string): Promise<PoimPost | undefined> {
  const handle = asHandle(tweet.replying_to)
  const parentId = asStatusId(tweet.replying_to_status)
  if (!handle && !parentId)
    return undefined
  if (parentId && parentId !== childId) {
    try {
      const parentTweet = await resolveRawTweet(parentId)
      return mapFxTweet({
        ...parentTweet,
        replying_to: undefined,
        replying_to_status: undefined,
      }, 'url')
    }
    catch {
      // 私密/删除：仍用同宽流画出原帖作者
    }
  }
  const stub = stubParentPost(handle, parentId)
  if (handle) {
    const user = await fetchFxUser(handle)
    if (user) {
      stub.author = {
        name: user.name || handle,
        handle: user.screen_name || handle,
        avatar: user.avatar_url,
      }
    }
  }
  return stub
}

export async function resolveXTweet(id: string): Promise<PoimPost> {
  const tweet = await resolveRawTweet(id)
  const post = mapFxTweet(tweet, 'url')
  const parent = await resolveParentPost(tweet, post.id ?? id)
  if (parent)
    post.replyTo = parent
  return post
}
