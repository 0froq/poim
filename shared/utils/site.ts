export const SITE_ORIGIN = 'https://poim.froq.me'
export const SITE_NAME = 'poim'
export const SITE_DESCRIPTION = '把帖子做成可嵌入的卡片与图片'
export const OG_IMAGE_PATH = '/og.png'
export const OG_IMAGE_URL = `${SITE_ORIGIN}${OG_IMAGE_PATH}`

export function canonicalUrl(path: string): string {
  if (path === '/' || path === '')
    return `${SITE_ORIGIN}/`
  return `${SITE_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`
}
