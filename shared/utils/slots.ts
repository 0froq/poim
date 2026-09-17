const SLOT_NAMES = [
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
] as const

export type PoimSlotName = typeof SLOT_NAMES[number]

export function isPoimSlotName(value: string): value is PoimSlotName {
  return (SLOT_NAMES as readonly string[]).includes(value)
}

export function queryPoimSlots(root: ParentNode, name: PoimSlotName): HTMLElement[] {
  const found: HTMLElement[] = []
  root.querySelectorAll(`[data-poim="${name}"], #${CSS.escape(name)}`).forEach((node) => {
    if (node instanceof HTMLElement)
      found.push(node)
  })
  return found
}

export function queryPoimSlot(root: ParentNode, name: PoimSlotName): HTMLElement | null {
  return queryPoimSlots(root, name)[0] ?? null
}
