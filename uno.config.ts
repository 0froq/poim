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
  },
  rules: [
    ['font-sans', { 'font-family': 'Instrument Sans Variable, Instrument Sans, ui-sans-serif, system-ui, sans-serif' }],
    ['font-serif', { 'font-family': 'EB Garamond Variable, EB Garamond, YshiPen-ShutiTC, ui-serif, serif' }],
    ['font-mono', { 'font-family': 'LXGW Bright Code TC, ui-monospace, monospace' }],
    ['font-stylish', { 'font-family': 'Caveat, cursive' }],
    ['font-script', { 'font-family': 'Ephesis, cursive' }],
  ],
  shortcuts: {
    'page-content': 'mx-auto max-w-[960px] block px-10 min-w-0',
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
