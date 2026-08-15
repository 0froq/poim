import rough from 'roughjs'

export function decorateRough(card: HTMLElement): void {
  card.querySelectorAll('svg.poim-rough').forEach(node => node.remove())
  const width = Math.max(card.offsetWidth, 320)
  const height = Math.max(card.offsetHeight, 120)
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('class', 'poim-rough')
  svg.setAttribute('width', String(width))
  svg.setAttribute('height', String(height))
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
  const rc = rough.svg(svg)
  const node = rc.rectangle(3, 3, width - 6, height - 6, {
    roughness: 1.35,
    bowing: 1.1,
    stroke: 'currentColor',
    strokeWidth: 1.2,
    fill: 'transparent',
  })
  svg.append(node)
  card.prepend(svg)
}
