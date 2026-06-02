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

// ── Helpers ───────────────────────────────────────────────────────────────────

function catLabel(slug) {
  return SD_CATEGORY_LABELS[slug] ?? slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// ── SD Card ───────────────────────────────────────────────────────────────────

const ACCENT = {
  concept: 'hover:border-sky-500/50 hover:bg-sky-500/[0.04]',
  design:  'hover:border-blue-500/50 hover:bg-blue-500/5',
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
        className={`block rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6 transition-colors ${ACCENT[item.type]}`}
      >
        <h3 className="mb-3 font-semibold text-white">{item.title}</h3>
        <p className="mb-4 text-sm text-slate-400 leading-relaxed">{item.metaphor}</p>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-md bg-white/8 px-2 py-0.5 text-xs text-slate-300">
            {item.category}
          </span>
          {item.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-slate-400">
              {tag}
            </span>
          ))}
        </div>
      </Link>
    </motion.div>
  )
}

// ── Section ───────────────────────────────────────────────────────────────────

function Section({
  title, description, accentClass, badgeClass,
  items, allItems, query, onClear,
  categories, activeCategory, onCategoryChange,
}) {
  const showPills = categories.length > 2  // only when ≥ 2 distinct categories exist

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div>
        <div className="flex items-center gap-3">
          <div className={`w-1 h-5 rounded-full ${accentClass}`} />
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${badgeClass}`}>
            {items.length} topic{items.length !== 1 ? 's' : ''}
          </span>
        </div>
        <p className="mt-1 ml-4 text-sm text-slate-500">{description}</p>
      </div>

      {/* Category pills — only when multiple categories exist */}
      {showPills && (
        <div className="ml-4 flex flex-wrap gap-1.5">
          {categories.map((cat) => {
            const count  = cat === 'all' ? allItems.length : allItems.filter((i) => i.category === cat).length
            const active = activeCategory === cat
            return (
              <button
                key={cat}
                onClick={() => onCategoryChange(cat)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'border border-white/10 bg-white/[0.04] text-slate-400 hover:text-white hover:border-white/20'
                }`}
              >
                {cat === 'all' ? 'All' : catLabel(cat)}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
                  active ? 'bg-white/20 text-white' : 'bg-white/8 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Grid or empty state */}
      <AnimatePresence mode="wait">
        {items.length > 0 ? (
          <motion.div
            key={`${title}-${query}-${activeCategory}`}
            variants={grid}
            initial="hidden"
            animate="show"
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {items.map((item) => (
              <motion.div key={item.id} variants={card}>
                <SDCard item={item} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.p
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sm text-slate-600 pl-4"
          >
            No matches.{' '}
            <button
              onClick={onClear}
              className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
            >
              Clear filters
            </button>
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

// Derive unique ordered categories per type (stable across renders)
const CONCEPT_CATEGORIES = ['all', ...new Set(
  SYSTEM_DESIGN.filter((i) => i.type === 'concept').map((i) => i.category)
)]
const DESIGN_CATEGORIES = ['all', ...new Set(
  SYSTEM_DESIGN.filter((i) => i.type === 'design').map((i) => i.category)
)]

const ALL_CONCEPTS = SYSTEM_DESIGN.filter((i) => i.type === 'concept')
const ALL_DESIGNS  = SYSTEM_DESIGN.filter((i) => i.type === 'design')

export default function SystemDesignIndex() {
  const [query,           setQuery]           = useState('')
  const [conceptCategory, setConceptCategory] = useState('all')
  const [designCategory,  setDesignCategory]  = useState('all')

  const { concepts, designs } = useMemo(() => {
    const q = query.trim().toLowerCase()
    const match = (item, activeCat) =>
      (activeCat === 'all' || item.category === activeCat) &&
      (!q ||
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q)))
    return {
      concepts: ALL_CONCEPTS.filter((i) => match(i, conceptCategory)),
      designs:  ALL_DESIGNS.filter((i)  => match(i, designCategory)),
    }
  }, [query, conceptCategory, designCategory])

  const clearAll = () => { setQuery(''); setConceptCategory('all'); setDesignCategory('all') }

  return (
    <div className="space-y-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">System Design</h1>
          <p className="mt-2 text-slate-400">
            Step through real architectures — from foundational concepts to full system walkthroughs.
          </p>
        </div>

        {/* Search */}
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
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Concepts section */}
      <Section
        title="Concepts"
        description="Foundational building blocks — learn how individual pieces of the internet work."
        accentClass="bg-sky-400"
        badgeClass="bg-sky-500/15 text-sky-300"
        items={concepts}
        allItems={ALL_CONCEPTS}
        query={query}
        onClear={clearAll}
        categories={CONCEPT_CATEGORIES}
        activeCategory={conceptCategory}
        onCategoryChange={setConceptCategory}
      />

      {/* Divider */}
      <div className="border-t border-white/[0.06]" />

      {/* System Designs section */}
      <Section
        title="System Designs"
        description="End-to-end architecture walkthroughs — see how real systems are designed and scaled."
        accentClass="bg-blue-500"
        badgeClass="bg-blue-500/15 text-blue-300"
        items={designs}
        allItems={ALL_DESIGNS}
        query={query}
        onClear={clearAll}
        categories={DESIGN_CATEGORIES}
        activeCategory={designCategory}
        onCategoryChange={setDesignCategory}
      />

    </div>
  )
}
