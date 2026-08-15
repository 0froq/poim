<script setup lang="ts">
import type { Extension } from '@codemirror/state'
import type { EditorView as EditorViewType } from '@codemirror/view'

interface Props {
  lang: 'css' | 'html'
}

const props = defineProps<Props>()
const model = defineModel<string>({ default: '' })
const el = ref<HTMLElement | null>(null)
let view: EditorViewType | null = null

onMounted(async () => {
  if (!el.value)
    return
  const { EditorView, keymap } = await import('@codemirror/view')
  const { EditorState } = await import('@codemirror/state')
  const { defaultKeymap, history, historyKeymap } = await import('@codemirror/commands')
  const { oneDark } = await import('@codemirror/theme-one-dark')
  const lang = props.lang === 'css'
    ? (await import('@codemirror/lang-css')).css()
    : (await import('@codemirror/lang-html')).html()

  const isDark = document.documentElement.classList.contains('dark')
  const extensions: Extension[] = [
    history(),
    keymap.of([...defaultKeymap, ...historyKeymap]),
    lang,
    EditorView.updateListener.of((update) => {
      if (update.docChanged)
        model.value = update.state.doc.toString()
    }),
    EditorView.theme({
      '&': { fontSize: '13px', minHeight: '160px', border: '1px solid #d6d3d1', borderRadius: '2px' },
      '.cm-scroller': { fontFamily: 'ui-monospace, monospace' },
    }),
  ]
  if (isDark)
    extensions.push(oneDark)

  view = new EditorView({
    state: EditorState.create({
      doc: model.value,
      extensions,
    }),
    parent: el.value,
  })
})

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
