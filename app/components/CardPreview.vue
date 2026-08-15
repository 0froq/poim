<script setup lang="ts">
import type { PoimPost, PoimPresetId, PoimTheme } from '~~/shared/types/post'
import { fillTemplate } from '~~/shared/utils/fill-template'
import { toProxyMediaUrl } from '~~/shared/utils/media-url'
import { sanitizeUserCss } from '~~/shared/utils/sanitize-css'
import { sanitizeHtmlFragment } from '~~/shared/utils/sanitize-html'

interface Props {
  post: PoimPost
  html: string
  userCss: string
  presetCss: string
  theme: PoimTheme
  presetId: PoimPresetId
  showBrand: boolean
}

const props = defineProps<Props>()
const stageRef = ref<HTMLElement | null>(null)

function combinedCss(): string {
  return `${props.presetCss}\n${sanitizeUserCss(props.userCss)}`
}

function paint(): void {
  const stage = stageRef.value
  if (!stage)
    return

  const clean = sanitizeHtmlFragment(props.html)
  const parsed = new DOMParser().parseFromString(clean, 'text/html')
  const card = parsed.body.firstElementChild as HTMLElement | null
  stage.replaceChildren()

  const style = document.createElement('style')
  style.textContent = combinedCss()
  stage.append(style)
  stage.dataset.theme = props.theme

  if (!card) {
    const empty = document.createElement('p')
    empty.textContent = '模板无效'
    stage.append(empty)
    return
  }

  fillTemplate(card, props.post, {
    mediaSrc: toProxyMediaUrl,
    brandHref: 'https://github.com/0froq/poim',
  })

  const brand = card.querySelector('[data-poim="brand"]')
  if (brand instanceof HTMLElement && !props.showBrand)
    brand.hidden = true

  stage.append(card)
}

watch(
  () => [props.post, props.html, props.userCss, props.presetCss, props.theme, props.presetId, props.showBrand],
  () => nextTick(paint),
  { deep: true },
)

onMounted(() => paint())

defineExpose({
  stageRef,
  combinedCss,
  getInnerCard(): HTMLElement | null {
    const stage = stageRef.value
    if (!stage)
      return null
    return stage.querySelector('.poim-card')
      ?? Array.from(stage.children).find(node => node instanceof HTMLElement && node.tagName !== 'STYLE') as HTMLElement | undefined
      ?? null
  },
})
</script>

<template>
  <div
    ref="stageRef"
    class="poim-stage"
    :data-theme="theme"
    un-min-h-48
  />
</template>
