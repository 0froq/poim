import type { PoimTheme } from '~~/shared/types/post'
import { useDebounceFn } from '@vueuse/core'
import { emptyPost } from '~~/shared/utils/empty-post'
import { getPreset } from '~~/shared/utils/presets'

export function useGenerator() {
  const url = shallowRef('')
  const post = ref(emptyPost())
  const preset = computed(() => getPreset('default'))
  const theme = shallowRef<PoimTheme>('light')
  const showBrand = shallowRef(true)
  const showMetrics = shallowRef(true)
  const showFetchedAt = shallowRef(true)
  const resolving = shallowRef(false)
  const resolveError = shallowRef('')

  const ready = computed(() => post.value.source === 'url')

  function clearPost(): void {
    post.value = emptyPost()
  }

  async function resolveFromUrl(): Promise<void> {
    const target = url.value.trim()
    if (!target)
      return
    resolving.value = true
    resolveError.value = ''
    try {
      post.value = await $fetch('/api/resolve', { query: { url: target } })
    }
    catch (error) {
      clearPost()
      const err = error as { data?: { data?: { message?: string }, message?: string }, statusMessage?: string }
      resolveError.value = err.data?.data?.message
        ?? err.data?.message
        ?? err.statusMessage
        ?? '无法解析这条帖子'
    }
    finally {
      resolving.value = false
    }
  }

  const resolveDebounced = useDebounceFn(resolveFromUrl, 400)

  watch(url, (value) => {
    if (!value.trim()) {
      clearPost()
      resolveError.value = ''
      return
    }
    void resolveDebounced()
  })

  return reactive({
    url,
    post,
    preset,
    theme,
    showBrand,
    showMetrics,
    showFetchedAt,
    resolving,
    resolveError,
    ready,
    resolveFromUrl,
  })
}
