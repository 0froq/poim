# poim

把各平台帖子转成可嵌入卡片（Web Component）与同源 PNG。合同见 [PROJECT.md](./PROJECT.md)。

```bash
pnpm i
pnpm dev
pnpm test
```

v1：打开首页，贴 `https://x.com/{user}/status/{id}`，复制 embed / 下载 PNG。

部署在 Cloudflare Workers（Worker 名 `poim`）。`pnpm generate` 产出 `dist/`；`/api/resolve` 与 `/api/media` 在 `worker/`（`runWorkerFirst`）。生产：`pnpm deploy`（generate + `wrangler build` + `cf deploy --prebuilt`）。Workers Builds：`NODE_VERSION=22`，构建 `pnpm generate && pnpm exec wrangler build --experimental-new-config --x-cf-build-output`，生产 `pnpm exec cf deploy --prebuilt`，预览 `pnpm exec cf previews deploy --prebuilt`。
