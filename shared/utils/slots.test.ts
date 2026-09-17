import { describe, expect, it } from 'vitest'
import { isPoimSlotName, queryPoimSlot, queryPoimSlots } from './slots'

describe('槽位白名单', () => {
  it('仅允许合同白名单槽位名', () => {
    const allowed = [
      'author-name',
      'author-handle',
      'author-avatar',
      'time',
      'text',
      'media',
      'metrics',
      'reply',
      'quote',
      'badge',
      'brand',
    ]
    for (const name of allowed)
      expect(isPoimSlotName(name), name).toBe(true)
    expect(isPoimSlotName('payload')).toBe(false)
    expect(isPoimSlotName('author')).toBe(false)
    expect(isPoimSlotName('')).toBe(false)
  })

  it('data-poim 与同名 id 都能查到', () => {
    document.body.innerHTML = `
      <div data-poim="text">a</div>
      <div id="author-name">b</div>
    `
    expect(queryPoimSlot(document.body, 'text')?.textContent).toBe('a')
    expect(queryPoimSlots(document.body, 'author-name').length).toBe(1)
  })
})
