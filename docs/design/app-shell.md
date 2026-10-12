# 应用壳：@froq/ui 的纸

> 实现以 `app/assets/css/main.css`、`app/layouts/default.vue` 和页面为准。卡片见 `docs/design/presets.md`。改壳的样子先改这里。

## 立场

poim 是工具。页面只做一件事：贴链接，看卡片，导出。已有 `/cases` 用来核对卡片，不是产品入口，也不进导航。

壳和 froQ 其它站点同一套皮，不另起一套色板：

- `vendor/ui` 是 `@froq/ui`。入口是 `Paper`。浅色画纤维，深色画颗粒，同一个组件。
- 令牌是 `--ui-*`，作用域类是 `html.ui`。字体是 Instrument Serif、Geist、Geist Mono。强调色是朱红。
- 控件是库里的 `TextInput`、`Choice`、`Toggle`、`Button`。下划线、字后的点、虚线下划线都来自库，不在 poim 里重画。

卡片不跟着换皮。预览和导出仍是 `--poim-*` 的 `default` 预设。壳的 CSS 不进 embed。

## 结构

```
Paper
  header：poim.          主题 浅 · 深
  main
    左：标题、链接、卡片主题、品牌 / 指标 / 抓取时间
    右：预览（640px 卡片，窄了就横向滚动）、复制 / PNG / 原视频
```

宽屏（≥1240px）两栏。左栏 25rem，右栏至少能放下 640px 卡片。窄屏改成单栏，预览跟在表单后面，不把卡片压窄。

没有平台 tab。X 是唯一输入。视频站点不出现在界面、类型或文案里。

## 浅深

`html[data-theme=light|dark]`。`nuxt.config` 里的首屏脚本在绘制前写入，键是 `poim-theme`。页眉的 `Choice` 改的是这一维。

卡片上的浅 / 深是 `gen.theme`，只冻进当前预览和导出，不改页面的纸。

## 不做

- 落地页分区、多级导航、营销页脚
- 壳自己的按钮、输入框、色板（旧的 `--poim-*` 壳 token 和封蜡按钮已去掉）
- 把 `Paper` 的纹理放进卡片预设
