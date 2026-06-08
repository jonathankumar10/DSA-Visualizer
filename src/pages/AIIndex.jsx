import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AI_ITEMS, AI_COLORS, AI_CATEGORY_LABELS } from '../constants/aiRegistry'

const grid = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } }
const card = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 24 } } }

// ── Category accent colors ────────────────────────────────────────────────────

const CATEGORY_ACCENT = {
  history:       { bar: 'bg-amber-400',   badge: 'bg-amber-500/15 text-amber-300' },
  ml:            { bar: 'bg-blue-400',    badge: 'bg-blue-500/15 text-blue-300' },
  llms:          { bar: 'bg-violet-400',  badge: 'bg-violet-500/15 text-violet-300' },
  workflows:     { bar: 'bg-teal-400',    badge: 'bg-teal-500/15 text-teal-300' },
  agents:        { bar: 'bg-sky-400',     badge: 'bg-sky-500/15 text-sky-300' },
  production:    { bar: 'bg-emerald-400', badge: 'bg-emerald-500/15 text-emerald-300' },
  'live-coding': { bar: 'bg-rose-400',    badge: 'bg-rose-500/15 text-rose-300' },
}

// Category order follows registry insertion order
const CATEGORY_ORDER = [...new Set(AI_ITEMS.map((i) => i.category))]

// ── Card ──────────────────────────────────────────────────────────────────────

function AICard({ item, number }) {
  const c = AI_COLORS[item.color]
  return (
    <motion.div className="glow-card rounded-2xl" whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
      <Link
        to={`/ai/${item.id}`}
        className="group block rounded-2xl border border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] transition-all duration-200 overflow-hidden"
      >
        <div className={`h-1 w-full ${c.dot}`} />
        <div className="p-5 space-y-3">
          <div className="space-y-1">
            <span className="inline-block rounded border border-white/10 bg-white/[0.06] px-1.5 py-0.5 text-[11px] font-mono font-medium text-slate-400">#{number}</span>
            <h2 className="text-base font-bold text-white leading-snug">{item.title}</h2>
            <p className={`text-xs font-medium ${c.text}`}>{item.tagline}</p>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{item.description}</p>
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 group-hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100">
            Explore topic
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

// ── Category group ────────────────────────────────────────────────────────────

function CategoryGroup({ category, items, query }) {
  const a = CATEGORY_ACCENT[category] ?? { bar: 'bg-slate-400', badge: 'bg-slate-500/15 text-slate-300' }
  const allInCategory = AI_ITEMS.filter((i) => i.category === category)
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2.5">
        <div className={`w-1 h-4 rounded-full shrink-0 ${a.bar}`} />
        <h3 className="text-xs font-semibold text-slate-300 tracking-widest uppercase">
          {AI_CATEGORY_LABELS[category] ?? category}
        </h3>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${a.badge}`}>
          {items.length}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${category}-${query}`}
          variants={grid}
          initial="hidden"
          animate="show"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {items.map((item) => (
            <motion.div key={item.id} variants={card}>
              <AICard item={item} number={allInCategory.findIndex((x) => x.id === item.id) + 1} />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AIIndex() {
  const [query, setQuery] = useState('')

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const match = (item) =>
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.tagline.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)

    return CATEGORY_ORDER
      .map((cat) => ({ category: cat, items: AI_ITEMS.filter((i) => i.category === cat && match(i)) }))
      .filter((g) => g.items.length > 0)
  }, [query])

  const totalVisible = groups.reduce((sum, g) => sum + g.items.length, 0)
  const clearSearch   = () => setQuery('')

  return (
    <div className="space-y-12">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Artificial Intelligence</h1>
          <p className="mt-2 text-slate-400">
            From neural networks to production AI systems — the concepts, intuitions, and engineering behind modern AI.
          </p>
        </div>

        <div className="relative w-full sm:w-64 shrink-0">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
            width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search topics…"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-blue-500/60 transition-colors"
          />
          {query && (
            <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Grouped content */}
      {groups.length > 0 ? (
        <div className="space-y-10">
          {groups.map((group, i) => (
            <div key={group.category}>
              {i > 0 && <div className="border-t border-white/[0.05] mb-10" />}
              <CategoryGroup category={group.category} items={group.items} query={query} />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-600">
          No topics match.{' '}
          <button onClick={clearSearch} className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors">
            Clear search
          </button>
        </p>
      )}

    </div>
  )
}
