# 卡片预设设计（v1）

> 设计师记录：为什么这么选。实现以 `app/assets/css/card/*.css`（预设 CSS 可编辑源）与 `shared/utils/presets.ts`（HTML 模板 + 组装）为准；本文件记录决策与取舍，改设计先改这里再改代码。

## 0. 立场

froQ 明确：不强制继承 0froq.github.io 的样式。本设计只把个人站的气质当作可选基线之一——纸色、衬线标题、虚线规则、灰阶——用来建立 poim 自己的视觉语言，而不是抄它。

poim 的产品直觉：**帖子是纸，卡片是纸片**。一个平台帖子被摘下来、做成可以贴进任意页面的东西，最诚实的隐喻是一张从笔记本撕下的纸。

## 1. `--poim-*` token 体系

浅深是独立维度：token 定义在 `:host[data-theme]` / `.poim-stage[data-theme]`，导出时冻死当时的 `data-theme`。预设 CSS **必须**走 token，不写死颜色。`app/assets/css/card/tokens.css` 是唯一颜色契约来源（RE-11 移除了可视化 token 编辑器，不重建第二份默认值）。

| token           | 浅              | 深        | 语义                        |
| --------------- | --------------- | --------- | --------------------------- |
| `--poim-bg`     | `#f5f5f4`       | `#0c0a09` | 舞台（页面/宿主底色）       |
| `--poim-card`   | `#fafaf9`       | `#1c1917` | 纸面                        |
| `--poim-fg`     | `#1c1917`       | `#e7e5e4` | 正文                        |
| `--poim-muted`  | `#78716c`       | `#a8a29e` | handle / 时间 / 指标        |
| `--poim-line`   | `#d6d3d1`       | `#44403c` | 规则线（虚线/实线）         |
| `--poim-serif`  | EB Garamond     | 同        | 标题与引用主体              |
| `--poim-sans`   | Instrument Sans | 同        | 正文与界面                  |
| `--poim-radius` | `0px`           | 同        | 圆角（卡片/头像/媒体/引用） |

选 stone 暖灰的理由：纸感需要暖灰，而不是冷灰的「工具感」或带饱和度的「营销感」；浅深两套在同一条 stone 轴上移动，保证任何预设切主题都不跳色。

## 2. 字体

- **EB Garamond**（衬线）：标题与引用主体。有文气、有字重对比，适合「摘录/引用」的产品气质。
- **Instrument Sans**（无衬线）：正文与界面。几何但带人文曲线，不是 Inter 那种系统蓝按钮的观感。
- 全部通过 token 暴露（用户 CSS 可整体替换字体栈）。

## 3. 单预设 `default`（RE-11）

**v1 仅一个 preset：`default`**（PROJECT.md §3）。原 `plain` / 「普通」迁移为 `default`；`minimal` / 「简洁」与 `humanist` / 「人文」彻底移除，不保留用户可选入口或兼容别名。

`default` 的产品默认气质：

- 双纸层：卡片 `--poim-card` 浮在舞台 `--poim-bg` 上。
- 衬线标题：作者名用 Garamond，正文保持无衬线——「文首」感，而不是通篇衬线的书卷气。
- 虚线规则：footer 上边框、引用框、brand 下划线全部虚线；这是纸面批注的语言。
- 灰阶全系，零彩色。
- 双阴影（1px 接触阴影 + 大半径软影）：纸片「浮起」的体量感。
- **卡片几何平整（2026-08-16 收紧）**：v1 不得对卡片本体使用 `rotate` / `transform: rotate(...)` 或等价倾斜。纸张、规则线、阴影等设计语言保留，倾角删除——纸片立起的效果由阴影单独承担。

**卡片 canvas 宽度固定 640px**：预览 / WC / PNG 的 card DOM 一律 640px 宽；窄屏由外层容器横向滚动或缩放，不得压缩卡片本身。

### 卡片 metadata 显示原则（RE-11）

- 平台 X 标识及 likes / replies / reposts / views 均使用**无障碍文本标签的图标**（`role="img"` + `aria-label`），不以可见自然语言作为主 UI；图标为系统生成的 inline SVG，在消毒之后由 `fillTemplate` 注入槽位。
- 发帖时间与抓取时间用稳定国际格式 `YYYY-MM-DD`（必要时 `YYYY-MM-DD HH:mm`），不出现中文年月日。
- URL 卡的 `Fetched from X` 来源行**始终可见**；`showFetchedAt` 只控制其时间戳子节点（`.poim-fetched-at`）。手填卡无来源行。

## 4. 叠层与消毒

叠层已锁定，实现必须遵守：

1. 预设 HTML 模板
2. 预设 CSS（全走 `--poim-*`，浅深才生效）
3. **用户 CSS 永远叠在最上层**（不 fork 预设）

> RE-11 已移除可视化 token 覆盖层（样式 / 色 / 字体 / 圆角编辑 UI 与 `card-tokens.ts`）；设置面板只保留与实际输出有关的控制（metadata 显示开关与 HTML/CSS 编辑入口）。

- **结构标签用 `div` 不用 `article/header/footer/section`**：合同 HTML 消毒白名单不含语义标签（见 `sanitize-html.ts` 与 `presets.test.ts`），用 div 保证消毒后结构不塌。语义由 class 承担。
- 槽位：`data-poim="<slot>"` 首选，认同名 `id`；填入节点不删标签；`media`/`quote` 是空容器，无引用时 `hidden`。
- 消毒只放行 `data-poim`，其余 `data-*` 剥掉（hook 实现，见 `sanitize-html.ts` 注释）。

## 5. 已知取舍

- **卡片平整化**：v1 合同 2026-08-16 收紧——卡片本体零 rotate / transform，倾角移除（原 `-0.35°` 微倾）。阴影保留承担体量感；动势仍是静态样式，不引入动画。
- **灰阶优先**：v1 预设不引入品牌色，把色彩留给用户 CSS 层。
- **固定 640px**：预览台面窄屏横向滚动（`.stage-frame` overflow-x），PNG 截图尺寸与预览一致。
- **手绘已移除**：froQ 2026-08-15 锁合同——手绘预设 v1 不做，整体视觉不走手绘风，Rough.js 不用于卡片（PROJECT.md 第 3 节）。
- **未来新增模板**须用可验证的设计系统语义命名（Cupertino / Material / Fluent 等），不得用「简洁」「人文」等抽象气质词（PROJECT.md §3）。
