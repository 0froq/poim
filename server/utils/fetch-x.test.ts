import type { FxTweet } from './fetch-x'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mapFxTweet, resolveXTweet } from './fetch-x'

type MockResult = { status: number, body?: unknown } | Error

function stubFetch(handler: (url: string) => MockResult): { urls: () => string[] } {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : String(input)
    const result = handler(url)
    if (result instanceof Error)
      throw result
    return {
      ok: result.status >= 200 && result.status < 300,
      status: result.status,
      json: async () => result.body,
    }
  })
  vi.stubGlobal('fetch', fetchMock)
  return { urls: () => fetchMock.mock.calls.map(call => String(call[0])) }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

const fxTweet: FxTweet = {
  id: '20',
  url: 'https://x.com/jack/status/20',
  text: 'hello world',
  created_timestamp: 1_334_180_160,
  author: {
    name: 'Jack',
    screen_name: 'jack',
    avatar_url: 'https://pbs.twimg.com/profile_images/1/jack_normal.png',
  },
  likes: 12,
  retweets: 34,
  replies: 5,
  views: 678,
  media: {
    photos: [{ url: 'https://pbs.twimg.com/media/p1.jpg', width: 1200, height: 800 }],
    gifs: [{ url: 'https://video.twimg.com/ext_tw_video/g1.mp4', thumbnail_url: 'https://pbs.twimg.com/g1.jpg' }],
    videos: [{ url: 'https://video.twimg.com/ext_tw_video/v1.mp4', thumbnail_url: 'https://pbs.twimg.com/v1.jpg', width: 640, height: 360 }],
  },
}

describe('mapFxTweet', () => {
  it('maps an fx tweet with media and metrics', () => {
    expect(mapFxTweet(fxTweet, 'url')).toEqual({
      version: 1,
      platform: 'x',
      source: 'url',
      id: '20',
      canonicalUrl: 'https://x.com/jack/status/20',
      text: 'hello world',
      createdAt: new Date(1_334_180_160 * 1000).toISOString(),
      author: {
        name: 'Jack',
        handle: 'jack',
        avatar: 'https://pbs.twimg.com/profile_images/1/jack_normal.png',
      },
      media: [
        { type: 'image', url: 'https://pbs.twimg.com/media/p1.jpg', width: 1200, height: 800 },
        { type: 'gif', url: 'https://video.twimg.com/ext_tw_video/g1.mp4', poster: 'https://pbs.twimg.com/g1.jpg' },
        { type: 'video', url: 'https://video.twimg.com/ext_tw_video/v1.mp4', poster: 'https://pbs.twimg.com/v1.jpg', width: 640, height: 360 },
      ],
      metrics: { likes: 12, retweets: 34, replies: 5, views: 678 },
    })
  })

  it('maps a text-only tweet without media or timestamps', () => {
    const post = mapFxTweet({ id: '1', text: 'just text', author: { screen_name: 'a' } }, 'url')
    expect(post.media).toEqual([])
    expect(post.createdAt).toBeUndefined()
    expect(post.metrics).toEqual({})
    expect(post.quote).toBeUndefined()
  })

  it('clamps quotes to one level', () => {
    const post = mapFxTweet({
      id: '1',
      text: 'outer',
      quote: {
        id: '2',
        text: 'inner',
        quote: { id: '3', text: 'too deep' },
      },
    }, 'url')
    expect(post.quote?.id).toBe('2')
    expect(post.quote?.quote).toBeUndefined()
  })
})

describe('resolveXTweet', () => {
  it('resolves via fx first and never calls syndication', async () => {
    const fetchStub = stubFetch((url) => {
      if (url.startsWith('https://api.fxtwitter.com/'))
        return { status: 200, body: { code: 200, tweet: fxTweet } }
      throw new Error('syndication should not be called')
    })
    const post = await resolveXTweet('20')
    expect(post.id).toBe('20')
    expect(post.text).toBe('hello world')
    expect(fetchStub.urls()).toHaveLength(1)
  })

  it('falls back to syndication when fx is unavailable', async () => {
    const syndicationTweet = {
      id_str: '20',
      text: 'from syndication',
      created_at: 'Sat Aug 15 19:00:00 +0000 2026',
      user: {
        name: 'Jack',
        screen_name: 'jack',
        profile_image_url_https: 'https://pbs.twimg.com/x_normal.png',
      },
      favorite_count: 7,
      conversation_count: 3,
      photos: [{ url: 'https://pbs.twimg.com/media/p.jpg', width: 100, height: 50 }],
      video: {
        poster: 'https://pbs.twimg.com/v.jpg',
        variants: [
          { type: 'application/x-mpegURL', src: 'https://video.twimg.com/hls.m3u8' },
          { type: 'video/mp4', src: 'https://video.twimg.com/v.mp4' },
        ],
      },
      quoted_tweet: {
        id_str: '21',
        text: 'quoted',
        user: { name: 'B', screen_name: 'b' },
      },
    }
    const fetchStub = stubFetch((url) => {
      if (url.startsWith('https://api.fxtwitter.com/'))
        return { status: 502, body: {} }
      if (url.startsWith('https://cdn.syndication.twimg.com/tweet-result'))
        return { status: 200, body: syndicationTweet }
      throw new Error(`unexpected url: ${url}`)
    })
    const post = await resolveXTweet('20')
    expect(post.id).toBe('20')
    expect(post.text).toBe('from syndication')
    expect(post.author).toEqual({
      name: 'Jack',
      handle: 'jack',
      avatar: 'https://pbs.twimg.com/x_200x200.png',
    })
    expect(post.createdAt).toBe(new Date('Sat Aug 15 19:00:00 +0000 2026').toISOString())
    expect(post.media).toEqual([
      { type: 'image', url: 'https://pbs.twimg.com/media/p.jpg', width: 100, height: 50 },
      { type: 'video', url: 'https://video.twimg.com/v.mp4', poster: 'https://pbs.twimg.com/v.jpg' },
    ])
    expect(post.metrics).toEqual({ likes: 7, replies: 3 })
    expect(post.quote).toMatchObject({
      id: '21',
      text: 'quoted',
      author: { name: 'B', handle: 'b' },
    })
    expect(fetchStub.urls()).toHaveLength(2)
  })

  it('treats fx network errors as unavailable and still falls back', async () => {
    const fetchStub = stubFetch((url) => {
      if (url.startsWith('https://api.fxtwitter.com/'))
        return new Error('ECONNRESET')
      return { status: 200, body: { id_str: '20', text: 'ok', user: { name: 'J', screen_name: 'j' } } }
    })
    const post = await resolveXTweet('20')
    expect(post.text).toBe('ok')
    expect(fetchStub.urls()).toHaveLength(2)
  })

  it('does not fall back when fx reports not found', async () => {
    const fetchStub = stubFetch((url) => {
      if (url.startsWith('https://api.fxtwitter.com/'))
        return { status: 404, body: {} }
      throw new Error('syndication should not be called')
    })
    await expect(resolveXTweet('20')).rejects.toMatchObject({
      statusCode: 404,
      data: { error: 'not_found' },
    })
    expect(fetchStub.urls()).toHaveLength(1)
  })

  it('reports not found when syndication cannot find it either', async () => {
    stubFetch(url => url.startsWith('https://api.fxtwitter.com/')
      ? { status: 502, body: {} }
      : { status: 404, body: {} })
    await expect(resolveXTweet('20')).rejects.toMatchObject({
      statusCode: 404,
      data: { error: 'not_found' },
    })
  })

  it('treats syndication error payloads (no id_str) as not found', async () => {
    stubFetch(url => url.startsWith('https://api.fxtwitter.com/')
      ? { status: 502, body: {} }
      : { status: 200, body: { errors: [{ code: 323 }] } })
    await expect(resolveXTweet('20')).rejects.toMatchObject({
      statusCode: 404,
      data: { error: 'not_found' },
    })
  })

  it('fails with unavailable when both providers are down', async () => {
    stubFetch(() => ({ status: 503, body: {} }))
    await expect(resolveXTweet('20')).rejects.toMatchObject({
      statusCode: 502,
      data: { error: 'unavailable' },
    })
  })

  it('fails with unavailable when fx is down and syndication errors out', async () => {
    stubFetch(url => url.startsWith('https://api.fxtwitter.com/')
      ? { status: 500, body: {} }
      : new Error('network down'))
    await expect(resolveXTweet('20')).rejects.toMatchObject({
      statusCode: 502,
      data: { error: 'unavailable' },
    })
  })
})
