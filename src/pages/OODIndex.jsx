import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { OOD_PATTERNS, OOD_QUESTIONS, OOD_COLORS, OOD_CATEGORY_LABELS } from '../constants/oodRegistry'

const DIFFICULTY_COLOR = {
  Easy:   'text-emerald-400 bg-emerald-500/10',
  Medium: 'text-amber-400 bg-amber-500/10',
  Hard:   'text-rose-400 bg-rose-500/10',
}

const grid = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } }
const card = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 24 } } }

const PATTERN_CATEGORIES = ['all', 'creational', 'structural', 'behavioral']

// ── Pattern card ──────────────────────────────────────────────────────────────

function PatternCard({ pattern, number }) {
  const c = OOD_COLORS[pattern.color]
  return (
    <motion.div className="glow-card rounded-2xl" whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
      <Link
        to={`/ood/${pattern.id}`}
        className="group block rounded-2xl border border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] transition-all duration-200 overflow-hidden"
      >
        <div className={`h-1 w-full ${c.dot}`} />
        <div className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <span className="inline-block rounded border border-white/10 bg-white/[0.06] px-1.5 py-0.5 text-[11px] font-mono font-medium text-slate-400">#{number}</span>
              <h2 className="text-base font-bold text-white">{pattern.title}</h2>
              <p className={`text-xs font-medium ${c.text}`}>{pattern.tagline}</p>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold border ${c.badgeBg} ${c.badgeBorder} ${c.text}`}>
              {OOD_CATEGORY_LABELS[pattern.category]}
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{pattern.description}</p>
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 group-hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100">
            Explore pattern
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

// ── Question card ─────────────────────────────────────────────────────────────

function QuestionCard({ question, number }) {
  const c = OOD_COLORS[question.color]
  return (
    <motion.div className="glow-card rounded-2xl" whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
      <Link
        to={`/ood/${question.id}`}
        className="group block rounded-2xl border border-white/10 bg-white/5 hover:border-blue-500/40 hover:bg-blue-500/5 transition-colors overflow-hidden"
      >
        <div className={`h-1 w-full ${c.dot}`} />
        <div className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <span className="inline-block rounded border border-white/10 bg-white/[0.06] px-1.5 py-0.5 text-[11px] font-mono font-medium text-slate-400">#{number}</span>
              <h2 className="text-base font-bold text-white">{question.title}</h2>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${DIFFICULTY_COLOR[question.difficulty]}`}>
              {question.difficulty}
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">{question.tagline}</p>
          <div className="flex flex-wrap gap-1.5">
            {question.patternsUsed.slice(0, 3).map((p) => (
              <span key={p} className="rounded-md bg-white/5 border border-white/8 px-2 py-0.5 text-[10px] text-slate-500">{p}</span>
            ))}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function OODIndex() {
  const [query,    setQuery]    = useState('')
  const [category, setCategory] = useState('all')

  const filteredPatterns = useMemo(() => {
    const q = query.trim().toLowerCase()
    return OOD_PATTERNS.filter((p) => {
      const matchCat = category === 'all' || p.category === category
      const matchQ   = !q || p.title.toLowerCase().includes(q) || p.tagline.toLowerCase().includes(q)
      return matchCat && matchQ
    })
  }, [query, category])

  const filteredQuestions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (category !== 'all') return []
    return OOD_QUESTIONS.filter((q2) => !q || q2.title.toLowerCase().includes(q) || q2.tagline.toLowerCase().includes(q))
  }, [query, category])

  return (
    <div className="space-y-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Object Oriented Design</h1>
          <p className="mt-2 text-slate-400">
            Design patterns and interview questions — the vocabulary of object-oriented software.
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
            placeholder="Search patterns or questions…"
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

      {/* ── Design Patterns section ─────────────────────────────────────────── */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-1 h-5 rounded-full bg-violet-400" />
            <h2 className="text-lg font-semibold text-white">Design Patterns</h2>
            <span className="rounded-full px-2 py-0.5 text-[11px] font-medium bg-violet-500/15 text-violet-300">
              {filteredPatterns.length} pattern{filteredPatterns.length !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="mt-1 ml-4 text-sm text-slate-500">The 23 GoF patterns — reusable solutions to recurring design problems.</p>
        </div>

        {/* Category pills */}
        <div className="ml-4 flex flex-wrap gap-1.5">
          {PATTERN_CATEGORIES.map((cat) => {
            const count  = cat === 'all' ? OOD_PATTERNS.length : OOD_PATTERNS.filter((p) => p.category === cat).length
            const active = category === cat
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  active ? 'bg-blue-600 text-white' : 'border border-white/10 bg-white/[0.04] text-slate-400 hover:text-white hover:border-white/20'
                }`}
              >
                {cat === 'all' ? 'All' : OOD_CATEGORY_LABELS[cat]}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none ${active ? 'bg-white/20 text-white' : 'bg-white/8 text-slate-500'}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        <AnimatePresence mode="wait">
          {filteredPatterns.length > 0 ? (
            <motion.div key={`patterns-${category}-${query}`} variants={grid} initial="hidden" animate="show"
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPatterns.map((p) => (
                <motion.div key={p.id} variants={card}>
                  <PatternCard pattern={p} number={OOD_PATTERNS.findIndex((x) => x.id === p.id) + 1} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.p key="empty-patterns" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-sm text-slate-600 pl-4">
              No patterns match.{' '}
              <button onClick={() => { setQuery(''); setCategory('all') }} className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors">
                Clear filters
              </button>
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Divider */}
      {category === 'all' && <div className="border-t border-white/[0.06]" />}

      {/* ── Interview Questions section ─────────────────────────────────────── */}
      {category === 'all' && (
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-1 h-5 rounded-full bg-blue-400" />
              <h2 className="text-lg font-semibold text-white">Interview Questions</h2>
              <span className="rounded-full px-2 py-0.5 text-[11px] font-medium bg-blue-500/15 text-blue-300">
                {filteredQuestions.length} question{filteredQuestions.length !== 1 ? 's' : ''}
              </span>
            </div>
            <p className="mt-1 ml-4 text-sm text-slate-500">Classic OOD problems — model real systems from scratch.</p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={`questions-${query}`} variants={grid} initial="hidden" animate="show"
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredQuestions.map((q, i) => (
                <motion.div key={q.id} variants={card}>
                  <QuestionCard question={q} number={i + 1} />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

    </div>
  )
}
