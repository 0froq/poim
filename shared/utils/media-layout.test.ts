import type { PoimMedia } from '../types/post'
import { describe, expect, it } from 'vitest'
import { MOSAIC_MAX, planMediaMosaic } from './media-layout'

function img(width: number, height: number): PoimMedia {
  return { type: 'image', url: 'x', width, height }
}

describe('planMediaMosaic', () => {
  it('零或一张：单图流，不锁高度（完整比例）', () => {
    expect(planMediaMosaic([], 597)).toMatchObject({ pattern: 'single', heightPx: null })
    expect(planMediaMosaic([img(1200, 2670)], 597)).toMatchObject({ pattern: 'single', heightPx: null, count: 1 })
  })

  it('超过四张只按四张规划', () => {
    const items = Array.from({ length: 6 }, () => img(800, 800))
    const plan = planMediaMosaic(items, 597)
    expect(plan.count).toBe(MOSAIC_MAX)
    expect(plan.pattern).toBe('grid2x2')
    expect(plan.heightPx).toBeGreaterThan(0)
  })

  it('两张横排共享高度，竖图不会把行高撑破上限', () => {
    const plan = planMediaMosaic([img(1200, 675), img(720, 1600)], 597)
    expect(plan.pattern).toBe('row2')
    expect(plan.heightPx).toBeLessThanOrEqual(340)
    expect(plan.heightPx).toBeGreaterThanOrEqual(140)
  })

  it('三张：左大右两叠，高度来自左图比例并夹紧', () => {
    const wide = planMediaMosaic([img(1600, 900), img(800, 800), img(800, 800)], 597)
    const tall = planMediaMosaic([img(720, 1600), img(800, 800), img(800, 800)], 597)
    expect(wide.pattern).toBe('left-stack')
    expect(tall.pattern).toBe('left-stack')
    expect(wide.heightPx!).toBeLessThan(tall.heightPx!)
  })

  it('四张：2×2，不用横滑一行', () => {
    const plan = planMediaMosaic([img(800, 800), img(800, 600), img(600, 800), img(1200, 800)], 597)
    expect(plan.pattern).toBe('grid2x2')
    expect(plan.heightPx).toBeGreaterThan(200)
  })
})
