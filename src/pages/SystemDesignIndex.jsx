import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { SYSTEM_DESIGN, SD_CATEGORY_LABELS } from '../constants/systemDesignRegistry'

// ── Animations ────────────────────────────────────────────────────────────────

const grid = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}
const card = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 24 } },
}

// ── Category accents ──────────────────────────────────────────────────────────

const CATEGORY_ACCENT = {
  hardware:      { bar: 'bg-amber-400',   badge: 'bg-amber-500/15 text-amber-300' },
  requirements:  { bar: 'bg-green-400',   badge: 'bg-green-500/15 text-green-300' },
  networking:    { bar: 'bg-cyan-400',    badge: 'bg-cyan-500/15 text-cyan-300' },
  apis:          { bar: 'bg-emerald-400', badge: 'bg-emerald-500/15 text-emerald-300' },
  caching:       { bar: 'bg-orange-400',  badge: 'bg-orange-500/15 text-orange-300' },
  proxies:       { bar: 'bg-yellow-400',  badge: 'bg-yellow-500/15 text-yellow-300' },
  storage:       { bar: 'bg-sky-400',     badge: 'bg-sky-500/15 text-sky-300' },
  databases:     { bar: 'bg-sky-400',     badge: 'bg-sky-500/15 text-sky-300' },
  reliability:   { bar: 'bg-rose-400',    badge: 'bg-rose-500/15 text-rose-300' },
  scalability:   { bar: 'bg-purple-400',  badge: 'bg-purple-500/15 text-purple-300' },
  messaging:     { bar: 'bg-indigo-400',  badge: 'bg-indigo-500/15 text-indigo-300' },
  observability: { bar: 'bg-teal-400',    badge: 'bg-teal-500/15 text-teal-300' },
  architecture:  { bar: 'bg-violet-400',  badge: 'bg-violet-500/15 text-violet-300' },
}
const DEFAULT_ACCENT = { bar: 'bg-slate-400', badge: 'bg-slate-500/15 text-slate-300' }

function accent(cat) { return CATEGORY_ACCENT[cat] ?? DEFAULT_ACCENT }
function catLabel(slug) {
  return SD_CATEGORY_LABELS[slug] ?? slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// ── Stable data derived from the registry (module-level, not per-render) ─────

const ALL_CONCEPTS = SYSTEM_DESIGN.filter((i) => i.type === 'concept')
const ALL_DESIGNS  = SYSTEM_DESIGN.filter((i) => i.type === 'design')

// Category order follows registry insertion order
const CONCEPT_CATEGORY_ORDER = [...new Set(ALL_CONCEPTS.map((i) => i.category))]

// ── Card ──────────────────────────────────────────────────────────────────────

const CARD_HOVER = {
  concept: 'hover:border-sky-500/50 hover:bg-sky-500/[0.04]',
  design:  'hover:border-blue-500/50 hover:bg-blue-500/[0.05]',
}

function SDCard({ item }) {
  return (
    <motion.div
      className="glow-card rounded-2xl"
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Link
        to={item.path}
        className={`group block rounded-2xl border border-white/10 bg-white/5 p-5 transition-colors h-full ${CARD_HOVER[item.type]}`}
      >
        <h3 className="mb-2 font-semibold text-white leading-snug">{item.title}</h3>
        <p className="mb-4 text-sm text-slate-400 leading-relaxed line-clamp-3">{item.description}</p>
        <div className="flex flex-wrap gap-1.5">
          {item.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-slate-500">
              {tag}
            </span>
          ))}
        </div>
      </Link>
    </motion.div>
  )
}

// ── Category group ────────────────────────────────────────────────────────────

function CategoryGroup({ category, items, query }) {
  const a = accent(category)
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2.5">
        <div className={`w-1 h-4 rounded-full shrink-0 ${a.bar}`} />
        <h3 className="text-xs font-semibold text-slate-300 tracking-widest uppercase">
          {catLabel(category)}
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
              <SDCard item={item} />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SystemDesignIndex() {
  const [query, setQuery] = useState('')

  const { conceptGroups, designs } = useMemo(() => {
    const q = query.trim().toLowerCase()
    const match = (item) =>
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.tags.some((t) => t.toLowerCase().includes(q)) ||
      item.description.toLowerCase().includes(q)

    return {
      conceptGroups: CONCEPT_CATEGORY_ORDER
        .map((cat) => ({ category: cat, items: ALL_CONCEPTS.filter((i) => i.category === cat && match(i)) }))
        .filter((g) => g.items.length > 0),
      designs: ALL_DESIGNS.filter(match),
    }
  }, [query])

  const totalConcepts = conceptGroups.reduce((sum, g) => sum + g.items.length, 0)
  const clearSearch   = () => setQuery('')

  return (
    <div className="space-y-12">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">System Design</h1>
          <p className="mt-2 text-slate-400">
            Step through real architectures — from foundational concepts to full system walkthroughs.
          </p>
        </div>

        <div className="relative w-full sm:w-64 shrink-0">
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
            placeholder="Search topics…"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-blue-500/60 transition-colors"
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Concepts ─────────────────────────────────────────────────────────── */}
      <div className="space-y-8">

        {/* Section heading */}
        <div className="flex items-center gap-3">
          <div className="w-1 h-5 rounded-full bg-sky-400" />
          <h2 className="text-lg font-semibold text-white">Concepts</h2>
          <span className="rounded-full px-2 py-0.5 text-[11px] font-medium bg-sky-500/15 text-sky-300">
            {totalConcepts} topic{totalConcepts !== 1 ? 's' : ''}
          </span>
        </div>

        {conceptGroups.length > 0 ? (
          <div className="space-y-10 pl-4">
            {conceptGroups.map((group, i) => (
              <div key={group.category}>
                {i > 0 && <div className="border-t border-white/[0.05] mb-10" />}
                <CategoryGroup category={group.category} items={group.items} query={query} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-600 pl-4">
            No concepts match.{' '}
            <button onClick={clearSearch} className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors">
              Clear search
            </button>
          </p>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-white/[0.06]" />

      {/* ── System Designs ────────────────────────────────────────────────────── */}
      <div className="space-y-6">

        <div>
          <div className="flex items-center gap-3">
            <div className="w-1 h-5 rounded-full bg-blue-500" />
            <h2 className="text-lg font-semibold text-white">System Designs</h2>
            <span className="rounded-full px-2 py-0.5 text-[11px] font-medium bg-blue-500/15 text-blue-300">
              {designs.length} design{designs.length !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="mt-1 ml-4 text-sm text-slate-500">
            End-to-end walkthroughs — see how real systems are architected and scaled.
          </p>
        </div>

        {designs.length > 0 ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={`designs-${query}`}
              variants={grid}
              initial="hidden"
              animate="show"
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {designs.map((item) => (
                <motion.div key={item.id} variants={card}>
                  <SDCard item={item} />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        ) : (
          <p className="text-sm text-slate-600 pl-4">
            No designs match.{' '}
            <button onClick={clearSearch} className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors">
              Clear search
            </button>
          </p>
        )}
      </div>

    </div>
  )
}
