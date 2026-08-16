<script setup lang="ts">
import type { PoimTheme } from '~~/shared/types/post'
import type { CardTokenOverrides, ColorTokenKey } from '~~/shared/utils/card-tokens'
import {
  CARD_COLOR_DEFAULTS,
  COLOR_KEYS,
  COLOR_META,
  emptyTokenOverrides,
  RADIUS_OPTIONS,
  SANS_OPTIONS,
  SERIF_OPTIONS,
} from '~~/shared/utils/card-tokens'

const props = defineProps<{ theme: PoimTheme }>()
// 可视化 token（RE-9）：色 / 字体 / 圆角。
// 颜色按当前卡片主题编辑（浅深独立维度）；字体与圆角两主题共用。
const model = defineModel<CardTokenOverrides>({ required: true })
const themeLabel = computed(() => (props.theme === 'light' ? '浅色' : '深色'))

function colorValue(key: ColorTokenKey): string {
  const theme = props.theme
  return model.value[theme][key] ?? CARD_COLOR_DEFAULTS[theme][key]
}

function setColor(key: ColorTokenKey, value: string): void {
  const theme = props.theme
  model.value = {
    ...model.value,
    [theme]: { ...model.value[theme], [key]: value },
  }
}

function setFont(key: 'serif' | 'sans', value: string): void {
  model.value = { ...model.value, [key]: value }
}

function setRadius(value: string): void {
  model.value = { ...model.value, radius: value }
}

function resetTokens(): void {
  model.value = emptyTokenOverrides()
}

function onColorInput(key: ColorTokenKey, event: Event): void {
  setColor(key, (event.target as HTMLInputElement).value)
}

function onSelectChange(key: 'serif' | 'sans', event: Event): void {
  setFont(key, (event.target as HTMLSelectElement).value)
}
</script>

<template>
  <div
    class="poim-panel"
    un-p-4
    un-space-y-5
  >
    <div
      un-flex
      un-items-baseline
      un-justify-between
      un-gap-3
    >
      <p class="poim-label">
        颜色 · {{ themeLabel }}（随卡片主题）
      </p>
      <button
        type="button"
        class="poim-btn poim-btn--ghost"
        @click="resetTokens"
      >
        重置 token
      </button>
    </div>

    <div un-space-y-2.5>
      <label
        v-for="key in COLOR_KEYS"
        :key="key"
        un-flex
        un-items-center
        un-gap-2.5
      >
        <span
          class="poim-label"
          un-mb-0
          un-w-20
        >
          {{ COLOR_META[key].label }}
        </span>
        <input
          type="color"
          class="poim-swatch"
          :value="colorValue(key)"
          :aria-label="COLOR_META[key].label"
          @input="onColorInput(key, $event)"
        >
        <code
          un-font-mono
          un-text-xs
          un-text-faint
        >{{ colorValue(key) }}</code>
      </label>
    </div>

    <div un-space-y-2.5>
      <p class="poim-label">
        字体（浅深共用）
      </p>
      <select
        class="poim-field poim-select"
        :value="model.serif"
        @change="onSelectChange('serif', $event)"
      >
        <option
          v-for="opt in SERIF_OPTIONS"
          :key="opt.value"
          :value="opt.value"
        >
          {{ opt.label }}
        </option>
      </select>
      <select
        class="poim-field poim-select"
        :value="model.sans"
        @change="onSelectChange('sans', $event)"
      >
        <option
          v-for="opt in SANS_OPTIONS"
          :key="opt.value"
          :value="opt.value"
        >
          {{ opt.label }}
        </option>
      </select>
    </div>

    <div un-space-y-2.5>
      <p class="poim-label">
        卡片圆角（浅深共用）
      </p>
      <div
        un-flex
        un-flex-wrap
        un-gap-2
      >
        <button
          v-for="opt in RADIUS_OPTIONS"
          :key="opt.value"
          type="button"
          class="poim-btn"
          :class="{ 'poim-btn--active': (model.radius ?? '') === opt.value }"
          :aria-pressed="(model.radius ?? '') === opt.value"
          @click="setRadius(opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>
  </div>
</template>
