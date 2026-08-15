# 应用壳设计（v1）：纸与墨（Paper & Ink）

> 设计师记录：为什么这么选。实现以 `app/assets/css/tokens.css`、`app/assets/css/main.css` 与组件为准；本文件记录决策与取舍，改设计先改这里再改代码。RE-10。

## 0. 立场

卡片是纸（见 `docs/design/presets.md`：帖子是纸，卡片是纸片）。那么应用壳就是**纸工坊**——一张工作台：纸在这里被选平台、被填内容、被换预设、最后盖印（导出）。壳的职责是让「做卡片」这件事有手感和秩序，而不是让页面像博客或仪表盘。

froQ 2026-08-15 指示：不强制继承 0froq.github.io 的样式。个人站是博客语言：横线纸背景、虚线安静链接、衬线斜体小字、通栏居中。poim 是工具，**三处明确切割**：

| 个人站（博客）                          | poim（工坊）                                         | 理由                                               |
| --------------------------------------- | ---------------------------------------------------- | -------------------------------------------------- |
| 横线纸背景（`bg-lined-paper.svg` mask） | 无纹理纸面 + 预览台面点阵坐标纸                      | 台面是「放卡片的桌子」，不是笔记本纸               |
| 虚线链接 / 衬线斜体按钮                 | 发丝线按钮 + 墨块主按钮                              | 工具的手感，不是批注                               |
| 组件里硬编码 stone 色 + `dark:` 变体    | 全部 `--poim-*` token，根上翻转，组件零 `dark:` 变体 | token 是浅深独立维度的载体，也是壳与卡片共用的语言 |

## 1. 视觉语言

### 1.1 纸与墨

- 页面是**纸**：暖灰 `#f3f1ec`（比个人站 stone-100 更暖），不是中性灰的工具感。
- 正文是**墨**：近黑暖色 `#211d17`，发丝线 `#e2dccf` 是唯一的结构线。
- 深色是同一轴上的反向：暖黑纸 `#14110d`、暖白墨 `#eae4d8`。浅深都在 stone 暖轴上移动，任何时刻切换都不跳色。

### 1.2 封蜡：唯一强调色

- 琥珀/赭 `--poim-accent`（浅 `#8a5d12`，深 `#d6a84f`）——像信封上的蜡封印记。
- **只用于交互语义**：focus ring、激活 tab 下划线、选中态、主按钮 hover、编辑器光标。
- 卡片预设保持灰阶（色彩留给用户 CSS 层，见 presets.md §5），壳的强调色不进卡片。壳与卡片互不污染。

### 1.3 形状与手感

- 圆角恒为 `2px`（`--poim-radius`）：方角是图纸/工具的语言，不做大圆角营销落地页。
- 按钮按压 `translateY(1px)`、hover 只换发丝线/墨/封蜡色，无缩放弹跳。
- 所有过渡 `200ms`（`--poim-tick`）。

## 2. Shell token 体系

定义在 `app/assets/css/tokens.css`，`:root` / `:root.dark` 两套：

| token                | 浅                     | 深                      | 语义                         |
| -------------------- | ---------------------- | ----------------------- | ---------------------------- |
| `--poim-bg`          | `#f3f1ec`              | `#14110d`               | 页面纸面                     |
| `--poim-surface`     | `#faf8f3`              | `#1c1813`               | 面板衬底（编辑器、预览面板） |
| `--poim-fg`          | `#211d17`              | `#eae4d8`               | 墨：正文/主文字              |
| `--poim-muted`       | `#6f685d`              | `#a89f8f`               | 次级文字                     |
| `--poim-faint`       | `#a49c8e`              | `#6d665a`               | 提示/禁用                    |
| `--poim-line`        | `#e2dccf`              | `#332d24`               | 发丝线                       |
| `--poim-line-strong` | `#cfc7b6`              | `#4a4235`               | 发丝线 hover                 |
| `--poim-accent`      | `#8a5d12`              | `#d6a84f`               | 封蜡（唯一强调色）           |
| `--poim-accent-soft` | `rgb(138 93 18 / .14)` | `rgb(214 168 79 / .22)` | 选中/activeLine 底色         |
| `--poim-danger`      | `#a1362b`              | `#dd8a7c`               | 失败态文字                   |
| `--poim-serif`       | EB Garamond            | 同                      | wordmark / 页面 H1           |
| `--poim-sans`        | Instrument Sans        | 同                      | UI 与表单                    |
| `--poim-mono`        | LXGW Bright Code TC    | 同                      | URL 输入与编辑器             |
| `--poim-radius`      | `2px`                  | 同                      | 圆角                         |
| `--poim-tick`        | `200ms`                | 同                      | 过渡时长                     |

与卡片 token（作用域在 `.poim-stage` / `:host`，`shared/utils/presets.ts`）**同名不同域**：壳 token 只存在于站点根，embed 只打包卡片 token + 预设 CSS，壳 token 不会泄漏进 embed（PROJECT.md 第 2 节硬约束）。

**落地方式**：`uno.config.ts` `theme.colors` 把语义名映射到 token（`ink/muted/faint/line/line-strong/surface/accent/danger/paper`），组件写 `un-text-ink`、`un-border-line`、`un-bg-surface` 即可，**不再写 `dark:` 变体**——浅深由根翻转。

## 3. 字体

- **EB Garamond**：wordmark 与页面 H1——与卡片衬线标题同一声部，壳与卡片同源。
- **Instrument Sans**：UI 13–15px、表单、按钮。
- **LXGW Bright Code TC**（等宽）：URL 输入与编辑器。URL 是机器文本，等宽输入暗示「这是一段可解析的地址」，而不是普通文本。
- 全部经 `--poim-serif/sans/mono` 暴露，可整体替换。

## 4. 组件与布局

### 4.1 页面结构（生成器）

```
┌─ page-content (max-w 1024px, mx-auto) ─────────────────┐
│ AppHeader：poim-mark + wordmark       帖子→卡片  [浅/深] │
│ ┌─ grid (md: 25rem 1fr, gap 10) ─────────────────────┐ │
│ │ 左栏（表单，可滚动）      │ 右栏（预览台面）          │ │
│ │  H1 + 引导语             │  poim-panel              │ │
│ │  PlatformTabs            │   └ stage-frame（点阵）   │ │
│ │  URL（mono 输入）         │     └ poim-stage（卡片）  │ │
│ │  手填 fieldset            │  「预览即导出」注脚        │ │
│ │  卡片设置（预设/主题/品牌） │  导出栏：复制/PNG/原视频   │ │
│ │  高级：HTML/CSS 编辑器     │  （md: sticky top-6）    │ │
│ └────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

- 内容列 `max-w-[1024px]`（生成器略宽于个人站 800 参考线，合同允许）；左栏固定 `25rem` 宽，右栏弹性——卡片有呼吸空间，不是全宽仪表盘。
- 右栏 `md:sticky top-6`：编辑长表单时预览始终在场，这是生成器的关键手感。

### 4.2 AppHeader

- **wordmark**：Garamond「poim」+ 一个倾斜 8° 的封蜡色小方块（`poim-mark`，卡片的隐喻：一张立起来的纸片）。零图片资源，纯 CSS。
- 右侧：衬线斜体 tagline「帖子 → 卡片」+ 主题切换按钮（发丝线按钮，sun/moon 图标 + 目标主题文字，`aria-label` 完整）。

### 4.3 平台 tab（PlatformTabs）

- 发丝线 tab 栏：激活 = 墨色文字 + 2px 封蜡下划线（`poim-tab--active`）；未激活 = muted；disabled = faint + 「即将支持」小标签（`poim-tag`）。
- 为什么不是虚线链接：tab 是「模式选择」控件，博客的虚线安静链接没有「选中」语义；发丝线 tab 栏是工具的语言。

### 4.4 表单

- 输入框（`poim-field`）：透明底 + **实线**发丝线下划线（虚线留给卡片），focus 下划线变封蜡。标签（`poim-label`）小号大写字母距（11px / 0.12em）。
- URL 输入（`poim-field--mono`）等宽；错误态 `un-text-danger`。
- 手填 `fieldset`：保留 `disabled` 语义（URL 拉取后锁定），视觉上是纸面表单——无边框盒子，只有下划线与一行标签。

### 4.5 卡片设置与编辑器外围

- 「卡片」设置簇：预设（普通/简洁/人文）+ 卡片主题（浅/深）+ 品牌显隐，都是 `poim-btn`，选中态 `poim-btn--active`（封蜡描边）。
- 高级编辑器：`poim-panel`（surface 衬底 + 发丝线）+ 复用 `poim-tabs` 的 HTML/CSS 切换 + lazy CodeMirror。编辑器外壳用 token 定制：浅色走纸面主题（`--poim-surface` 底、`--poim-mono`、封蜡光标/选区），深色用 oneDark；**跟随壳主题**（切换时重建 view）。

### 4.6 预览台面与导出

- `poim-panel` 内嵌 `stage-frame`：点阵坐标纸（`radial-gradient` 1px 点，22px 网格），卡片浮在其上——普通预设的倾角与软阴影在此有舞台。
- 面板注脚：「预览即导出 · PNG 为当前帧」。
- 导出栏：**复制 Web Component = 墨块按钮**（hover 变封蜡色——盖印隐喻），下载 PNG = 发丝线按钮，下载原视频 = 幽灵文字按钮。主次分明：复制是主交付。

### 4.7 Engineer 落地清单（结构建议）

1. 从 `index.vue` 抽出 `PlatformTabs.vue`（props：`items`、`modelValue`；emit 切换；含 disabled/tag 态）。
2. 抽出 `CardControls.vue`（预设/主题/品牌），或至少把「卡片」设置簇与表单分离成独立 section。
3. 抽出 `ExportBar.vue`（复制/PNG/原视频，接收 `copied`/`hasMotion`）。
4. 预览面板可抽 `StagePanel.vue`（panel + stage-frame + 注脚），`CardPreview` 保持纯渲染。
5. 表单字段样式已收敛为 `poim-field` / `poim-textarea` / `poim-label` 类，不需要抽组件；若做可视化 token 编辑器（RE-9），这些类可直接复用。
6. 保持 `page-content` 共享（header + 页面同宽），不要给生成器单独一套容器。

## 5. 浅深切换手感

- 保留圆形「感染」View Transition（已是 poim 的一部分，逻辑在 `useThemeToggle.ts`），但 **520ms → 240ms**——合同要求短过渡（~200ms 级）。
- `prefers-reduced-motion`：JS 侧直接降级为无过渡切换，CSS 侧全局过渡归零（`main.css` 末尾）。
- 编辑器跟随壳主题（重建 CM view）；卡片主题（`gen.theme`）是独立维度，不受壳切换影响——这正是浅深独立维度的展示。

## 6. 动势

- 全部 `200ms`（`--poim-tick`）；hover 只变发丝线/墨/封蜡，active 按压 1px；无缩放弹跳、无大圆角、无系统蓝。
- 编辑器/预览无动画；倾角只属于卡片（静态），壳不引入装饰性动画。

## 7. 已知取舍

- **mono URL 输入**可能让非技术用户困惑 → v1 目标用户是开发者（要贴 embed 代码的人），mono 反而是信号；placeholder 已解释。
- **sticky 预览**：`md` 以下不启用，小屏回到自然流。
- **编辑器跟随主题 = 重建 view**：切换瞬间有极短暂闪烁，可接受；RE-9 可改为 theme 扩展热替换，这里不阻塞。
- **点阵台面深色下几乎不可见**（`#332d24` 的 1px 点）：刻意——深色台面应退后，卡片是主角。
- **去掉横线纸背景**：页面纹理归零，靠发丝线/点阵/字体建立层次。深色模式下纹理本来就不可见，浅色下点阵只在台面出现，避免双纹理打架。
