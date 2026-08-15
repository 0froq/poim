<script setup lang="ts">
const { isDark, toggleWithTransition } = useThemeToggle()
</script>

<template>
  <header
    un-flex
    un-items-baseline
    un-justify-between
    un-gap-6
    un-py-8
    class="page-content"
  >
    <NuxtLink
      to="/"
      un-font-serif
      un-text-2xl
      un-tracking-wide
      un-text-stone-800
      un-dark:text-stone-200
    >
      poim
    </NuxtLink>
    <div
      un-flex
      un-items-center
      un-gap-4
      un-text-sm
      un-text-stone-500
    >
      <span
        un-font-serif
        un-italic
      >
        帖子 → 卡片
      </span>
      <button
        type="button"
        un-border-b
        un-border-dashed
        un-border-stone-500
        un-transition
        un-duration-200
        un-hover:border-solid
        un-hover:border-stone-800
        un-dark:hover:border-stone-200
        @click="toggleWithTransition($event)"
      >
        {{ isDark ? '浅色' : '深色' }}
      </button>
    </div>
  </header>
</template>
