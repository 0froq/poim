# poim

把各平台帖子转成**可嵌入卡片**（Web Component）和**同源图片**（PNG）的公开 util。

本文是 2026-08-15 grilling 后锁定的产品与架构合同。实现以本文为准；改合同先改本文。

### Kanban 任务命名

Hermes Kanban 的 `poim` board 是产品开发执行层，不属于研究项目。新建任务使用可读的内容标题（例如「导出画布边界验收」），**不使用 `RE-*` 前缀**，也不以 Multica 旧项目分类命名。历史 `RE-*` 卡仅作迁移审计记录，不追溯改名。

参照站点：[0froq.github.io](https://0froq.github.io/)（同站 [froq.me](https://froq.me)，源码 [0froq/0froq.github.io](https://github.com/0froq/0froq.github.io)）。

---

## 1. 产品

- **谁用**：任何人打开即可用。无登录、无用户配额。早期不推广，按公开产品来建。
- **不是什么**：不是 AI 生成，不是官方 X widget 套壳，不是稳定热链 CDN。
- **两种输入**
  - **URL**：锁定手填区；卡片始终标记 `Fetched from X`。抓取时间是可选附属信息：关闭显示时只隐藏时间戳，不隐藏来源标记。
  - **手填**：无上述来源标记。
- **两种输出**
  - **Web Component 快照**（主交付）：自包含，嵌入页不强制回拉本站。
  - **PNG**：与当时预览 DOM **同一套卡片** 截图，不是平台截图、也不是第二套排版引擎（Satori）。
- **v1 平台**：只跑通 **X**。表单占位（disabled）：YouTube、Bilibili、小红书。贴非 X 链接 → 明确失败，不当手填。

帖子边界：单条 + 多图 + 视频/GIF + **一层引用**。不做整楼线程、不做 Articles。回复当普通单条。

失败：删除 / 私密 / 登录墙 → 失败态，不冒充已拉取。NSFW 仅在源数据有标记时遮罩。v1 不存 URL 历史。

---

## 2. 视觉：设计师自主，保留架构约束

应用壳（生成器页面、导航、表单、编辑器外围）与卡片**都**由 Poim Designer 负责设计，**不强制继承 0froq.github.io 的样式**。设计师在品牌与技术边界内自由发挥视觉语言；个人站只作为可参考的基线之一，不是模板。

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

**v1 仅一个 preset：`default`**。

- `default` 是唯一的基础模板；原 `plain` / 「普通」迁移为 `default`，原 `minimal` / 「简洁」与 `humanist` / 「人文」彻底移除，不保留用户可选入口或兼容别名。
- 未来新增模板必须采用**可验证的设计系统语义**命名，而非抽象气质词：名称应指向其明确的规范来源/语言（例如基于 Cupertino、Material、Fluent 的实现特征），并在设计文档说明配色、圆角、分割线、字体和状态层的依据；不得使用「简洁」「人文」等模棱两可名称。

卡片 metadata 的显示原则：

- 平台 X 标识及 likes / replies / reposts / views 均使用无障碍文本标签的图标，不以可见自然语言作为主 UI；
- 发帖时间和抓取时间都用稳定的国际日期格式 `YYYY-MM-DD`（若显示时间可用 `YYYY-MM-DD HH:mm`），不出现中文年月日；
- URL 卡的 `Fetched from X` 来源行始终可见；`showFetchedAt` 仅控制其时间戳子节点；
- 预览/导出卡片 canvas 宽度固定为 **640px**。窄屏可让外层横向滚动或缩放，但不得把实际 card DOM 压缩得小于此宽度。

叠层（已锁定）：

1. 预设 HTML 模板
2. 预设 CSS（**必须走** `--poim-*` 变量，以便浅深生效）
3. **用户 CSS 永远叠在最上面**（不 fork 预设；换预设不会自动清用户 CSS，若冲突由用户自己改）

用户可改 HTML 布局。槽位契约：

- 首选 `data-poim="<slot>"`；也认同名 `id`。
- **填入节点，不删标签。**
- 白名单：`author-name` `author-handle` `author-avatar` `time` `text` `media` `metrics` `quote` `badge` `brand`。
- `media` / `quote` 是**空容器**：生成器填真实媒体；引用块内可再放一层 `media`（仍只一层引用，不递归引用的引用）；无引用则隐藏 quote。
- 回复 / 转发不是第二套作者头栏：`replyToHandle` 在头栏下写「回复 @handle」；`repostedBy` 在头栏上写「Name 转发了」。引用作者必须与主帖同一套 `.poim-header` + `.poim-avatar` + 块级 name/handle。

HTML 消毒（DOMPurify 白名单）：`div/span/p/a/img/video/picture/source/h1-h3/ul/ol/li/blockquote/figure/figcaption/time/strong/em/br` + `data-poim` / `class` / `style`。禁 `script`、事件属性、`iframe`、`object`、`form`。`a[href]` 仅 `http(s)`。

用户 CSS：禁 `@import`；禁外部 `url()` 字体/图；`url()` 仅 data 或同源代理。动画允许；截 PNG 取当前帧。

设置面板只保留与实际输出有关的控制（例如 metadata 显示开关与 HTML/CSS 编辑入口）；移除无效的「样式、色、字体、圆角」可视化 token 配置区域。

编辑器为 **lazy CodeMirror 6**（HTML / CSS 分 tab）。它必须在展开后可见、可输入、可切 tab；不上 Monaco 主包。

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
- Rough.js：v1 不用于卡片预设（手绘预设已移除）。
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
