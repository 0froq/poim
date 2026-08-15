// 用户 CSS：禁 @import；url() 仅 data: / 同源相对路径 / #，其余替换为 none。
export function sanitizeUserCss(input: string): string {
  let next = input.replace(/@import[^;]+;?/gi, '')
  next = next
    .replace(/expression\s*\([^)]*\)/gi, 'none')
    .replace(/javascript:/gi, '')

  return next.replace(/url\(([^)]*)\)/gi, (full, inner: string) => {
    const trimmed = inner.trim().replace(/^['"]|['"]$/g, '')
    if (trimmed.startsWith('data:') || trimmed.startsWith('/') || trimmed.startsWith('#'))
      return full
    return 'none'
  })
}
