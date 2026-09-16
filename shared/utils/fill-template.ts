import type { PoimMedia, PoimPost } from '../types/post'
import { emptyPost } from './empty-post'
import { formatIsoDate, formatIsoDateTime } from './format-date'
import { applyMediaMosaic, MOSAIC_MAX } from './media-layout'
import { formatHandle } from './parse-x-url'
import { queryPoimSlot, queryPoimSlots } from './slots'

export interface FillContext {
  mediaSrc: (url: string) => string
  brandHref?: string
  // 元信息显示开关（默认开启）。showFetchedAt 只控制抓取时间戳子节点，
  // 不隐藏 URL 来源行的「Fetched from X」（PROJECT.md §3）。
  showMetrics?: boolean
  showFetchedAt?: boolean
}

function hide(el: HTMLElement): void {
  el.hidden = true
}

function show(el: HTMLElement): void {
  el.hidden = false
}

function isInsideAny(el: Element, roots: Array<HTMLElement | null>): boolean {
  return roots.some(root => !!root && root.contains(el) && el !== root)
}

// 稳定国际日期格式（PROJECT.md §3）：YYYY-MM-DD，必要时 YYYY-MM-DD HH:mm。
// 卡片 metadata 路径不输出任何中文年月日。
function formatPostTime(iso?: string): string {
  return formatIsoDateTime(iso)
}

function formatCount(n?: number): string {
  if (n == null)
    return ''
  if (n >= 1_000_000)
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1_000)
    return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return String(n)
}

const SVG_NS = 'http://www.w3.org/2000/svg'

// 系统生成的图标（fillTemplate 注入槽位 DOM；在消毒之后执行，不经过用户 HTML 白名单）。
// 图标全部 aria-hidden + 外层带无障碍文本标签（role="img" + aria-label）。
function iconSvg(pathMarkup: string, className: string, viewBox = '0 0 24 24'): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.classList.add(className)
  svg.setAttribute('viewBox', viewBox)
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('focusable', 'false')
  svg.innerHTML = pathMarkup
  return svg
}

// 线框图标（stroke 由 tokens.css 的 .poim-icon 提供：fill:none / stroke:currentColor）
const ICON_PATHS = {
  replies: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
  reposts: '<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
  likes: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
  views: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
} as const

// X 平台标识（fill 图标，stroke 由 .poim-x-mark 关掉）
const X_LOGO_PATH = '<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>'

// 指标项：图标 + 数值，可见主 UI 无自然语言；无障碍名 = "{count} {metric}"。
function metricEl(metric: string, count: number, pathMarkup: string): HTMLElement {
  const wrap = document.createElement('span')
  wrap.className = 'poim-metric'
  wrap.setAttribute('role', 'img')
  wrap.setAttribute('aria-label', `${formatCount(count)} ${metric}`)
  wrap.append(iconSvg(pathMarkup, 'poim-icon'))
  const num = document.createElement('span')
  num.className = 'poim-metric-count'
  num.textContent = formatCount(count)
  wrap.append(num)
  return wrap
}

// URL 来源行：`Fetched from [X 图标]`。showFetchedAt 只控制时间戳子节点。
function provenanceEl(): HTMLElement {
  const span = document.createElement('span')
  span.className = 'poim-provenance'
  const prefix = document.createElement('span')
  prefix.textContent = 'Fetched from '
  const mark = document.createElement('span')
  mark.className = 'poim-platform'
  mark.setAttribute('role', 'img')
  mark.setAttribute('aria-label', 'X')
  mark.append(iconSvg(X_LOGO_PATH, 'poim-x-mark'))
  span.append(prefix, mark)
  return span
}

function renderMedia(container: HTMLElement, media: PoimMedia[], mediaSrc: (url: string) => string): void {
  container.replaceChildren()
  const items = media.slice(0, MOSAIC_MAX)
  container.dataset.count = String(items.length)
  for (const item of items) {
    if (item.type === 'video' || item.type === 'gif') {
      const video = document.createElement('video')
      video.setAttribute('src', mediaSrc(item.url))
      if (item.poster)
        video.setAttribute('poster', mediaSrc(item.poster))
      video.setAttribute('loop', '')
      video.setAttribute('muted', '')
      video.setAttribute('autoplay', '')
      video.setAttribute('playsinline', '')
      if (item.type === 'video')
        video.setAttribute('controls', '')
      video.className = 'poim-video'
      container.append(video)
    }
    else {
      const img = document.createElement('img')
      img.src = mediaSrc(item.url)
      img.alt = ''
      img.className = 'poim-image'
      container.append(img)
    }
  }
}

function fillAuthorAndText(scope: ParentNode, post: PoimPost, skipRoots: Array<HTMLElement | null>): void {
  for (const el of queryPoimSlots(scope, 'author-name')) {
    if (isInsideAny(el, skipRoots))
      continue
    el.textContent = post.author.name
  }
  for (const el of queryPoimSlots(scope, 'author-handle')) {
    if (isInsideAny(el, skipRoots))
      continue
    el.textContent = formatHandle(post.author.handle)
  }
  for (const el of queryPoimSlots(scope, 'author-avatar')) {
    if (isInsideAny(el, skipRoots))
      continue
    if (el instanceof HTMLImageElement) {
      if (post.author.avatar)
        el.src = post.author.avatar
      else
        hide(el)
    }
  }
  for (const el of queryPoimSlots(scope, 'text')) {
    if (isInsideAny(el, skipRoots))
      continue
    el.textContent = post.text
  }
  for (const el of queryPoimSlots(scope, 'time')) {
    if (isInsideAny(el, skipRoots))
      continue
    el.textContent = formatPostTime(post.createdAt)
    if (el instanceof HTMLTimeElement && post.createdAt)
      el.dateTime = post.createdAt
  }
}

function fillMedia(container: HTMLElement, media: PoimMedia[], mediaSrc: (url: string) => string): void {
  if (!media.length) {
    hide(container)
    return
  }
  renderMedia(container, media.map(item => ({
    ...item,
    url: mediaSrc(item.url),
    poster: item.poster ? mediaSrc(item.poster) : undefined,
  })), url => url)
  applyMediaMosaic(container, media)
  show(container)
}

function slotOwn(root: HTMLElement, name: 'media' | 'text', nested: Array<HTMLElement | null>): HTMLElement | null {
  return queryPoimSlots(root, name).find(el => !isInsideAny(el, nested)) ?? null
}

function fillNested(container: HTMLElement, post: PoimPost, ctx: FillContext): void {
  fillAuthorAndText(container, post, [])
  const text = queryPoimSlot(container, 'text')
  if (text) {
    if (post.text.trim())
      show(text)
    else
      hide(text)
  }
  const time = queryPoimSlot(container, 'time')
  if (time && !post.createdAt)
    hide(time)
  const media = queryPoimSlot(container, 'media')
  if (media)
    fillMedia(media, post.media, ctx.mediaSrc)
}

function parentForReply(post: PoimPost): PoimPost | null {
  if (post.replyTo)
    return post.replyTo
  const handle = post.replyToHandle?.replace(/^@/, '').trim()
  if (!handle)
    return null
  const stub = emptyPost()
  stub.author = { name: handle, handle }
  stub.text = ''
  stub.media = []
  return stub
}

function wrapMainAsEmbed(root: HTMLElement, nested: Array<HTMLElement | null>): void {
  // 引用槽也带 .poim-embed；转发壳没有 data-poim。
  if (root.querySelector(':scope > .poim-embed:not([data-poim])'))
    return
  const embed = document.createElement('div')
  embed.className = 'poim-embed'
  const header = root.querySelector(':scope > .poim-header')
  const text = slotOwn(root, 'text', nested)
  const media = slotOwn(root, 'media', nested)
  const quote = nested.find(el => el?.getAttribute('data-poim') === 'quote') ?? null
  const start = header ?? text ?? media
  if (!start)
    return
  start.before(embed)
  if (header)
    embed.append(header)
  if (text)
    embed.append(text)
  if (media)
    embed.append(media)
  if (quote && !quote.hidden)
    embed.append(quote)
}

function syncLead(card: HTMLElement, className: string, text: string | null, before: ChildNode | null): void {
  let row = card.querySelector(`:scope > .${className}`) as HTMLElement | null
  if (!text) {
    row?.remove()
    return
  }
  if (!row) {
    row = document.createElement('div')
    row.className = className
    card.insertBefore(row, before)
  }
  row.textContent = text
}

export function fillTemplate(root: HTMLElement, post: PoimPost, ctx: FillContext): void {
  const replyRoot = queryPoimSlot(root, 'reply')
  const quoteRoot = queryPoimSlot(root, 'quote')
  const nested = [replyRoot, quoteRoot]
  fillAuthorAndText(root, post, nested)

  const media = slotOwn(root, 'media', nested)
  if (media)
    fillMedia(media, post.media, ctx.mediaSrc)

  if (replyRoot) {
    const parent = parentForReply(post)
    if (!parent) {
      hide(replyRoot)
    }
    else {
      show(replyRoot)
      fillNested(replyRoot, parent, ctx)
    }
  }

  if (quoteRoot) {
    if (!post.quote) {
      hide(quoteRoot)
    }
    else {
      show(quoteRoot)
      fillNested(quoteRoot, post.quote, ctx)
    }
  }

  const header = root.querySelector(':scope > .poim-header')
  syncLead(
    root,
    'poim-repost',
    post.repostedBy
      ? `${post.repostedBy.name || formatHandle(post.repostedBy.handle)} 转发了`
      : null,
    replyRoot && !replyRoot.hidden ? replyRoot : header,
  )
  syncLead(root, 'poim-reply-to', null, null)

  if (post.repostedBy)
    wrapMainAsEmbed(root, nested)

  const metrics = queryPoimSlot(root, 'metrics')
  if (metrics) {
    if (ctx.showMetrics === false) {
      hide(metrics)
    }
    else {
      const m = post.metrics
      const parts: HTMLElement[] = []
      if (m?.replies != null)
        parts.push(metricEl('replies', m.replies, ICON_PATHS.replies))
      if (m?.retweets != null)
        parts.push(metricEl('reposts', m.retweets, ICON_PATHS.reposts))
      if (m?.likes != null)
        parts.push(metricEl('likes', m.likes, ICON_PATHS.likes))
      if (m?.views != null)
        parts.push(metricEl('views', m.views, ICON_PATHS.views))
      if (parts.length) {
        metrics.replaceChildren(...parts)
        show(metrics)
      }
      else {
        metrics.replaceChildren()
        hide(metrics)
      }
    }
  }

  const badge = queryPoimSlot(root, 'badge')
  if (badge) {
    badge.replaceChildren()
    // URL 来源永远显示来源行（不依赖 fetchedAt / showFetchedAt）；手填不制造来源标记。
    if (post.source === 'url') {
      badge.append(provenanceEl())
      // 时间戳是可选的附属子节点：showFetchedAt 只控制它，不控制来源行。
      if (post.fetchedAt && ctx.showFetchedAt !== false) {
        const time = document.createElement('time')
        time.className = 'poim-fetched-at'
        time.dateTime = post.fetchedAt
        time.textContent = formatIsoDate(post.fetchedAt)
        badge.append(time)
      }
      show(badge)
    }
    else {
      hide(badge)
    }
  }

  const brand = queryPoimSlot(root, 'brand')
  if (brand) {
    brand.textContent = 'poim'
    if (brand instanceof HTMLAnchorElement)
      brand.href = ctx.brandHref ?? '/'
  }

  const avatars = queryPoimSlots(root, 'author-avatar')
  for (const el of avatars) {
    if (el instanceof HTMLImageElement && el.src)
      el.src = ctx.mediaSrc(el.src)
  }
}
