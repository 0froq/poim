<script setup lang="ts">
import { domToPng } from 'modern-screenshot'
import { POIM_PRESETS } from '~~/shared/utils/presets'
import { serializePoimEmbed } from '~~/shared/utils/serialize-embed'

const gen = useGenerator()
const preview = ref<{
  getInnerCard: () => HTMLElement | null
  combinedCss: () => string
} | null>(null)
const copied = shallowRef(false)
const pngUrl = shallowRef('')
const editorTab = shallowRef<'html' | 'css'>('css')

async function copyEmbed(): Promise<void> {
  const card = preview.value?.getInnerCard()
  const css = preview.value?.combinedCss()
  if (!card || !css)
    return
  const html = serializePoimEmbed({
    innerHTML: card.outerHTML,
    css,
    theme: gen.theme,
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
  window.open(media.url, '_blank', 'noopener')
}

const hasMotion = computed(() =>
  gen.post.media.some(item => item.type === 'video' || item.type === 'gif'),
)
</script>

<template>
  <div
    un-pb-20
    un-grid
    un-gap-12
    un-md:grid-cols-2
  >
    <section>
      <h1
        un-font-serif
        un-text-3xl
        un-text-stone-800
        un-dark:text-stone-200
        un-mb-2
      >
        做成一张卡片
      </h1>
      <p
        un-text-stone-500
        un-mb-8
        un-leading-7
      >
        贴 X 链接，或手填。导出 Web Component 快照与 PNG。v1 只跑通 X。
      </p>

      <div
        un-flex
        un-gap-3
        un-mb-6
        un-flex-wrap
      >
        <button
          v-for="item in gen.placeholderPlatforms"
          :key="item.id"
          type="button"
          un-text-sm
          un-border-b
          un-pb-0.5
          :un-border-dashed="gen.platform !== item.id"
          :un-border-stone-800="gen.platform === item.id && item.enabled"
          :un-text-stone-800="item.enabled"
          :un-dark:text-stone-200="item.enabled"
          :un-text-stone-400="!item.enabled"
          :disabled="!item.enabled"
          @click="item.enabled && (gen.platform = item.id)"
        >
          {{ item.label }}
          <span
            v-if="!item.enabled"
            un-ml-1
            un-text-xs
          >即将支持</span>
        </button>
      </div>

      <label
        un-block
        un-text-sm
        un-text-stone-500
        un-mb-6
      >
        链接
        <input
          v-model="gen.url"
          type="url"
          placeholder="https://x.com/name/status/…"
          un-block
          un-w-full
          un-mt-2
          un-bg-transparent
          un-border-b
          un-border-dashed
          un-border-stone-400
          un-py-1
          un-outline-none
          un-focus:border-solid
          un-focus:border-stone-800
          un-dark:focus:border-stone-200
        >
      </label>
      <p
        v-if="gen.resolving"
        un-text-sm
        un-text-stone-500
        un-mb-4
      >
        正在拉取…
      </p>
      <p
        v-else-if="gen.resolveError"
        un-text-sm
        un-text-rose-800
        un-dark:text-rose-300
        un-mb-4
      >
        {{ gen.resolveError }}
      </p>

      <fieldset
        :disabled="gen.formLocked"
        un-grid
        un-gap-4
      >
        <legend
          un-text-sm
          un-text-stone-500
          un-mb-2
        >
          {{ gen.formLocked ? '已从 URL 锁定' : '手填' }}
        </legend>
        <input
          v-model="gen.post.author.name"
          placeholder="显示名"
          un-bg-transparent
          un-border-b
          un-border-dashed
          un-border-stone-400
          un-py-1
          un-outline-none
        >
        <input
          v-model="gen.post.author.handle"
          placeholder="@handle"
          un-bg-transparent
          un-border-b
          un-border-dashed
          un-border-stone-400
          un-py-1
          un-outline-none
        >
        <textarea
          v-model="gen.post.text"
          rows="5"
          placeholder="正文"
          un-bg-transparent
          un-border
          un-border-dashed
          un-border-stone-400
          un-p-2
          un-w-full
          un-outline-none
          un-leading-7
        />
      </fieldset>

      <div
        un-mt-8
        un-flex
        un-flex-wrap
        un-gap-3
      >
        <button
          v-for="preset in POIM_PRESETS"
          :key="preset.id"
          type="button"
          un-text-sm
          un-border-b
          un-pb-0.5
          :un-border-solid="gen.presetId === preset.id"
          :un-border-dashed="gen.presetId !== preset.id"
          @click="gen.presetId = preset.id"
        >
          {{ preset.label }}
        </button>
        <button
          type="button"
          un-text-sm
          un-ml-4
          un-border-b
          un-border-dashed
          @click="gen.theme = gen.theme === 'light' ? 'dark' : 'light'"
        >
          卡片：{{ gen.theme === 'light' ? '浅' : '深' }}
        </button>
        <button
          type="button"
          un-text-sm
          un-border-b
          un-border-dashed
          @click="gen.showBrand = !gen.showBrand"
        >
          {{ gen.showBrand ? '隐藏 poim' : '显示 poim' }}
        </button>
      </div>

      <button
        type="button"
        un-mt-6
        un-text-sm
        un-border-b
        un-border-dashed
        @click="gen.advanced = !gen.advanced"
      >
        {{ gen.advanced ? '收起 HTML / CSS' : '高级：编辑 HTML / CSS' }}
      </button>

      <div
        v-if="gen.advanced"
        un-mt-4
      >
        <div
          un-flex
          un-gap-3
          un-mb-2
        >
          <button
            type="button"
            un-text-sm
            @click="editorTab = 'css'"
          >
            CSS
          </button>
          <button
            type="button"
            un-text-sm
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
    </section>

    <section>
      <ClientOnly>
        <CardPreview
          ref="preview"
          :post="gen.post"
          :html="gen.htmlLocked"
          :user-css="gen.userCss"
          :preset-css="gen.preset.css"
          :theme="gen.theme"
          :preset-id="gen.presetId"
          :show-brand="gen.showBrand"
        />
        <template #fallback>
          <p un-text-stone-500>
            预览在客户端绘制
          </p>
        </template>
      </ClientOnly>

      <div
        un-mt-8
        un-flex
        un-flex-wrap
        un-gap-4
      >
        <button
          type="button"
          un-border-b
          un-border-dashed
          un-font-serif
          un-italic
          @click="copyEmbed"
        >
          {{ copied ? '已复制' : '复制 Web Component' }}
        </button>
        <button
          type="button"
          un-border-b
          un-border-dashed
          un-font-serif
          un-italic
          @click="downloadPng"
        >
          下载 PNG
        </button>
        <button
          v-if="hasMotion"
          type="button"
          un-border-b
          un-border-dashed
          un-font-serif
          un-italic
          @click="downloadMedia"
        >
          下载原视频
        </button>
      </div>
    </section>
  </div>
</template>
