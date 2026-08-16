export type PoimPlatform = 'x'

export type PoimMediaType = 'image' | 'video' | 'gif'

export interface PoimAuthor {
  name: string
  handle: string
  avatar?: string
}

export interface PoimMetrics {
  likes?: number
  retweets?: number
  replies?: number
  views?: number
}

export interface PoimMedia {
  type: PoimMediaType
  url: string
  poster?: string
  width?: number
  height?: number
}

export interface PoimPost {
  version: 1
  platform: PoimPlatform
  source: 'url' | 'manual'
  fetchedAt?: string
  canonicalUrl?: string
  id?: string
  author: PoimAuthor
  createdAt?: string
  text: string
  media: PoimMedia[]
  metrics?: PoimMetrics
  quote?: PoimPost
}

export type PoimPresetId = 'default'

export type PoimTheme = 'light' | 'dark'

export interface ResolveErrorBody {
  error: 'unsupported' | 'not_found' | 'unavailable' | 'invalid'
  platform?: string
  message: string
}
