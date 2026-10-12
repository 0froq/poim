<script setup lang="ts">
import type { ChoiceOption } from '@froq/ui'
import type { PoimTheme } from '~~/shared/types/post'
import { Choice } from '@froq/ui'
import { CARD_CASES } from '~~/shared/fixtures/card-cases'
import { getPreset } from '~~/shared/utils/presets'

const pageTitle = 'poim · 卡片样例'
const pageDescription = '模拟原创、回复、转发和引用，以及自己与父级 0–4 张图。用来核对作者头栏与媒体。'

useSeoMeta({
  title: pageTitle,
  description: pageDescription,
  ogTitle: pageTitle,
  ogDescription: pageDescription,
  twitterTitle: pageTitle,
  twitterDescription: pageDescription,
})

useHead({
  meta: [{ name: 'robots', content: 'noindex' }],
})

const preset = getPreset('default')
const theme = shallowRef<PoimTheme>('light')
const themeOptions: ChoiceOption<PoimTheme>[] = [
  { value: 'light', label: '浅' },
  { value: 'dark', label: '深' },
]
</script>

<template>
  <div class="cases">
    <div class="cases-head">
      <div>
        <h1 class="tool-title">
          卡片样例
        </h1>
        <p class="tool-lede">
          模拟原创、回复、转发和引用，以及自己与父级 0–4 张图。用来核对作者头栏与媒体。
        </p>
      </div>
      <Choice
        v-model="theme"
        label="卡片"
        :options="themeOptions"
      />
    </div>

    <div class="cases-list">
      <section
        v-for="item in CARD_CASES"
        :id="item.id"
        :key="item.id"
      >
        <h2 class="case-title">
          {{ item.title }}
        </h2>
        <p class="case-note">
          {{ item.note }}
          <code>{{ item.id }}</code>
        </p>
        <div class="stage">
          <ClientOnly>
            <CardPreview
              :post="item.post"
              :html="preset.html"
              :preset-css="preset.css"
              :theme="theme"
              :show-brand="true"
            />
          </ClientOnly>
        </div>
      </section>
    </div>
  </div>
</template>
