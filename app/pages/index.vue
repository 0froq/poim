<script setup lang="ts">
import type { ChoiceOption } from '@froq/ui'
import type { PoimTheme } from '~~/shared/types/post'
import { Button, Choice, TextInput, Toggle } from '@froq/ui'
import { domToPng } from 'modern-screenshot'
import { absolutizeProxyUrl, toProxyMediaUrl } from '~~/shared/utils/media-url'
import { serializePoimEmbed } from '~~/shared/utils/serialize-embed'

const gen = useGenerator()
const preview = ref<{
  getInnerCard: () => HTMLElement | null
  combinedCss: () => string
} | null>(null)
const copied = shallowRef(false)
const pngUrl = shallowRef('')

const cardThemeOptions: ChoiceOption<PoimTheme>[] = [
  { value: 'light', label: '浅' },
  { value: 'dark', label: '深' },
]

// 快照必须可移植（合同 §5）：把预览里相对 /api/media?url= 补成绝对同源 URL，
// 不污染预览 DOM（克隆后改写）。data:/http(s) 原样保留。
function absolutizeMedia(root: HTMLElement): void {
  for (const node of root.querySelectorAll<HTMLElement>('img, video, source')) {
    for (const attr of ['src', 'poster'] as const) {
      const value = node.getAttribute(attr)
      if (value)
        node.setAttribute(attr, absolutizeProxyUrl(value, window.location.origin))
    }
  }
}

function mediaFileName(raw: string): string {
  try {
    const base = new URL(raw).pathname.split('/').pop()
    if (base?.endsWith('.mp4'))
      return base
  }
  catch {}
  return 'poim-media.mp4'
}

async function copyEmbed(): Promise<void> {
  if (!gen.ready)
    return
  const card = preview.value?.getInnerCard()
  const css = preview.value?.combinedCss()
  if (!card || !css)
    return
  const clone = card.cloneNode(true) as HTMLElement
  absolutizeMedia(clone)
  const html = serializePoimEmbed({
    innerHTML: clone.outerHTML,
    css,
    theme: gen.theme,
    post: gen.post,
  })
  await navigator.clipboard.writeText(html)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 1600)
}

async function downloadPng(): Promise<void> {
  if (!gen.ready)
    return
  const card = preview.value?.getInnerCard()
  if (!card)
    return
  pngUrl.value = await domToPng(card, { scale: 2 })
  const a = document.createElement('a')
  a.href = pngUrl.value
  a.download = 'poim-card.png'
  a.click()
}

function downloadMedia(): void {
  const media = gen.post.media.find(item => item.type === 'video' || item.type === 'gif')
  if (!media)
    return
  // 原片原样下载（v1 不转码）：走同源代理，<a download> 触发保存
  const href = absolutizeProxyUrl(toProxyMediaUrl(media.url), window.location.origin)
  const a = document.createElement('a')
  a.href = href
  a.download = mediaFileName(media.url)
  a.click()
}

const hasMotion = computed(() =>
  gen.post.media.some(item => item.type === 'video' || item.type === 'gif'),
)
</script>

<template>
  <div class="tool">
    <section class="tool-form">
      <div>
        <h1 class="tool-title">
          做成一张卡片
        </h1>
        <p class="tool-lede">
          贴一条 X 状态链接，导出可嵌入的卡片和 PNG。
        </p>
      </div>

      <TextInput
        v-model="gen.url"
        class="tool-url"
        label="链接"
        placeholder="https://x.com/name/status/…"
        spellcheck="false"
        autocomplete="off"
        enterkeyhint="go"
        :aria-invalid="gen.resolveError ? 'true' : undefined"
      />
      <p
        v-if="gen.resolving"
        class="tool-status"
      >
        正在拉取…
      </p>
      <p
        v-else-if="gen.resolveError"
        class="tool-status is-error"
        role="alert"
      >
        {{ gen.resolveError }}
      </p>

      <div class="tool-settings">
        <Choice
          v-model="gen.theme"
          label="卡片"
          :options="cardThemeOptions"
        />
        <div class="tool-switches">
          <div class="tool-switch">
            <span>品牌</span>
            <Toggle
              v-model="gen.showBrand"
              label="品牌"
              on-label="显示"
              off-label="隐藏"
            />
          </div>
          <div class="tool-switch">
            <span>指标</span>
            <Toggle
              v-model="gen.showMetrics"
              label="指标"
              on-label="显示"
              off-label="隐藏"
            />
          </div>
          <div class="tool-switch">
            <span>抓取时间</span>
            <Toggle
              v-model="gen.showFetchedAt"
              label="抓取时间"
              on-label="显示"
              off-label="隐藏"
            />
          </div>
        </div>
      </div>
    </section>

    <section class="tool-stage">
      <div class="stage">
        <ClientOnly>
          <CardPreview
            v-if="gen.ready"
            ref="preview"
            :post="gen.post"
            :html="gen.preset.html"
            :preset-css="gen.preset.css"
            :theme="gen.theme"
            :show-brand="gen.showBrand"
            :show-metrics="gen.showMetrics"
            :show-fetched-at="gen.showFetchedAt"
          />
          <p
            v-else
            class="stage-empty"
          >
            贴一条链接，卡片会出现在这里。
          </p>
          <template #fallback>
            <p class="stage-empty">
              预览在客户端绘制
            </p>
          </template>
        </ClientOnly>
      </div>
      <p class="stage-note">
        预览即导出 · PNG 为当前帧
      </p>
      <div class="tool-actions">
        <Button
          :disabled="!gen.ready"
          @click="copyEmbed"
        >
          {{ copied ? '已复制' : '复制 Web Component' }}
        </Button>
        <Button
          :disabled="!gen.ready"
          @click="downloadPng"
        >
          下载 PNG
        </Button>
        <Button
          v-if="hasMotion"
          @click="downloadMedia"
        >
          下载原视频
        </Button>
      </div>
    </section>
  </div>
</template>
