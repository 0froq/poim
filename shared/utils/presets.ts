import type { PoimPresetId } from '../types/post'

export interface PoimPreset {
  id: PoimPresetId
  label: string
  html: string
  css: string
}

const BASE_HTML = `
<div class="poim-card">
  <div class="poim-header">
    <img data-poim="author-avatar" class="poim-avatar" alt="" />
    <div class="poim-author">
      <div data-poim="author-name" class="poim-name"></div>
      <div data-poim="author-handle" class="poim-handle"></div>
    </div>
    <time data-poim="time" class="poim-time"></time>
  </div>
  <div data-poim="text" class="poim-text"></div>
  <div data-poim="media" class="poim-media"></div>
  <div data-poim="quote" class="poim-quote" hidden>
    <div class="poim-quote-inner">
      <span data-poim="author-name" class="poim-name"></span>
      <span data-poim="author-handle" class="poim-handle"></span>
      <div data-poim="text" class="poim-text"></div>
    </div>
  </div>
  <div class="poim-footer">
    <div data-poim="metrics" class="poim-metrics"></div>
    <div data-poim="badge" class="poim-badge"></div>
    <a data-poim="brand" class="poim-brand">poim</a>
  </div>
</div>
`.trim()

const TOKEN_CSS = `
:host, .poim-stage {
  display: block;
  --poim-bg: #f5f5f4;
  --poim-fg: #1c1917;
  --poim-muted: #78716c;
  --poim-line: #d6d3d1;
  --poim-card: #fafaf9;
  --poim-serif: "EB Garamond Variable", "EB Garamond", ui-serif, serif;
  --poim-sans: "Instrument Sans Variable", "Instrument Sans", ui-sans-serif, sans-serif;
  color-scheme: light;
  color: var(--poim-fg);
  font-family: var(--poim-sans);
}
.poim-stage[data-theme="dark"], :host([data-theme="dark"]) {
  --poim-bg: #0c0a09;
  --poim-fg: #e7e5e4;
  --poim-muted: #a8a29e;
  --poim-line: #44403c;
  --poim-card: #1c1917;
  color-scheme: dark;
}
.poim-card {
  position: relative;
  background: var(--poim-card);
  color: var(--poim-fg);
  border: 1px solid var(--poim-line);
  padding: 1.25rem 1.35rem 1rem;
  max-width: 36rem;
  box-sizing: border-box;
}
.poim-header {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}
.poim-avatar {
  width: 2.5rem;
  height: 2.5rem;
  object-fit: cover;
  border: 1px solid var(--poim-line);
  flex: none;
}
.poim-name { font-weight: 600; }
.poim-handle, .poim-time, .poim-metrics, .poim-badge, .poim-brand {
  color: var(--poim-muted);
  font-size: 0.85em;
}
.poim-author { flex: 1; min-width: 0; }
.poim-time { margin-left: auto; }
.poim-text {
  margin: 0.9rem 0 0;
  white-space: pre-wrap;
  line-height: 1.65;
}
.poim-media {
  display: grid;
  gap: 0.35rem;
  margin-top: 0.9rem;
}
.poim-media[data-count="2"], .poim-media[data-count="4"] { grid-template-columns: 1fr 1fr; }
.poim-image, .poim-video {
  width: 100%;
  max-height: 22rem;
  object-fit: cover;
  border: 1px solid var(--poim-line);
  display: block;
}
.poim-quote {
  margin-top: 0.9rem;
  padding: 0.7rem 0.85rem;
  border: 1px dashed var(--poim-line);
}
.poim-quote .poim-handle { margin-left: 0.4rem; }
.poim-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  align-items: baseline;
  margin-top: 1rem;
  padding-top: 0.7rem;
  border-top: 1px dashed var(--poim-line);
}
.poim-brand {
  margin-left: auto;
  text-decoration: none;
  border-bottom: 1px dashed var(--poim-line);
  font-style: italic;
  font-family: var(--poim-serif);
}
`

const PLAIN_EXTRA = `
.poim-card {
  transform: rotate(-0.35deg);
  box-shadow: 0 1px 2px rgb(28 25 23 / 0.06), 0 10px 28px -16px rgb(28 25 23 / 0.25);
}
.poim-name { font-family: var(--poim-serif); font-size: 1.15em; }
`

const MINIMAL_EXTRA = `
.poim-card {
  background: transparent;
  box-shadow: none;
  border-color: var(--poim-line);
  padding: 0.2rem 0 0;
}
.poim-footer { border-top-style: solid; }
`

const HUMANIST_EXTRA = `
.poim-card { font-family: var(--poim-serif); }
.poim-text { font-size: 1.12em; line-height: 1.8; }
.poim-name { font-style: italic; letter-spacing: 0.01em; }
.poim-quote { font-style: italic; }
`

export const POIM_PRESETS: PoimPreset[] = [
  { id: 'plain', label: '普通', html: BASE_HTML, css: TOKEN_CSS + PLAIN_EXTRA },
  { id: 'minimal', label: '简洁', html: BASE_HTML, css: TOKEN_CSS + MINIMAL_EXTRA },
  { id: 'humanist', label: '人文', html: BASE_HTML, css: TOKEN_CSS + HUMANIST_EXTRA },
]

export function getPreset(id: PoimPresetId): PoimPreset {
  return POIM_PRESETS.find(p => p.id === id) ?? POIM_PRESETS[0]!
}
