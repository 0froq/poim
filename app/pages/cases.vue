<script setup lang="ts">
import { CARD_CASES } from '~~/shared/fixtures/card-cases'
import { getPreset } from '~~/shared/utils/presets'
import userCssSeed from '~/assets/css/card/user.css?raw'
import CardPreview from '~/components/CardPreview.vue'

useHead({
  title: 'poim · 卡片样例',
  meta: [{ name: 'robots', content: 'noindex' }],
})

const preset = getPreset('default')
const theme = shallowRef<'light' | 'dark'>('light')
</script>

<template>
  <div un-pb-24>
    <div
      un-flex
      un-flex-wrap
      un-items-end
      un-justify-between
      un-gap-4
      un-mb-10
    >
      <div>
        <h1
          un-font-serif
          un-text-3xl
          un-text-ink
        >
          卡片样例
        </h1>
        <p
          un-mt-2
          un-text-sm
          un-text-muted
        >
          模拟原创 / 回复 / 转发 / 引用，以及自己与父级 0–4 张图。用来核对作者头栏与媒体，不是产品入口。
        </p>
      </div>
      <button
        type="button"
        class="poim-btn"
        @click="theme = theme === 'light' ? 'dark' : 'light'"
      >
        卡片{{ theme === 'light' ? '深色' : '浅色' }}
      </button>
    </div>

    <div un-space-y-14>
      <section
        v-for="item in CARD_CASES"
        :id="item.id"
        :key="item.id"
      >
        <h2
          un-font-serif
          un-text-xl
          un-text-ink
        >
          {{ item.title }}
        </h2>
        <p
          un-mt-1
          un-mb-4
          un-text-sm
          un-text-muted
        >
          {{ item.note }}
          <code un-text-faint>{{ item.id }}</code>
        </p>
        <div class="poim-panel">
          <div class="stage-frame">
            <ClientOnly>
              <CardPreview
                :post="item.post"
                :html="preset.html"
                :user-css="userCssSeed"
                :preset-css="preset.css"
                :theme="theme"
                :show-brand="true"
              />
            </ClientOnly>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
