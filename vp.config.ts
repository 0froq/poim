import { liangmi } from '@liangmi/vp-config'

// Vite+ loads lint and fmt from this file via `-c vp.config.ts`. Nuxt owns
// application Vite via `nuxt.config.ts`. This file is not named vite.config.*
// so Nuxt's B5004 external-config warning does not fire. Tests stay on
// vitest.config.ts.
const siteLintIgnores = [
  '.agents/**',
  '.data/**',
  '.nuxt/**',
  '.output/**',
  'dist/**',
  'docs/**',
  'public/**',
  'vendor/**',
]

const siteFmtIgnores = [
  ...siteLintIgnores,
  '**/generated/**',
  'AGENTS.md',
  'PROJECT.md',
  'pnpm-lock.yaml',
  'skills-lock.json',
]

export default liangmi({
  lint: [
    {
      name: 'poim/ignores',
      ignores: siteLintIgnores,
    },
    {
      // Preset rules that do not match this Nuxt site's existing source.
      // Keep the PR on the toolchain; do not rewrite application code to the
      // style/restriction allowlist in one step.
      name: 'poim/compat',
      rules: {
        'eqeqeq': 'off',
        'eslint/class-methods-use-this': 'off',
        'eslint/default-case': 'off',
        'eslint/max-classes-per-file': 'off',
        'eslint/no-empty': 'off',
        'eslint/no-param-reassign': 'off',
        'import/extensions': 'off',
        'import/no-cycle': 'off',
        'import/no-named-as-default-member': 'off',
        'import/no-default-export': 'off',
        'import/no-unassigned-import': 'off',
        'no-array-for-each': 'off',
        'no-negated-condition': 'off',
        'no-underscore-dangle': 'off',
        'no-useless-assignment': 'off',
        'node/no-sync': 'off',
        'oxc/approx-constant': 'off',
        'oxc/no-map-spread': 'off',
        'prefer-import-meta-properties': 'off',
        'promise/always-return': 'off',
        'promise/no-callback-in-promise': 'off',
        'unicorn/consistent-function-scoping': 'off',
        'unicorn/explicit-length-check': 'off',
        'unicorn/no-array-reduce': 'off',
        'unicorn/no-array-reverse': 'off',
        'unicorn/no-array-sort': 'off',
        'unicorn/no-useless-undefined': 'off',
        'unicorn/prefer-array-find': 'off',
        'unicorn/prefer-array-some': 'off',
        'unicorn/prefer-code-point': 'off',
        'unicorn/prefer-dom-node-append': 'off',
        'unicorn/prefer-dom-node-dataset': 'off',
        'unicorn/prefer-query-selector': 'off',
        'unicorn/prefer-string-replace-all': 'off',
      },
    },
    {
      name: 'poim/tests',
      files: ['**/*.test.ts'],
      rules: {
        'no-console': 'off',
        'vitest/no-conditional-expect': 'off',
        'vitest/require-mock-type-parameters': 'off',
        'vitest/require-to-throw-message': 'off',
        'vitest/valid-expect': 'off',
      },
    },
    {
      name: 'poim/worker',
      files: ['worker/**'],
      rules: {
        'no-console': 'off',
      },
    },
  ],
  fmt: {
    quoteProps: 'consistent',
    singleAttributePerLine: true,
    htmlWhitespaceSensitivity: 'strict',
    trailingComma: 'all',
    sortImports: false,
    sortPackageJson: false,
    ignorePatterns: siteFmtIgnores,
  },
})
  .exclude(['pack', 'staged', 'test'])
  .option([
    {
      path: '.',
      node: true,
      browser: true,
      vue: true,
      react: false,
    },
    {
      path: 'worker',
      node: true,
      browser: false,
      vue: false,
      react: false,
    },
  ])
  .remove('liangmi/style')
  .override('liangmi/options', {
    options: {
      typeAware: false,
      typeCheck: false,
    },
  })
