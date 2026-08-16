<script setup lang="ts">
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
const editorTab = shallowRef<'html' | 'css'>('css')

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
  <div class="gen-layout">
    <!-- 左栏：输入与设置 -->
    <section
      un-space-y-8
      un-min-w-0
    >
      <div>
        <h1
          un-font-serif
          un-text-3xl
          un-text-ink
        >
          做成一张卡片
        </h1>
        <p
          un-mt-2
          un-text-sm
          un-leading-6
          un-text-muted
        >
          贴 X 链接，或手填。导出 Web Component 快照与 PNG。v1 只跑通 X。
        </p>
      </div>

      <!-- 平台选择 -->
      <div class="poim-tabs">
        <button
          v-for="item in gen.placeholderPlatforms"
          :key="item.id"
          type="button"
          class="poim-tab"
          :class="[
            gen.platform === item.id && item.enabled ? 'poim-tab--active' : '',
            !item.enabled ? 'poim-tab--disabled' : '',
          ]"
          :aria-pressed="gen.platform === item.id && item.enabled"
          :disabled="!item.enabled"
          @click="item.enabled && (gen.platform = item.id)"
        >
          {{ item.label }}
          <span
            v-if="!item.enabled"
            class="poim-tag"
          >即将支持</span>
        </button>
      </div>

      <!-- 链接 -->
      <div>
        <label
          class="poim-label"
          for="poim-url"
        >
          链接
        </label>
        <input
          id="poim-url"
          v-model="gen.url"
          type="url"
          class="poim-field poim-field--mono"
          placeholder="https://x.com/name/status/…"
        >
        <p
          v-if="gen.resolving"
          un-mt-2
          un-text-sm
          un-text-muted
        >
          正在拉取…
        </p>
        <p
          v-else-if="gen.resolveError"
          un-mt-2
          un-text-sm
          un-text-danger
        >
          {{ gen.resolveError }}
        </p>
      </div>

      <!-- 手填 -->
      <fieldset
        :disabled="gen.formLocked"
        un-m-0
        un-border-0
        un-p-0
        un-space-y-5
      >
        <legend
          class="poim-label"
          un-mb-2
        >
          {{ gen.formLocked ? '已从 URL 锁定' : '手填' }}
        </legend>
        <input
          v-model="gen.post.author.name"
          class="poim-field"
          placeholder="显示名"
        >
        <input
          v-model="gen.post.author.handle"
          class="poim-field"
          placeholder="@handle"
        >
        <textarea
          v-model="gen.post.text"
          class="poim-textarea"
          rows="5"
          placeholder="正文"
        />
      </fieldset>

      <!-- 卡片设置 -->
      <div>
        <p
          class="poim-label"
          un-mb-2.5
        >
          卡片
        </p>
        <div
          un-flex
          un-flex-wrap
          un-gap-2
        >
          <button
            type="button"
            class="poim-btn"
            @click="gen.theme = gen.theme === 'light' ? 'dark' : 'light'"
          >
            卡片：{{ gen.theme === 'light' ? '浅' : '深' }}
          </button>
          <button
            type="button"
            class="poim-btn"
            @click="gen.showBrand = !gen.showBrand"
          >
            {{ gen.showBrand ? '隐藏 poim' : '显示 poim' }}
          </button>
          <button
            type="button"
            class="poim-btn"
            :class="{ 'poim-btn--active': gen.showMetrics }"
            :aria-pressed="gen.showMetrics"
            @click="gen.showMetrics = !gen.showMetrics"
          >
            {{ gen.showMetrics ? '隐藏指标' : '显示指标' }}
          </button>
          <button
            type="button"
            class="poim-btn"
            :class="{ 'poim-btn--active': gen.showFetchedAt }"
            :aria-pressed="gen.showFetchedAt"
            @click="gen.showFetchedAt = !gen.showFetchedAt"
          >
            {{ gen.showFetchedAt ? '隐藏抓取时间' : '显示抓取时间' }}
          </button>
        </div>
      </div>

      <!-- 高级：HTML / CSS -->
      <div>
        <button
          type="button"
          class="poim-btn poim-btn--ghost"
          @click="gen.advanced = !gen.advanced"
        >
          {{ gen.advanced ? '收起 HTML / CSS' : '高级：编辑 HTML / CSS' }}
        </button>

        <div
          v-if="gen.advanced"
          class="poim-panel"
          un-mt-3
          un-overflow-hidden
        >
          <div class="poim-tabs">
            <button
              type="button"
              class="poim-tab"
              :class="{ 'poim-tab--active': editorTab === 'css' }"
              :aria-pressed="editorTab === 'css'"
              @click="editorTab = 'css'"
            >
              CSS
            </button>
            <button
              type="button"
              class="poim-tab"
              :class="{ 'poim-tab--active': editorTab === 'html' }"
              :aria-pressed="editorTab === 'html'"
              @click="editorTab = 'html'"
            >
              HTML
            </button>
          </div>
          <ClientOnly>
            <CodeEditor
              v-if="editorTab === 'css'"
              v-model="gen.userCss"
              lang="css"
            />
            <CodeEditor
              v-else
              v-model="gen.userHtml"
              lang="html"
            />
          </ClientOnly>
        </div>
      </div>
    </section>

    <!-- 右栏：预览台面 + 导出 -->
    <section
      un-min-w-0
      un-md:sticky
      un-md:top-6
      un-self-start
    >
      <div class="poim-panel">
        <div class="stage-frame">
          <ClientOnly>
            <CardPreview
              ref="preview"
              :post="gen.post"
              :html="gen.htmlLocked"
              :user-css="gen.userCss"
              :preset-css="gen.preset.css"
              :theme="gen.theme"
              :show-brand="gen.showBrand"
              :show-metrics="gen.showMetrics"
              :show-fetched-at="gen.showFetchedAt"
            />
            <template #fallback>
              <p
                un-text-sm
                un-text-muted
              >
                预览在客户端绘制
              </p>
            </template>
          </ClientOnly>
        </div>
        <p
          un-px-5
          un-pb-3.5
          un-pt-1
          un-text-xs
          un-text-faint
        >
          预览即导出 · PNG 为当前帧
        </p>
      </div>

      <div
        un-mt-5
        un-flex
        un-flex-wrap
        un-gap-3
      >
        <button
          type="button"
          class="poim-btn poim-btn--ink"
          @click="copyEmbed"
        >
          {{ copied ? '已复制' : '复制 Web Component' }}
        </button>
        <button
          type="button"
          class="poim-btn"
          @click="downloadPng"
        >
          下载 PNG
        </button>
        <button
          v-if="hasMotion"
          type="button"
          class="poim-btn poim-btn--ghost"
          @click="downloadMedia"
        >
          下载原视频
        </button>
      </div>
    </section>
  </div>
</template>
