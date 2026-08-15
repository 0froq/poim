import type { PoimMedia, PoimPost } from '../../shared/types/post'

interface FxAuthor {
  name?: string
  screen_name?: string
  avatar_url?: string
}

interface FxMediaItem {
  type?: string
  url?: string
  thumbnail_url?: string
  width?: number
  height?: number
  duration?: number
}

interface FxTweet {
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
  media?: {
    photos?: FxMediaItem[]
    videos?: FxMediaItem[]
    gifs?: FxMediaItem[]
    all?: FxMediaItem[]
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
  if (tweet.quote)
    post.quote = mapFxTweet(tweet.quote, source)
  return post
}

export async function fetchFxTweet(id: string): Promise<FxTweet> {
  const res = await fetch(`https://api.fxtwitter.com/status/${id}`, {
    headers: { 'accept': 'application/json', 'user-agent': 'poim/0.1' },
  })
  if (res.status === 404)
    throw createError({ statusCode: 404, statusMessage: 'not_found', data: { error: 'not_found' } })
  if (!res.ok)
    throw createError({ statusCode: 502, statusMessage: 'unavailable', data: { error: 'unavailable' } })
  const body = await res.json() as { code?: number, tweet?: FxTweet | null }
  if (!body.tweet)
    throw createError({ statusCode: 404, statusMessage: 'not_found', data: { error: 'not_found' } })
  return body.tweet
}

function syndicationToken(id: string): string {
  return ((Number(id) / 1e15) * Math.PI).toString(36)
}

export async function fetchSyndicationTweet(id: string): Promise<FxTweet> {
  const url = new URL('https://cdn.syndication.twimg.com/tweet-result')
  url.searchParams.set('id', id)
  url.searchParams.set('lang', 'en')
  url.searchParams.set('token', syndicationToken(id))
  const res = await fetch(url, {
    headers: { 'accept': 'application/json', 'user-agent': 'Mozilla/5.0 poim/0.1' },
  })
  if (res.status === 404)
    throw createError({ statusCode: 404, statusMessage: 'not_found', data: { error: 'not_found' } })
  if (!res.ok)
    throw createError({ statusCode: 502, statusMessage: 'unavailable', data: { error: 'unavailable' } })
  const body = await res.json() as {
    id_str?: string
    text?: string
    created_at?: string
    favorite_count?: number
    conversation_count?: number
    user?: { name?: string, screen_name?: string, profile_image_url_https?: string }
    photos?: { url?: string, width?: number, height?: number }[]
    video?: { poster?: string, variants?: { type?: string, src?: string }[] }
    quoted_tweet?: unknown
  }
  const videoVariant = body.video?.variants?.find(v => v.type?.includes('mp4') && v.src)
  const tweet: FxTweet = {
    id: body.id_str ?? id,
    url: `https://x.com/${body.user?.screen_name ?? 'i'}/status/${body.id_str ?? id}`,
    text: body.text,
    created_at: body.created_at,
    author: {
      name: body.user?.name,
      screen_name: body.user?.screen_name,
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
  return tweet
}

export async function resolveXTweet(id: string): Promise<PoimPost> {
  try {
    const tweet = await fetchFxTweet(id)
    return mapFxTweet(tweet, 'url')
  }
  catch (error) {
    const status = (error as { statusCode?: number }).statusCode
    if (status === 404)
      throw error
    const tweet = await fetchSyndicationTweet(id)
    return mapFxTweet(tweet, 'url')
  }
}
