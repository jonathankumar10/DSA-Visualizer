import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AI_ITEMS, AI_COLORS, AI_CATEGORY_LABELS } from '../constants/aiRegistry'

const grid = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } }
const card = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 24 } } }

const CATEGORIES = ['all', 'history', 'ml', 'llms', 'workflows']

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
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <span className="inline-block rounded border border-white/10 bg-white/[0.06] px-1.5 py-0.5 text-[11px] font-mono font-medium text-slate-400">#{number}</span>
              <h2 className="text-base font-bold text-white">{item.title}</h2>
              <p className={`text-xs font-medium ${c.text}`}>{item.tagline}</p>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold border ${c.badgeBg} ${c.badgeBorder} ${c.text}`}>
              {AI_CATEGORY_LABELS[item.category]}
            </span>
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

export default function AIIndex() {
  const [query,    setQuery]    = useState('')
  const [category, setCategory] = useState('all')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return AI_ITEMS.filter((item) => {
      const matchCat = category === 'all' || item.category === category
      const matchQ   = !q || item.title.toLowerCase().includes(q) || item.tagline.toLowerCase().includes(q)
      return matchCat && matchQ
    })
  }, [query, category])

  return (
    <div className="space-y-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Artificial Intelligence</h1>
          <p className="mt-2 text-slate-400">
            From neural networks to LLMs — the concepts, intuitions, and workflows behind modern AI.
          </p>
        </div>

        {/* Search */}
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
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((cat) => {
          const count  = cat === 'all' ? AI_ITEMS.length : AI_ITEMS.filter((i) => i.category === cat).length
          const active = category === cat
          return (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors flex items-center gap-1.5 ${
                active ? 'bg-blue-600 text-white' : 'border border-white/10 bg-white/[0.04] text-slate-400 hover:text-white hover:border-white/20'
              }`}
            >
              {cat === 'all' ? 'All' : AI_CATEGORY_LABELS[cat]}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none ${active ? 'bg-white/20 text-white' : 'bg-white/8 text-slate-500'}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Grid */}
      <AnimatePresence mode="wait">
        {filtered.length > 0 ? (
          <motion.div
            key={`${category}-${query}`}
            variants={grid} initial="hidden" animate="show"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filtered.map((item) => (
              <motion.div key={item.id} variants={card}>
                <AICard item={item} number={AI_ITEMS.findIndex((x) => x.id === item.id) + 1} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.p key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-sm text-slate-600">
            No topics match.{' '}
            <button onClick={() => { setQuery(''); setCategory('all') }} className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors">
              Clear filters
            </button>
          </motion.p>
        )}
      </AnimatePresence>

    </div>
  )
}
