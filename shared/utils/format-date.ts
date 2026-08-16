// 稳定国际日期格式（卡片 metadata 路径唯一入口，PROJECT.md §3）：
// `YYYY-MM-DD`，必要时 `YYYY-MM-DD HH:mm`。不输出中文年月日。
// 直接从 ISO 字符串取字段，避免 Date/时区换算造成嵌入页与预览间漂移；
// 非标准串回退到 UTC 字段，再回退原样。

export function formatIsoDate(iso?: string): string {
  if (!iso)
    return ''
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (m)
    return `${m[1]}-${m[2]}-${m[3]}`
  const date = new Date(iso)
  if (Number.isNaN(date.getTime()))
    return iso
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}

export function formatIsoDateTime(iso?: string): string {
  const datePart = formatIsoDate(iso)
  if (!datePart || !iso)
    return datePart
  const t = /T(\d{2}):(\d{2})/.exec(iso)
  // 只有 ISO 明确带时间部分才输出 HH:mm；纯日期串不猜时间（避免 00:00 噪音与时区漂移）
  if (t)
    return `${datePart} ${t[1]}:${t[2]}`
  return datePart
}
