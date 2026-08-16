import type { PoimMedia, PoimPost } from '../types/post'
import { formatHandle } from './parse-x-url'
import { queryPoimSlot, queryPoimSlots } from './slots'

export interface FillContext {
  mediaSrc: (url: string) => string
  brandHref?: string
  // 元信息显示开关（默认开启 = 与产品现状一致；手填无 fetchedAt 时永远不制造标记）
  showMetrics?: boolean
  showFetchedAt?: boolean
}

function hide(el: HTMLElement): void {
  el.hidden = true
}

function show(el: HTMLElement): void {
  el.hidden = false
}

function isInsideQuote(el: Element, quoteRoot: Element | null): boolean {
  if (!quoteRoot)
    return false
  return quoteRoot.contains(el) && el !== quoteRoot
}

function formatTime(iso?: string): string {
  if (!iso)
    return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime()))
    return iso
  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
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

function renderMedia(container: HTMLElement, media: PoimMedia[], mediaSrc: (url: string) => string): void {
  container.replaceChildren()
  container.dataset.count = String(media.length)
  for (const item of media) {
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

function fillAuthorAndText(scope: ParentNode, post: PoimPost, quoteRoot: HTMLElement | null): void {
  for (const el of queryPoimSlots(scope, 'author-name')) {
    if (isInsideQuote(el, quoteRoot))
      continue
    el.textContent = post.author.name
  }
  for (const el of queryPoimSlots(scope, 'author-handle')) {
    if (isInsideQuote(el, quoteRoot))
      continue
    el.textContent = formatHandle(post.author.handle)
  }
  for (const el of queryPoimSlots(scope, 'author-avatar')) {
    if (isInsideQuote(el, quoteRoot))
      continue
    if (el instanceof HTMLImageElement) {
      if (post.author.avatar)
        el.src = post.author.avatar
      else
        hide(el)
    }
  }
  for (const el of queryPoimSlots(scope, 'text')) {
    if (isInsideQuote(el, quoteRoot))
      continue
    el.textContent = post.text
  }
  for (const el of queryPoimSlots(scope, 'time')) {
    if (isInsideQuote(el, quoteRoot))
      continue
    const label = formatTime(post.createdAt)
    el.textContent = label
    if (el instanceof HTMLTimeElement && post.createdAt)
      el.dateTime = post.createdAt
  }
}

export function fillTemplate(root: HTMLElement, post: PoimPost, ctx: FillContext): void {
  const quoteRoot = queryPoimSlot(root, 'quote')
  fillAuthorAndText(root, post, quoteRoot)

  const media = queryPoimSlot(root, 'media')
  if (media) {
    if (!post.media.length) {
      hide(media)
    }
    else {
      renderMedia(media, post.media.map(item => ({
        ...item,
        url: ctx.mediaSrc(item.url),
        poster: item.poster ? ctx.mediaSrc(item.poster) : undefined,
      })), url => url)
    }
  }

  const metrics = queryPoimSlot(root, 'metrics')
  if (metrics) {
    const parts = [
      post.metrics?.replies != null ? `回复 ${formatCount(post.metrics.replies)}` : '',
      post.metrics?.retweets != null ? `转帖 ${formatCount(post.metrics.retweets)}` : '',
      post.metrics?.likes != null ? `喜欢 ${formatCount(post.metrics.likes)}` : '',
      post.metrics?.views != null ? `浏览 ${formatCount(post.metrics.views)}` : '',
    ].filter(Boolean)
    if (ctx.showMetrics === false || !parts.length)
      hide(metrics)
    else
      metrics.textContent = parts.join(' · ')
  }

  const badge = queryPoimSlot(root, 'badge')
  if (badge) {
    // 只有 URL 来源且确有 fetchedAt 才显示抓取时间；手填或缺失时开关不制造空白/伪标记
    const showBadge = ctx.showFetchedAt !== false && post.source === 'url' && Boolean(post.fetchedAt)
    if (showBadge) {
      badge.textContent = `Fetched from X · ${formatTime(post.fetchedAt)}`
      show(badge)
    }
    else {
      badge.textContent = ''
      hide(badge)
    }
  }

  const brand = queryPoimSlot(root, 'brand')
  if (brand) {
    brand.textContent = 'poim'
    if (brand instanceof HTMLAnchorElement)
      brand.href = ctx.brandHref ?? '/'
  }

  if (quoteRoot) {
    if (!post.quote) {
      hide(quoteRoot)
    }
    else {
      show(quoteRoot)
      fillAuthorAndText(quoteRoot, post.quote, null)
    }
  }

  const avatars = queryPoimSlots(root, 'author-avatar')
  for (const el of avatars) {
    if (el instanceof HTMLImageElement && el.src)
      el.src = ctx.mediaSrc(el.src)
  }
}
