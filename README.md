# poim

把 X 帖子转成可嵌入卡片（Web Component）与同源 PNG。合同见 [PROJECT.md](./PROJECT.md)。

```bash
pnpm i
pnpm dev
pnpm test
```

v1：打开首页，贴 `https://x.com/{user}/status/{id}`，复制 embed / 下载 PNG。只处理 X。视频站点（YouTube、Bilibili 等）不会支持。

部署在 Cloudflare Workers（Worker 名 `poim`）。`pnpm generate` 产出 `dist/`；`/api/resolve` 与 `/api/media` 在 `worker/`（`runWorkerFirst: ['/api/*']`）。Worker 配置在 `cloudflare.config.ts`，静态资源目录在 `wrangler.config.ts`。本地一次发布用 `pnpm deploy`。

Workers Builds（GitHub 连接，仓库不放 API token）：`NODE_VERSION=22`，构建 `pnpm generate`，生产 `pnpm exec cf deploy`，预览 `pnpm exec cf previews deploy`。
