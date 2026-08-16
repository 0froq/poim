import { describe, expect, it } from 'vitest'
import { formatIsoDate, formatIsoDateTime } from './format-date'

describe('formatIsoDate', () => {
  it('从 ISO 字符串取 YYYY-MM-DD，不依赖时区', () => {
    expect(formatIsoDate('2026-08-15T10:00:00Z')).toBe('2026-08-15')
    expect(formatIsoDate('2026-08-15T10:00:00+08:00')).toBe('2026-08-15')
    expect(formatIsoDate('2026-01-02T00:00:00Z')).toBe('2026-01-02')
  })

  it('只有日期部分也成立', () => {
    expect(formatIsoDate('2026-08-15')).toBe('2026-08-15')
  })

  it('空值返回空串', () => {
    expect(formatIsoDate()).toBe('')
    expect(formatIsoDate('')).toBe('')
  })

  it('非标准串回退到 UTC 字段，再回退原样', () => {
    // '2026/08/15' 能被 Date 解析（本地时区），结果依赖运行环境时区——不作为断言对象；
    // 用 Date 明确解析失败的串验证「回退原样」路径。
    expect(formatIsoDate('2026-13-99')).toBe('2026-13-99')
    expect(formatIsoDate('not-a-date')).toBe('not-a-date')
  })
})

describe('formatIsoDateTime', () => {
  it('iSO 带时间时输出 YYYY-MM-DD HH:mm', () => {
    expect(formatIsoDateTime('2026-08-15T10:00:00Z')).toBe('2026-08-15 10:00')
    expect(formatIsoDateTime('2026-08-15T10:05:00+08:00')).toBe('2026-08-15 10:05')
  })

  it('无时间部分时退化为纯日期', () => {
    expect(formatIsoDateTime('2026-08-15')).toBe('2026-08-15')
  })

  it('空值返回空串', () => {
    expect(formatIsoDateTime()).toBe('')
    expect(formatIsoDateTime('')).toBe('')
  })
})
