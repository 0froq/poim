<script setup lang="ts">
const { isDark, toggleWithTransition } = useThemeToggle()
</script>

<template>
  <header
    class="page-content"
    un-flex
    un-items-center
    un-justify-between
    un-gap-6
    un-py-6
  >
    <NuxtLink
      to="/"
      class="poim-wordmark"
      aria-label="poim 首页"
    >
      <span
        class="poim-mark"
        aria-hidden="true"
      />
      poim
    </NuxtLink>

    <div
      un-flex
      un-items-center
      un-gap-5
      un-text-sm
    >
      <span
        un-hidden
        un-sm:inline
        un-font-serif
        un-italic
        un-text-muted
      >
        帖子 → 卡片
      </span>

      <button
        type="button"
        class="poim-btn"
        :aria-label="isDark ? '切换到浅色' : '切换到深色'"
        @click="toggleWithTransition($event)"
      >
        <ClientOnly>
          <span
            v-if="isDark"
            class="i-carbon-sun"
            aria-hidden="true"
          />
          <span
            v-else
            class="i-carbon-moon"
            aria-hidden="true"
          />
          {{ isDark ? '浅色' : '深色' }}
          <template #fallback>
            浅深
          </template>
        </ClientOnly>
      </button>
    </div>
  </header>
</template>
