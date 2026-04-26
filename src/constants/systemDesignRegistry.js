import dns          from '../content/system-design/concepts/dns/index.js'
import urlShortener from '../content/system-design/designs/url-shortener/index.js'

// Ordered list — add new topics here, one import + one array entry.
export const SYSTEM_DESIGN = [
  dns,
  urlShortener,
]

// type → display label
export const TYPE_LABEL = {
  concept: 'Concept',
  design:  'Design',
}

// type → colour tokens
export const TYPE_COLOR = {
  concept: 'text-sky-400 bg-sky-400/10',
  design:  'text-violet-400 bg-violet-400/10',
}
