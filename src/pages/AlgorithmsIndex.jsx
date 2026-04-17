import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AlgoCard from '../components/ui/AlgoCard'
import { ALGORITHMS, DIFFICULTY_COLOR } from '../constants/algorithmRegistry'

// ── Category display names ─────────────────────────────────────────────────────
// Add an entry here whenever a new category is introduced.

const CATEGORY_LABELS = {
  'arrays-hashing':      'Arrays & Hashing',
  'two-pointers':        'Two Pointers',
  'stack':               'Stack',
  'binary-search':       'Binary Search',
  'sliding-window':      'Sliding Window',
  'linked-list':         'Linked List',
  'trees':               'Trees',
  'tries':               'Tries',
  'backtracking':        'Backtracking',
  'heap-priority-queue': 'Heap / Priority Queue',
  'graphs':              'Graphs',
  'advanced-graphs':     'Advanced Graphs',
  '1d-dp':               '1-D DP',
  '2d-dp':               '2-D DP',
  'greedy':              'Greedy',
  'intervals':           'Intervals',
  'bit-manipulation':    'Bit Manipulation',
  'math-geometry':       'Math & Geometry',
}

function categoryLabel(cat) {
  return CATEGORY_LABELS[cat] ?? cat
}

// ── Derive the ordered set of categories present in the registry ──────────────

const CATEGORIES = ['all', ...[...new Set(ALGORITHMS.map((a) => a.category))]]

// ── Animations ────────────────────────────────────────────────────────────────

const grid = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}
const card = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 24 } },
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AlgorithmsIndex() {
  const [query,    setQuery]    = useState('')
  const [category, setCategory] = useState('all')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return ALGORITHMS.filter((a) => {
      const matchCat = category === 'all' || a.category === category
      const matchQ   = !q
        || a.title.toLowerCase().includes(q)
        || a.pattern.toLowerCase().includes(q)
        || a.tags.some((t) => t.toLowerCase().includes(q))
      return matchCat && matchQ
    })
  }, [query, category])

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Algorithms</h1>
        <p className="mt-2 text-slate-400">
          {ALGORITHMS.length} visualizer{ALGORITHMS.length !== 1 ? 's' : ''} — step through each one at your own pace.
        </p>
      </div>

      {/* Filter bar */}
      <div className="space-y-3">
        {/* Search input */}
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
            placeholder="Search by name, pattern or tag…"
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

        {/* Category pills */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const count  = cat === 'all' ? ALGORITHMS.length : ALGORITHMS.filter((a) => a.category === cat).length
            const active = category === cat
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  active
                    ? 'bg-violet-600 text-white'
                    : 'border border-white/10 bg-white/[0.04] text-slate-400 hover:text-white hover:border-white/20'
                }`}
              >
                {cat === 'all' ? 'All' : categoryLabel(cat)}
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
        {filtered.length === ALGORITHMS.length
          ? `Showing all ${ALGORITHMS.length} problems`
          : `${filtered.length} of ${ALGORITHMS.length} problems`}
      </p>

      {/* Grid */}
      <AnimatePresence mode="wait">
        {filtered.length > 0 ? (
          <motion.div
            key={`${category}-${query}`}
            variants={grid}
            initial="hidden"
            animate="show"
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filtered.map((algo) => (
              <motion.div key={algo.id} variants={card}>
                <AlgoCard algo={algo} />
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
            <p className="text-slate-400 font-medium">No matching problems</p>
            <p className="text-sm text-slate-600">
              Try a different search or{' '}
              <button
                onClick={() => { setQuery(''); setCategory('all') }}
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
