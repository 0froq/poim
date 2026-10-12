<script setup lang="ts">
import type { ChoiceOption } from '@froq/ui'
import type { ShellTheme } from '~/composables/useTheme'
import { Choice } from '@froq/ui'

const { theme, setTheme } = useTheme()

const shellTheme = computed({
  get: (): ShellTheme => theme.value,
  set: (value: ShellTheme) => {
    setTheme(value)
  },
})

const themeOptions: ChoiceOption<ShellTheme>[] = [
  { value: 'light', label: '浅' },
  { value: 'dark', label: '深' },
]
</script>

<template>
  <header class="top">
    <NuxtLink
      to="/"
      class="brand"
      aria-label="poim 首页"
    >
      poim<span class="brand-mark">.</span>
    </NuxtLink>
    <Choice
      v-model="shellTheme"
      label="主题"
      :options="themeOptions"
    />
  </header>
</template>
