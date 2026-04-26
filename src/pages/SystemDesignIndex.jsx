import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { SYSTEM_DESIGN, TYPE_LABEL, TYPE_COLOR } from '../constants/systemDesignRegistry'

// ── Animations ────────────────────────────────────────────────────────────────

const grid = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}
const card = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 24 } },
}

// ── SD Card ───────────────────────────────────────────────────────────────────

function SDCard({ item }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Link
        to={item.path}
        className="block rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6 hover:border-violet-500/50 hover:bg-violet-500/5 transition-colors"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="font-semibold text-white">{item.title}</h3>
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_COLOR[item.type]}`}>
            {TYPE_LABEL[item.type]}
          </span>
        </div>

        <p className="mb-4 text-sm text-slate-400 leading-relaxed">{item.metaphor}</p>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-md bg-violet-500/15 px-2 py-0.5 text-xs text-violet-300">
            {item.category}
          </span>
          {item.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-slate-400"
            >
              {tag}
            </span>
          ))}
        </div>
      </Link>
    </motion.div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

const TABS = ['all', 'concept', 'design']
const TAB_LABEL = { all: 'All', concept: 'Concepts', design: 'Designs' }

export default function SystemDesignIndex() {
  const [tab,   setTab]   = useState('all')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return SYSTEM_DESIGN.filter((item) => {
      const matchTab = tab === 'all' || item.type === tab
      const matchQ   = !q
        || item.title.toLowerCase().includes(q)
        || item.category.toLowerCase().includes(q)
        || item.tags.some((t) => t.toLowerCase().includes(q))
      return matchTab && matchQ
    })
  }, [tab, query])

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">System Design</h1>
        <p className="mt-2 text-slate-400">
          Step through real architectures — from individual concepts to full system walkthroughs.
        </p>
      </div>

      {/* Filter bar */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative w-full sm:max-w-sm">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
            width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, category or tag…"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-violet-500/60 transition-colors"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        {/* Type tabs */}
        <div className="flex gap-2">
          {TABS.map((t) => {
            const count  = t === 'all' ? SYSTEM_DESIGN.length : SYSTEM_DESIGN.filter((i) => i.type === t).length
            const active = tab === t
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  active
                    ? 'bg-violet-600 text-white'
                    : 'border border-white/10 bg-white/[0.04] text-slate-400 hover:text-white hover:border-white/20'
                }`}
              >
                {TAB_LABEL[t]}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
                  active ? 'bg-white/20 text-white' : 'bg-white/8 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Count */}
      <p className="text-xs text-slate-600">
        {filtered.length === SYSTEM_DESIGN.length
          ? `Showing all ${SYSTEM_DESIGN.length} topic${SYSTEM_DESIGN.length !== 1 ? 's' : ''}`
          : `${filtered.length} of ${SYSTEM_DESIGN.length} topics`}
      </p>

      {/* Grid */}
      <AnimatePresence mode="wait">
        {filtered.length > 0 ? (
          <motion.div
            key={`${tab}-${query}`}
            variants={grid}
            initial="hidden"
            animate="show"
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filtered.map((item) => (
              <motion.div key={item.id} variants={card}>
                <SDCard item={item} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-white/8 bg-white/[0.02] py-20 text-center space-y-3"
          >
            <p className="text-slate-400 font-medium">No matching topics</p>
            <p className="text-sm text-slate-600">
              Try a different search or{' '}
              <button
                onClick={() => { setQuery(''); setTab('all') }}
                className="text-violet-400 hover:text-violet-300 underline underline-offset-2 transition-colors"
              >
                clear all filters
              </button>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
