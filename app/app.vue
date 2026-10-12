<script setup lang="ts">
import { canonicalUrl } from '~~/shared/utils/site'

const route = useRoute()

useSeoMeta({
  ogUrl: () => canonicalUrl(route.path),
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
