// Stable per-browser UUID for rate limiting (never tied to auth)
export function getUid() {
  const key = 'algviz-uid'
  let uid = localStorage.getItem(key)
  if (!uid) {
    uid = crypto.randomUUID()
    localStorage.setItem(key, uid)
  }
  return uid
}

// Lightweight markdown renderer (bold + inline code only)
export function renderMarkdown(text) {
  // Split on **bold** and `code` tokens
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="rounded bg-white/10 px-1 py-0.5 text-[11px] font-mono">{part.slice(1, -1)}</code>
    }
    return part
  })
}
