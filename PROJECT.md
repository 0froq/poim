# poim

把各平台帖子转成**可嵌入卡片**（Web Component）和**同源图片**（PNG）的公开 util。

本文是 2026-08-15 grilling 后锁定的产品与架构合同。实现以本文为准；改合同先改本文。

参照站点：[0froq.github.io](https://0froq.github.io/)（同站 [froq.me](https://froq.me)，源码 [0froq/0froq.github.io](https://github.com/0froq/0froq.github.io)）。

---

## 1. 产品

- **谁用**：任何人打开即可用。无登录、无用户配额。早期不推广，按公开产品来建。
- **不是什么**：不是 AI 生成，不是官方 X widget 套壳，不是稳定热链 CDN。
- **两种输入**
  - **URL**：锁定手填区；卡片标记 `Fetched from X · {fetchedAt}`（不叫「认证」）。载荷签名校验留后期。
  - **手填**：无上述标记。
- **两种输出**
  - **Web Component 快照**（主交付）：自包含，嵌入页不强制回拉本站。
  - **PNG**：与当时预览 DOM **同一套卡片** 截图，不是平台截图、也不是第二套排版引擎（Satori）。
- **v1 平台**：只跑通 **X**。表单占位（disabled）：YouTube、Bilibili、小红书。贴非 X 链接 → 明确失败，不当手填。

帖子边界：单条 + 多图 + 视频/GIF + **一层引用**。不做整楼线程、不做 Articles。回复当普通单条。

失败：删除 / 私密 / 登录墙 → 失败态，不冒充已拉取。NSFW 仅在源数据有标记时遮罩。v1 不存 URL 历史。

---

## 2. 视觉：设计师自主，保留架构约束

应用壳与卡片**不强制继承 0froq.github.io 的样式**。设计师在品牌与技术边界内自由发挥视觉语言；个人站只作为可参考的基线之一，不是模板。

硬约束（架构性，不随视觉风格变化）：

| 维度 | 做法 |
| --- | --- |
| 浅深 | 浅深是独立维度，CSS 变量驱动；导出卡片冻死当时 `data-theme`，不跟嵌入页主题跑。 |
| embed | embed 只带卡片 token + 预设 CSS，不把应用壳/站点 CSS 无差别打进 embed。 |
| 圆角与风格 | 避免大圆角营销落地页、Inter/系统蓝按钮、iframe 式官方 X 皮。具体风格由设计师定。 |
| 动势 | 短过渡（~200ms 级）；浮层轻微倾角可用；尊重 `prefers-reduced-motion`。 |
| 布局 | 内容栏收住（个人站参考 `max-w-[800px]`）；生成器可略宽，不要全宽仪表盘。 |
| 字体与色板 | 由设计师建立一套自洽的字体与色板（含浅深两套），通过 `--poim-*` token 暴露。 |
| 浅深切换 | 应用壳浅深切换手感自定；与个人站一致更好，但不强制。 |

UnoCSS 习惯与个人站一致：`presetWind4`、attributify **`un-` 前缀**、`transformerDirectives` / `variantGroup`。

---

## 3. 卡片预设与自定义

浅深是**独立维度**（`:host[data-theme=light|dark]` 上的 CSS 变量），每个预设都能切。

**v1 四个预设**（同一 DOM 契约，换 HTML 模板 + CSS）：

| 预设 | 意向                                                                                             |
| ---- | ------------------------------------------------------------------------------------------------ |
| 普通 | 最接近个人站：纸色、衬线标题、虚线规则、灰阶。                                                   |
| 简洁 | 去纸纹与倾角，更少阴影，适合贴进长文。                                                           |
| 手绘 | Rough.js 在**生成器里**画 SVG，**写入快照**；嵌入页不加载 Rough.js。v1 就要上，不是纯 CSS 凑合。 |
| 人文 | 衬线主导、引用感、更松行距。                                                                     |

品牌向（Geist / Apple / Anthropic 神似）**二期**。对外名称不使用对方商标；不放对方 Logo。

叠层（已锁定）：

1. 预设 HTML 模板
2. 预设 CSS（**必须走** `--poim-*` 变量，以便浅深生效）
3. **用户 CSS 永远叠在最上面**（不 fork 预设；换预设不会自动清用户 CSS，若冲突由用户自己改）

用户可改 HTML 布局。槽位契约：

- 首选 `data-poim="<slot>"`；也认同名 `id`。
- **填入节点，不删标签。**
- 白名单：`author-name` `author-handle` `author-avatar` `time` `text` `media` `metrics` `quote` `badge` `brand`。
- `media` / `quote` 是**空容器**：生成器填真实媒体；引用递归缩小或放入 `quote` 容器；无引用则隐藏该节点。

HTML 消毒（DOMPurify 白名单）：`div/span/p/a/img/video/picture/source/h1-h3/ul/ol/li/blockquote/figure/figcaption/time/strong/em/br` + `data-poim` / `class` / `style`。禁 `script`、事件属性、`iframe`、`object`、`form`。`a[href]` 仅 `http(s)`。

用户 CSS：禁 `@import`；禁外部 `url()` 字体/图；`url()` 仅 data 或同源代理。动画允许；截 PNG 取当前帧。

编辑器：可视化 token（色、字体、圆角）+ 展开后 **lazy CodeMirror 6**（HTML / CSS 分 tab）。不上 Monaco 主包。

导出 WC：Shadow DOM 内写入消毒 HTML + 冻住的预设 CSS + 用户 CSS + 当时 `data-theme` + 规范 JSON。

---

## 4. 规范 Post JSON

```ts
type PoimPlatform = 'x' // v1；占位平台以后扩展

interface PoimPost {
  version: 1
  platform: PoimPlatform
  source: 'url' | 'manual'
  fetchedAt?: string // ISO，仅 URL
  canonicalUrl?: string
  id?: string
  author: {
    name: string
    handle: string
    avatar?: string
  }
  createdAt?: string
  text: string
  media: PoimMedia[]
  metrics?: {
    likes?: number
    retweets?: number
    replies?: number
    views?: number
  }
  quote?: PoimPost // 仅一层
}

interface PoimMedia {
  type: 'image' | 'video' | 'gif'
  url: string
  poster?: string
  width?: number
  height?: number
}
```

`metrics`：URL 拉取则带，手填可空。文本 v1 当纯文本保留换行；不做 hashtag/mention 富解析（URL 可当普通链接）。不要把整段 MP4 塞进 HTML。

---

## 5. 数据流与运行时

```
URL ──► Nitro /api/resolve ──► PoimPost
              │                    │
              │ FxEmbed 主         ▼
              │ syndication 备   Vue 预览（与导出同一渲染契约）
              │                    │
              └── 媒体代理 ──► 同源，避免 canvas 污染
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
                 poim-card      PNG 截图      原媒体下载
                 （无框架 WC）   （封面帧）     （MP4 as-is）
```

- **解析在服务端**，卡片在前端画。不接官方 X 付费 API（v1）。
- 第三方挂了要有明确失败态。
- **动图**：WC/预览 `<video loop muted autoplay playsinline>` 播原片；导出图是 PNG 封面；可下载原 MP4。v1 **不转码** GIF/WebP（贵且 X GIF 实为 MP4）。
- 生成期媒体走本站代理；快照里小图可内联或走本站 CDN URL。单图最长边约 1200、体积封顶。
- 嵌入物是快照，不是每次打开打 API。本站不做保证 SLA 的热链图床，但生成期必须能截图。

**双实现、一份契约**：站点预览用 Vue SFC；贴出去的 v1 WC **无 Vue runtime**。共同契约 = `PoimPost` + 槽位 DOM + `--poim-*` token。禁止让博客去加载 Nuxt。

---

## 6. 技术栈

- Nuxt + Vite + TypeScript；UnoCSS（与个人站同系）；pnpm；oQ 习惯（ESLint antfu、catalog 等）。
- 部署：**Cloudflare**（Pages/Workers + Nitro）。Workers 只做 `resolve` 与媒体代理；大媒体走 Cache/R2，不把 MP4 塞进 Worker 内存。
- PNG：`modern-screenshot` / `html-to-image` 截预览 DOM。
- Rough.js：仅生成器；输出 SVG 进快照。
- 宿主：应用壳可 SSR；embed 脚本是静态小包。

---

## 7. 明确不做（v1）

- iframe 作为主交付
- 无头浏览器截原站
- Satori 第二套版式当「同一张图」
- 用户配额 / 账号 / 生成历史
- 官方 X API
- 通用爬虫、登录墙平台（小红书等）做成「半支持」
- 整卡录制成 GIF/WebP
- 嵌入页加载 Rough.js / Vue / UnoCSS
- 预设名称冒充 Vercel/Apple/Anthropic 官方皮肤

---

## 8. 后期（有意识推迟）

- 载荷签名；徽章在验签失败时摘掉
- YouTube / Bilibili / 小红书真实现
- 品牌向预设
- 媒体转码为 GIF/WebP
- 线程展开
- 分享主题 URL、主题市场

---

## 9. 文档地位

| 文件                   | 用途                                   |
| ---------------------- | -------------------------------------- |
| `PROJECT.md`（本文件） | 产品 + 架构合同                        |
| 实现计划               | 开工前另写 `docs/plans/`，不替代本合同 |

改栈、改 v1 范围、改槽位白名单，先 PR 本文。
