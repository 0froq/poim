import type { PoimTheme } from '~~/shared/types/post'
import { useDebounceFn } from '@vueuse/core'
import { emptyPost } from '~~/shared/utils/empty-post'
import { getPreset } from '~~/shared/utils/presets'
import userCssSeed from '~/assets/css/card/user.css?raw'

export function useGenerator() {
  const platform = shallowRef<'x' | 'youtube' | 'bilibili' | 'xiaohongshu'>('x')
  const url = shallowRef('')
  const source = shallowRef<'url' | 'manual'>('manual')
  const post = ref(emptyPost())
  // v1 仅一个 preset：default（PROJECT.md §3），无选择 UI。
  const preset = computed(() => getPreset('default'))
  const theme = shallowRef<PoimTheme>('light')
  const userHtml = shallowRef('')
  // 用户 CSS 初始值来自可编辑源文件（app/assets/css/card/user.css），浏览器编辑优先
  const userCss = shallowRef(userCssSeed)
  const showBrand = shallowRef(true)
  // 元信息显示开关（默认开启 = 与产品现状一致；手填无 fetchedAt 时永远不制造标记）
  const showMetrics = shallowRef(true)
  const showFetchedAt = shallowRef(true)
  const resolving = shallowRef(false)
  const resolveError = shallowRef('')
  const advanced = shallowRef(false)

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

  onMounted(() => {
    userHtml.value = preset.value.html
  })

  return reactive({
    platform,
    url,
    source,
    post,
    preset,
    theme,
    userHtml,
    userCss,
    showBrand,
    showMetrics,
    showFetchedAt,
    resolving,
    resolveError,
    advanced,
    htmlLocked,
    formLocked,
    placeholderPlatforms,
    resolveFromUrl,
    applyManualDefaults,
  })
}
