import type { Ref } from 'vue'

export type ShellTheme = 'light' | 'dark'

const KEY = 'poim-theme'

function readTheme(): ShellTheme {
  if (document.documentElement.dataset.theme === 'dark')
    return 'dark'
  if (document.documentElement.dataset.theme === 'light')
    return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** Shell theme on `html[data-theme]`. The head script sets it before paint. */
export function useTheme(): { theme: Ref<ShellTheme>, setTheme: (next: ShellTheme) => void } {
  const theme = useState<ShellTheme>('poim-theme', () => 'light')

  if (import.meta.client) {
    onMounted(() => {
      const current = readTheme()
      document.documentElement.dataset.theme = current
      theme.value = current
    })
  }

  function setTheme(next: ShellTheme): void {
    document.documentElement.dataset.theme = next
    theme.value = next
    try {
      localStorage.setItem(KEY, next)
    }
    catch {
      // Storage may be unavailable; the current theme still applies.
    }
  }

  return { theme, setTheme }
}
