import { nextTick } from 'vue'

interface ViewTransition {
  finished: Promise<void>
  ready: Promise<void>
}

/**
 * 应用壳浅深切换：优先走 View Transition API 的圆形「感染」扩散，
 * 逻辑与 CSS 参考 0froq.github.io；不支持或 prefers-reduced-motion 时退化为直接切换。
 */
export function useThemeToggle() {
  const isDark = useDark()
  const toggle = useToggle(isDark)

  function waitFrames(n = 2): Promise<void> {
    return new Promise((resolve) => {
      const step = (left: number) => {
        if (left <= 0)
          resolve()
        else
          requestAnimationFrame(() => step(left - 1))
      }
      step(n)
    })
  }

  async function toggleWithTransition(event: MouseEvent): Promise<void> {
    const doc = document as Document & { startViewTransition?: (cb: () => Promise<void> | void) => ViewTransition }
    const canTransition = typeof document !== 'undefined'
      && typeof doc.startViewTransition === 'function'
      && !window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!canTransition) {
      toggle()
      return
    }

    const x = event.clientX
    const y = event.clientY
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    )

    const root = document.documentElement
    const toDark = !isDark.value

    root.getAnimations?.().forEach(a => a.cancel())
    root.style.setProperty('--vt-x', `${x}px`)
    root.style.setProperty('--vt-y', `${y}px`)
    root.style.setProperty('--vt-end', `${endRadius}px`)
    root.dataset.themeVt = toDark ? 'to-dark' : 'to-light'
    root.classList.add('vt-active')
    await waitFrames(2)

    const transition = doc.startViewTransition!(async () => {
      toggle()
      await nextTick()
    })

    const clear = () => {
      root.classList.remove('vt-active')
      delete root.dataset.themeVt
      root.style.removeProperty('--vt-x')
      root.style.removeProperty('--vt-y')
      root.style.removeProperty('--vt-end')
    }
    transition.finished.then(clear, clear)
    transition.ready.catch(clear)
  }

  return { isDark, toggle, toggleWithTransition }
}
