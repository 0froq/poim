import type { PoimPresetId, PoimTheme } from '~~/shared/types/post'
import { useDebounceFn } from '@vueuse/core'
import { composeTokenCss, emptyTokenOverrides } from '~~/shared/utils/card-tokens'
import { emptyPost } from '~~/shared/utils/empty-post'
import { getPreset } from '~~/shared/utils/presets'

export function useGenerator() {
  const platform = shallowRef<'x' | 'youtube' | 'bilibili' | 'xiaohongshu'>('x')
  const url = shallowRef('')
  const source = shallowRef<'url' | 'manual'>('manual')
  const post = ref(emptyPost())
  const presetId = shallowRef<PoimPresetId>('plain')
  const theme = shallowRef<PoimTheme>('light')
  const userHtml = shallowRef('')
  const userCss = shallowRef('')
  const showBrand = shallowRef(true)
  const resolving = shallowRef(false)
  const resolveError = shallowRef('')
  const advanced = shallowRef(false)
  // 可视化 token（RE-9）：覆盖写入卡片层 CSS，夹在预设与用户 CSS 之间
  const tokenOverrides = reactive(emptyTokenOverrides())
  const styleTokens = shallowRef(false)
  const tokenCss = computed(() => composeTokenCss(tokenOverrides))

  const preset = computed(() => getPreset(presetId.value))
  const htmlLocked = computed(() => userHtml.value.trim() || preset.value.html)
  const formLocked = computed(() => source.value === 'url')

  const placeholderPlatforms = [
    { id: 'x' as const, label: 'X', enabled: true },
    { id: 'youtube' as const, label: 'YouTube', enabled: false },
    { id: 'bilibili' as const, label: 'Bilibili', enabled: false },
    { id: 'xiaohongshu' as const, label: '小红书', enabled: false },
  ]

  function applyManualDefaults(): void {
    source.value = 'manual'
    post.value.source = 'manual'
    post.value.fetchedAt = undefined
  }

  async function resolveFromUrl(): Promise<void> {
    const target = url.value.trim()
    if (!target)
      return
    resolving.value = true
    resolveError.value = ''
    try {
      const data = await $fetch('/api/resolve', { query: { url: target } })
      post.value = data
      source.value = 'url'
    }
    catch (error) {
      applyManualDefaults()
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
      applyManualDefaults()
      resolveError.value = ''
      return
    }
    void resolveDebounced()
  })

  watch(presetId, (id) => {
    if (!userHtml.value.trim())
      userHtml.value = getPreset(id).html
  })

  onMounted(() => {
    userHtml.value = preset.value.html
  })

  return reactive({
    platform,
    url,
    source,
    post,
    presetId,
    theme,
    userHtml,
    userCss,
    showBrand,
    resolving,
    resolveError,
    advanced,
    tokenOverrides,
    styleTokens,
    tokenCss,
    preset,
    htmlLocked,
    formLocked,
    placeholderPlatforms,
    resolveFromUrl,
    applyManualDefaults,
  })
}
