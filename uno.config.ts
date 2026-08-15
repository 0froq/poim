import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetTagify,
  presetTypography,
  presetWind4,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

export default defineConfig({
  theme: {
    breakpoints: {
      sm: '600px',
      md: '900px',
    },
    colors: {
      // 语义色 → 壳 token（浅深在 :root 翻转，组件不用写 dark: 变体）
      'paper': 'var(--poim-bg)',
      'surface': 'var(--poim-surface)',
      'ink': 'var(--poim-fg)',
      'muted': 'var(--poim-muted)',
      'faint': 'var(--poim-faint)',
      'line': 'var(--poim-line)',
      'line-strong': 'var(--poim-line-strong)',
      'accent': 'var(--poim-accent)',
      'danger': 'var(--poim-danger)',
    },
  },
  rules: [
    ['font-sans', { 'font-family': 'var(--poim-sans)' }],
    ['font-serif', { 'font-family': 'var(--poim-serif)' }],
    ['font-mono', { 'font-family': 'var(--poim-mono)' }],
  ],
  shortcuts: {
    'page-content': 'mx-auto max-w-[1024px] block px-6 md:px-10 min-w-0',
    'gen-layout': 'pb-24 grid gap-10 md:grid-cols-[minmax(0,25rem)_1fr]',
  },
  presets: [
    presetWind4(),
    presetIcons({
      scale: 1.2,
      collections: {
        carbon: () => import('@iconify-json/carbon/icons.json').then(i => i.default as any),
        solar: () => import('@iconify-json/solar/icons.json').then(i => i.default as any),
      },
    }),
    presetAttributify({
      strict: true,
      prefixedOnly: true,
      prefix: 'un-',
    }),
    presetTagify({
      prefix: 'un-',
    }),
    presetTypography(),
  ],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],
  layers: {
    default: 0,
    components: 1,
    utilities: 2,
  },
})
