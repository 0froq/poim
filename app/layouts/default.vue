<script setup lang="ts">
import { Paper } from '@froq/ui'
</script>

<template>
  <Paper class="site">
    <AppHeader />
    <main class="page">
      <slot />
    </main>
  </Paper>
</template>
