import type { PoimMedia } from '../types/post'

/** X 最多四图。PNG / WC 是静态快照，不能学时间线做横滑，所以四图改拼图。 */
export const MOSAIC_MAX = 4
export const MOSAIC_GAP_PX = 6
/** 卡片 640px − 左右 padding 1.35rem。 */
export const CARD_MEDIA_WIDTH_PX = 597
export const EMBED_MEDIA_WIDTH_PX = 570
const MOSAIC_MIN_H = 140
const MOSAIC_MAX_H = 340

export type MosaicPattern = 'single' | 'row2' | 'left-stack' | 'grid2x2'

export interface MosaicPlan {
  count: number
  pattern: MosaicPattern
  /** 单图不锁高度（height:auto）。多图给拼图一个共享盒高，格内 cover。 */
  heightPx: number | null
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

function aspect(item: PoimMedia): number {
  if (item.width && item.height && item.height > 0)
    return item.width / item.height
  return 1
}

export function planMediaMosaic(items: PoimMedia[], innerWidth: number): MosaicPlan {
  const media = items.slice(0, MOSAIC_MAX)
  const n = media.length
  if (n <= 1)
    return { count: n, pattern: 'single', heightPx: null }

  const width = Math.max(innerWidth, 160)

  if (n === 2) {
    const col = (width - MOSAIC_GAP_PX) / 2
    const naturals = media.map(item => col / aspect(item))
    const h = clamp(Math.sqrt(naturals[0]! * naturals[1]!), MOSAIC_MIN_H, MOSAIC_MAX_H)
    return { count: 2, pattern: 'row2', heightPx: Math.round(h) }
  }

  if (n === 3) {
    const leftW = (width - MOSAIC_GAP_PX) * 0.55
    const h = clamp(leftW / aspect(media[0]!), MOSAIC_MIN_H * 1.35, MOSAIC_MAX_H)
    return { count: 3, pattern: 'left-stack', heightPx: Math.round(h) }
  }

  const cell = (width - MOSAIC_GAP_PX) / 2
  const h = clamp(cell * 2 + MOSAIC_GAP_PX, MOSAIC_MIN_H * 1.6, MOSAIC_MAX_H + 40)
  return { count: 4, pattern: 'grid2x2', heightPx: Math.round(h) }
}

export function mosaicInnerWidth(container: HTMLElement): number {
  if (container.closest('.poim-quote, .poim-embed'))
    return EMBED_MEDIA_WIDTH_PX
  return CARD_MEDIA_WIDTH_PX
}

export function applyMediaMosaic(container: HTMLElement, items: PoimMedia[]): void {
  const plan = planMediaMosaic(items, mosaicInnerWidth(container))
  container.dataset.mosaic = plan.pattern
  switch (plan.pattern) {
    case 'single':
      container.style.removeProperty('--poim-mosaic-h')
      break
    case 'row2':
    case 'left-stack':
    case 'grid2x2':
      container.style.setProperty('--poim-mosaic-h', `${plan.heightPx}px`)
      break
    default: {
      const _never: never = plan.pattern
      throw new Error(`unhandled mosaic: ${_never}`)
    }
  }
}
