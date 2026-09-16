import type { PoimAuthor, PoimMedia, PoimPost } from '../types/post'
import { emptyPost } from '../utils/empty-post'

export interface CardCase {
  id: string
  title: string
  note: string
  post: PoimPost
}

function swatch(label: string, width: number, height: number): string {
  const palette = ['#d7c4a8', '#9aa78a', '#8aa0b3', '#c48a6a', '#b7a1c2', '#8fb8ae']
  const fill = palette[Math.abs(label.length + width) % palette.length]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="${fill}"/><text x="50%" y="50%" fill="#1c1917" font-size="${Math.min(width, height) / 9}" text-anchor="middle" dominant-baseline="middle">${label} ${width}×${height}</text></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function avatar(label: string): string {
  return swatch(label, 128, 128)
}

const AUTHORS = {
  snail: { name: '蜗牛King', handle: 'isnail', avatar: avatar('snail') } satisfies PoimAuthor,
  hr: { name: '荆女士', handle: 'miha_hr', avatar: avatar('hr') } satisfies PoimAuthor,
  walker: { name: '路人甲', handle: 'walker', avatar: avatar('wk') } satisfies PoimAuthor,
} as const

function pics(kind: 'land' | 'port' | 'mix', count: number): PoimMedia[] {
  return Array.from({ length: count }, (_, i) => {
    const portrait = kind === 'port' || (kind === 'mix' && i % 2 === 1)
    const width = portrait ? 720 : 1200
    const height = portrait ? 1600 : 675
    return {
      type: 'image' as const,
      url: swatch(`${kind}${i + 1}`, width, height),
      width,
      height,
    }
  })
}

function base(author: PoimAuthor, text: string): PoimPost {
  const post = emptyPost()
  post.source = 'url'
  post.fetchedAt = '2026-09-16T10:00:00Z'
  post.createdAt = '2026-09-16T07:33:00Z'
  post.author = { ...author }
  post.text = text
  post.metrics = { replies: 6, retweets: 0, likes: 4, views: 2700 }
  return post
}

function quoted(author: PoimAuthor, text: string, media: PoimMedia[] = []): PoimPost {
  const post = emptyPost()
  post.author = { ...author }
  post.text = text
  post.media = media
  post.createdAt = '2026-09-15T12:00:00Z'
  return post
}

export const CARD_CASES: CardCase[] = [
  {
    id: 'post-text',
    title: '原创 · 无图',
    note: '基准：只有主帖作者头栏。',
    post: base(AUTHORS.snail, '纯文字原创，没有媒体、没有引用。'),
  },
  {
    id: 'post-1-land',
    title: '原创 · 1 张横图',
    note: '单图 contain，按原比例。',
    post: Object.assign(base(AUTHORS.snail, '一条横图。'), { media: pics('land', 1) }),
  },
  {
    id: 'post-1-port',
    title: '原创 · 1 张竖长图',
    note: '对照砍高问题：竖图应完整。',
    post: Object.assign(base(AUTHORS.snail, '一条竖长截图。'), { media: pics('port', 1) }),
  },
  {
    id: 'post-2',
    title: '原创 · 2 图',
    note: '双宫格 cover。',
    post: Object.assign(base(AUTHORS.snail, '两张图。'), { media: pics('mix', 2) }),
  },
  {
    id: 'post-3',
    title: '原创 · 3 图',
    note: '上 1 下 2。',
    post: Object.assign(base(AUTHORS.snail, '三张图。'), { media: pics('mix', 3) }),
  },
  {
    id: 'post-4',
    title: '原创 · 4 图',
    note: '2×2 宫格。',
    post: Object.assign(base(AUTHORS.snail, '四张图。'), { media: pics('mix', 4) }),
  },
  {
    id: 'post-no-avatar',
    title: '原创 · 无头像',
    note: '主帖头像槽隐藏，名字/handle 仍在。',
    post: base({ name: '无名', handle: 'anon' }, '作者没有头像。'),
  },
  {
    id: 'reply-text',
    title: '回复 · 无图',
    note: '头栏下方「回复 @handle」，作者头栏仍是回复者。',
    post: Object.assign(base(AUTHORS.walker, '同意，而且更糟。'), { replyToHandle: AUTHORS.snail.handle }),
  },
  {
    id: 'reply-1',
    title: '回复 · 自己 1 图',
    note: '回复行 + 回复者头栏 + 自己的图。',
    post: Object.assign(base(AUTHORS.walker, '配一张图回。'), {
      replyToHandle: AUTHORS.snail.handle,
      media: pics('land', 1),
    }),
  },
  {
    id: 'repost-text',
    title: '转发 · 无图',
    note: '顶栏「Name 转发了」，头栏是原作者。',
    post: Object.assign(base(AUTHORS.snail, '被转发的原文。'), { repostedBy: AUTHORS.walker }),
  },
  {
    id: 'repost-1',
    title: '转发 · 原帖 1 图',
    note: '转发行不套第二套头像样式。',
    post: Object.assign(base(AUTHORS.hr, '招聘原文。'), {
      repostedBy: AUTHORS.snail,
      media: pics('port', 1),
    }),
  },
  {
    id: 'quote-text',
    title: '引用 · 双方无图',
    note: '引用头栏应与主帖同一套 avatar/name/handle。',
    post: Object.assign(base(AUTHORS.snail, '看这条。'), {
      quote: quoted(AUTHORS.hr, '游戏 UI 设计师月薪 2-3K？'),
    }),
  },
  {
    id: 'quote-parent-port',
    title: '引用 · 父级竖图 / 自己无图',
    note: '引用内单图完整显示。',
    post: Object.assign(base(AUTHORS.snail, '这图太长了。'), {
      quote: quoted(AUTHORS.hr, '职位详情', pics('port', 1)),
    }),
  },
  {
    id: 'quote-self-land',
    title: '引用 · 自己横图 / 父级无图',
    note: '主帖媒体在引用块之上。',
    post: Object.assign(base(AUTHORS.snail, '我补一张。'), {
      media: pics('land', 1),
      quote: quoted(AUTHORS.hr, '只有文字的原帖。'),
    }),
  },
  {
    id: 'quote-both-1',
    title: '引用 · 双方各 1 图',
    note: '两套头栏、两套单图，样式应对齐。',
    post: Object.assign(base(AUTHORS.snail, '对比一下。'), {
      media: pics('land', 1),
      quote: quoted(AUTHORS.hr, '原图', pics('port', 1)),
    }),
  },
  {
    id: 'quote-2-1',
    title: '引用 · 自己 2 图 / 父级 1 图',
    note: '宫格 vs 单图。',
    post: Object.assign(base(AUTHORS.snail, '两张回应。'), {
      media: pics('mix', 2),
      quote: quoted(AUTHORS.hr, '原图一张', pics('land', 1)),
    }),
  },
  {
    id: 'quote-0-4',
    title: '引用 · 自己无图 / 父级 4 图',
    note: '引用内 2×2。',
    post: Object.assign(base(AUTHORS.walker, '全是图。'), {
      quote: quoted(AUTHORS.snail, '四宫格原帖', pics('mix', 4)),
    }),
  },
  {
    id: 'quote-no-avatar',
    title: '引用 · 被引用作者无头像',
    note: '引用头像隐藏，name/handle 仍块级排列。',
    post: Object.assign(base(AUTHORS.snail, '引用一个没头像的人。'), {
      quote: quoted({ name: '隐身', handle: 'ghost' }, '没有头像的引用。'),
    }),
  },
  {
    id: 'reply-quote-media',
    title: '回复 + 引用 · 双方有图',
    note: '回复行 + 主头栏 + 主图 + 引用头栏/图。',
    post: Object.assign(base(AUTHORS.walker, '回在引用下面。'), {
      replyToHandle: AUTHORS.snail.handle,
      media: pics('land', 1),
      quote: quoted(AUTHORS.hr, '被引的招聘', pics('port', 1)),
    }),
  },
  {
    id: 'repost-quote',
    title: '转发 + 引用 · 父级 2 图',
    note: '转发行 + 原作者头栏 + 引用。',
    post: Object.assign(base(AUTHORS.snail, '转发这条引用。'), {
      repostedBy: AUTHORS.walker,
      quote: quoted(AUTHORS.hr, '两张配图', pics('mix', 2)),
    }),
  },
]
