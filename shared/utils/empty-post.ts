import type { PoimPost } from '../types/post'

export function emptyPost(): PoimPost {
  return {
    version: 1,
    platform: 'x',
    source: 'manual',
    author: { name: '', handle: '' },
    text: '',
    media: [],
  }
}

export function clonePost(post: PoimPost): PoimPost {
  return structuredClone(post)
}
