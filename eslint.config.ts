import antfu from '@antfu/eslint-config'

export default antfu({
  unocss: true,
  pnpm: true,
  typescript: true,
  vue: true,
  // PROJECT.md 是用户维护的合同文件，不做格式改写
  ignores: ['PROJECT.md'],
  rules: {
    'vue/max-attributes-per-line': ['error', {
      singleline: { max: 1 },
      multiline: { max: 1 },
    }],
    'unused-imports/no-unused-imports': 'off',
  },
  formatters: {
    css: true,
    html: true,
    markdown: 'dprint',
  },
})
