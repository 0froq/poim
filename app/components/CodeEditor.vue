<script setup lang="ts">
import type { Extension } from '@codemirror/state'
import type { EditorView as EditorViewType } from '@codemirror/view'

interface Props {
  lang: 'css' | 'html'
}

const props = defineProps<Props>()
const model = defineModel<string>({ default: '' })
const el = ref<HTMLElement | null>(null)
const isDark = useDark()
let view: EditorViewType | null = null

// 壳 chrome：只声明编辑器自身的形状，边框由外层 poim-panel 提供
const chromeTheme = EditorViewType.theme({
  '&': {
    fontSize: '13px',
    minHeight: '160px',
  },
  '.cm-scroller': {
    fontFamily: 'var(--poim-mono)',
  },
})

// 浅色纸面主题：跟随壳 token，与深色 oneDark 交替
const lightTheme = EditorViewType.theme({
  '&': {
    backgroundColor: 'var(--poim-surface)',
    color: 'var(--poim-fg)',
  },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    borderRight: '1px solid var(--poim-line)',
    color: 'var(--poim-faint)',
  },
  '.cm-activeLine, .cm-activeLineGutter': {
    backgroundColor: 'var(--poim-accent-soft)',
  },
  '.cm-selectionBackground': {
    backgroundColor: 'color-mix(in srgb, var(--poim-accent) 26%, transparent)',
  },
  '.cm-cursor': {
    borderLeftColor: 'var(--poim-accent)',
  },
}, { dark: false })

async function initView(): Promise<void> {
  const host = el.value
  if (!host)
    return
  view?.destroy()
  view = null

  const [{ EditorView, keymap }, { EditorState }, { defaultKeymap, history, historyKeymap }] = await Promise.all([
    import('@codemirror/view'),
    import('@codemirror/state'),
    import('@codemirror/commands'),
  ])
  const lang = props.lang === 'css'
    ? (await import('@codemirror/lang-css')).css()
    : (await import('@codemirror/lang-html')).html()
  const { oneDark } = await import('@codemirror/theme-one-dark')

  const extensions: Extension[] = [
    history(),
    keymap.of([...defaultKeymap, ...historyKeymap]),
    lang,
    chromeTheme,
    isDark.value ? oneDark : lightTheme,
    EditorView.updateListener.of((update) => {
      if (update.docChanged)
        model.value = update.state.doc.toString()
    }),
  ]

  view = new EditorView({
    state: EditorState.create({
      doc: model.value,
      extensions,
    }),
    parent: host,
  })
}

onMounted(() => void initView())

// 浅深切换时重建，编辑器跟随壳主题
watch(isDark, () => void initView())

watch(model, (value) => {
  if (!view)
    return
  if (view.state.doc.toString() !== value) {
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: value },
    })
  }
})

onBeforeUnmount(() => {
  view?.destroy()
  view = null
})
</script>

<template>
  <div ref="el" />
</template>
