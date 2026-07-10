import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AlgoCard from '../components/ui/AlgoCard'
import ZoomControls from '../components/ui/ZoomControls'
import { useZoomPan } from '../hooks/useZoomPan'
import { ALGORITHMS, CATEGORY_LABELS } from '../constants/algorithmRegistry'

// ── Labels ────────────────────────────────────────────────────────────────────

const SHORT_LABELS = {
  'arrays-hashing':      'Arrays & Hash',
  'two-pointers':        'Two Pointers',
  'stack':               'Stack',
  'binary-search':       'Binary Search',
  'sliding-window':      'Sliding Window',
  'linked-list':         'Linked List',
  'trees':               'Trees',
  'tries':               'Tries',
  'backtracking':        'Backtracking',
  'heap-priority-queue': 'Heap / PQ',
  'graphs':              'Graphs',
  'advanced-graphs':     'Adv. Graphs',
  '1d-dp':               '1-D DP',
  '2d-dp':               '2-D DP',
  'greedy':              'Greedy',
  'intervals':           'Intervals',
  'bit-manipulation':    'Bit Manip.',
  'math-geometry':       'Math & Geo',
}

// ── Node colors (by conceptual group) ────────────────────────────────────────

const NODE_COLOR = {
  'arrays-hashing':      '#3b82f6',
  'bit-manipulation':    '#3b82f6',
  'math-geometry':       '#3b82f6',
  'two-pointers':        '#06b6d4',
  'sliding-window':      '#06b6d4',
  'stack':               '#8b5cf6',
  'binary-search':       '#8b5cf6',
  'backtracking':        '#8b5cf6',
  'linked-list':         '#14b8a6',
  'trees':               '#10b981',
  'tries':               '#10b981',
  'graphs':              '#0ea5e9',
  'advanced-graphs':     '#0ea5e9',
  'heap-priority-queue': '#f59e0b',
  'greedy':              '#f59e0b',
  '1d-dp':               '#a78bfa',
  '2d-dp':               '#a78bfa',
  'intervals':           '#f97316',
}

// ── Graph definition ──────────────────────────────────────────────────────────
// x, y = center of node in the SVG viewBox (0 0 1040 470)

const NODES = {
  'arrays-hashing':      { x: 70,  y: 235 },
  'bit-manipulation':    { x: 250, y: 50  },
  'two-pointers':        { x: 250, y: 145 },
  'stack':               { x: 250, y: 240 },
  'binary-search':       { x: 250, y: 340 },
  'math-geometry':       { x: 250, y: 430 },
  'sliding-window':      { x: 430, y: 75  },
  'linked-list':         { x: 430, y: 195 },
  'backtracking':        { x: 430, y: 325 },
  'trees':               { x: 610, y: 145 },
  '1d-dp':               { x: 610, y: 370 },
  'tries':               { x: 790, y: 60  },
  'graphs':              { x: 790, y: 180 },
  'heap-priority-queue': { x: 790, y: 300 },
  '2d-dp':               { x: 790, y: 420 },
  'advanced-graphs':     { x: 970, y: 110 },
  'greedy':              { x: 970, y: 260 },
  'intervals':           { x: 970, y: 385 },
}

// Edges: [prerequisite, unlocks]
const EDGES = [
  ['arrays-hashing', 'bit-manipulation'],
  ['arrays-hashing', 'two-pointers'],
  ['arrays-hashing', 'stack'],
  ['arrays-hashing', 'binary-search'],
  ['arrays-hashing', 'math-geometry'],
  ['two-pointers',   'sliding-window'],
  ['two-pointers',   'linked-list'],
  ['stack',          'backtracking'],
  ['linked-list',    'trees'],
  ['backtracking',   '1d-dp'],
  ['trees',          'tries'],
  ['trees',          'graphs'],
  ['trees',          'heap-priority-queue'],
  ['1d-dp',          '2d-dp'],
  ['graphs',         'advanced-graphs'],
  ['heap-priority-queue', 'advanced-graphs'],
  ['heap-priority-queue', 'greedy'],
  ['greedy',         'intervals'],
  ['sliding-window', 'intervals'],    // cross-edge — the "web"
]

const NODE_W = 104
const NODE_H = 30

// ── SVG sub-components ────────────────────────────────────────────────────────

function EdgePath({ from, to, isActive, hasHover }) {
  const src = NODES[from]
  const tgt = NODES[to]
  const x1 = src.x + NODE_W / 2
  const y1 = src.y
  const x2 = tgt.x - NODE_W / 2
  const y2 = tgt.y
  const cx = (x1 + x2) / 2
  const d = `M ${x1},${y1} C ${cx},${y1} ${cx},${y2} ${x2},${y2}`
  const color = NODE_COLOR[from]

  return (
    <motion.path
      d={d}
      fill="none"
      stroke={color}
      strokeDasharray={isActive ? '6 3' : '0'}
      animate={{
        strokeOpacity: isActive ? 0.88 : hasHover ? 0.07 : 0.18,
        strokeWidth:   isActive ? 1.6  : 0.8,
        strokeDashoffset: isActive ? [0, -18] : [0],
      }}
      transition={{
        strokeOpacity:    { duration: 0.18, ease: 'easeInOut' },
        strokeWidth:      { duration: 0.18, ease: 'easeInOut' },
        strokeDashoffset: isActive
          ? { duration: 0.55, repeat: Infinity, ease: 'linear' }
          : { duration: 0 },
      }}
    />
  )
}

function NodeRect({ id, selected, hovered, hasProblems, count, onSelect, onHover }) {
  const { x, y } = NODES[id]
  const color = NODE_COLOR[id]
  const isSelected = selected === id
  const isHovered = hovered === id
  const isActive = isSelected || isHovered

  const fillOpacity = !hasProblems ? 0.04 : isSelected ? 0.25 : isHovered ? 0.15 : 0.08
  const strokeOpacity = !hasProblems ? 0.2 : isActive ? 1 : 0.45
  const strokeWidth = isSelected ? 1.8 : 1
  const textColor = !hasProblems ? '#475569' : isActive ? '#f8fafc' : '#94a3b8'

  return (
    <g
      transform={`translate(${x - NODE_W / 2}, ${y - NODE_H / 2})`}
      onClick={hasProblems ? () => onSelect(id) : undefined}
      onMouseEnter={hasProblems ? () => onHover(id) : undefined}
      onMouseLeave={() => onHover(null)}
      style={{ cursor: hasProblems ? 'pointer' : 'default' }}
    >
      {isSelected && (
        <rect
          x="-3" y="-3" width={NODE_W + 6} height={NODE_H + 6} rx="9"
          fill={color} fillOpacity="0.15"
        />
      )}
      <rect
        width={NODE_W} height={NODE_H} rx="7"
        fill={color} fillOpacity={fillOpacity}
        stroke={color} strokeWidth={strokeWidth} strokeOpacity={strokeOpacity}
      />
      <text
        x={NODE_W / 2} y={NODE_H / 2}
        dominantBaseline="middle" textAnchor="middle"
        fill={textColor}
        fontSize="9.5" fontFamily="system-ui, 'Segoe UI', sans-serif"
        fontWeight={isActive ? '700' : '500'}
      >
        {SHORT_LABELS[id]}
      </text>
      {hasProblems && count > 0 && (
        <g transform={`translate(${NODE_W - 6}, -6)`}>
          <circle r="8" fill={color} />
          <text
            x="0" y="0" dominantBaseline="middle" textAnchor="middle"
            fill="white" fontSize="7" fontWeight="700"
          >
            {count}
          </text>
        </g>
      )}
    </g>
  )
}

function DependencyGraph({ selected, onSelect, problemCounts }) {
  const [hovered, setHovered] = useState(null)
  const { svgRef, zoom, pan, dragging, isPanning, viewBox, onMouseDown, onClickCapture, zoomIn, zoomOut, reset } = useZoomPan(1040, 470)

  const activeEdgeSet = useMemo(() => {
    const active = selected || hovered
    if (!active) return new Set()
    return new Set(
      EDGES.filter(([f, t]) => f === active || t === active).map(([f, t]) => `${f}→${t}`)
    )
  }, [selected, hovered])

  return (
    <div className="relative w-full overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
      <ZoomControls onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={reset} isZoomed={zoom !== 1} />
      <svg
        ref={svgRef}
        viewBox={viewBox}
        className="w-full min-w-[640px]"
        style={{ display: 'block', cursor: dragging ? 'grabbing' : zoom > 1 ? 'grab' : 'default' }}
        onMouseDown={onMouseDown}
        onClickCapture={onClickCapture}
      >
        {/* Edges — render before nodes so nodes sit on top */}
        {EDGES.map(([from, to]) => {
          const key = `${from}→${to}`
          return (
            <EdgePath
              key={key}
              from={from}
              to={to}
              isActive={activeEdgeSet.has(key)}
              hasHover={!!(selected || hovered)}
            />
          )
        })}

        {/* Nodes */}
        {Object.keys(NODES).map((id) => (
          <NodeRect
            key={id}
            id={id}
            selected={selected}
            hovered={hovered}
            hasProblems={(problemCounts[id] || 0) > 0}
            count={problemCounts[id] || 0}
            onSelect={(id) => onSelect(id)}
            onHover={setHovered}
          />
        ))}

        {/* Transparent overlay during drag — captures pointer events and enforces grabbing cursor */}
        {isPanning && <rect x={pan.x} y={pan.y} width={1040 / zoom} height={470 / zoom} fill="transparent" style={{ cursor: 'grabbing' }} />}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 px-5 pb-4 pt-1">
        {[
          { color: '#3b82f6', label: 'Sequences' },
          { color: '#06b6d4', label: 'Pointers' },
          { color: '#8b5cf6', label: 'Stack / Search' },
          { color: '#14b8a6', label: 'Linked List' },
          { color: '#10b981', label: 'Trees' },
          { color: '#0ea5e9', label: 'Graphs' },
          { color: '#f59e0b', label: 'Heap / Greedy' },
          { color: '#a78bfa', label: 'DP' },
          { color: '#f97316', label: 'Intervals' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: color }} />
            <span className="text-[10px] text-slate-500">{label}</span>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-5 h-px border-t border-dashed border-blue-500/50" />
          <span className="text-[10px] text-slate-600">animated = active edge</span>
        </div>
      </div>
    </div>
  )
}

// ── Problems panel ────────────────────────────────────────────────────────────

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}
const cardVariant = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 24 } },
}

function ProblemsPanel({ algorithms, label }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.25, type: 'spring', stiffness: 260, damping: 24 }}
      className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.04] px-5 py-5 sm:px-6 sm:py-6"
    >
      <div className="flex items-center gap-3 mb-5">
        <h2 className="text-sm font-bold text-white">{label}</h2>
        <div className="flex-1 h-px bg-blue-500/15" />
        <span className="text-[10px] rounded-full px-2 py-0.5 font-medium bg-blue-500/15 text-blue-300">
          {algorithms.length} problem{algorithms.length !== 1 ? 's' : ''}
        </span>
      </div>
      <motion.div variants={gridVariants} initial="hidden" animate="show"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {algorithms.map((algo) => (
          <motion.div key={algo.id} variants={cardVariant}>
            <AlgoCard algo={algo} number={algo.problemLabel?.match(/#(\d+)/)?.[1]} />
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AlgorithmsIndex() {
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [query, setQuery] = useState('')

  const problemCounts = useMemo(() => {
    const counts = {}
    ALGORITHMS.forEach((a) => { counts[a.category] = (counts[a.category] || 0) + 1 })
    return counts
  }, [])

  const shownAlgorithms = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q) {
      return ALGORITHMS.filter((a) =>
        a.title.toLowerCase().includes(q) ||
        a.pattern.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
      )
    }
    if (selectedCategory) return ALGORITHMS.filter((a) => a.category === selectedCategory)
    return []
  }, [query, selectedCategory])

  const handleSelect = (id) => {
    setQuery('')
    setSelectedCategory((prev) => (prev === id ? null : id))
  }

  const handleSearch = (val) => {
    setQuery(val)
    if (val.trim()) setSelectedCategory(null)
  }

  const panelLabel = query.trim()
    ? `Results for "${query.trim()}"`
    : CATEGORY_LABELS[selectedCategory] ?? ''

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Algorithms</h1>
          <p className="mt-2 text-slate-400 max-w-2xl">
            {ALGORITHMS.length} interactive visualizers. Patterns connect to the patterns they unlock —
            click any node to see solved problems. Dimmed nodes are on the roadmap.
          </p>
        </div>
        <div className="relative w-full sm:w-72 shrink-0">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
            width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name, pattern or tag…"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-blue-500/60 transition-colors"
          />
          {query && (
            <button onClick={() => handleSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Dependency graph */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <DependencyGraph
          selected={selectedCategory}
          onSelect={handleSelect}
          problemCounts={problemCounts}
        />
      </motion.div>

      {/* Problems panel */}
      <AnimatePresence mode="wait">
        {shownAlgorithms.length > 0 ? (
          <ProblemsPanel
            key={query || selectedCategory}
            algorithms={shownAlgorithms}
            label={panelLabel}
          />
        ) : query.trim() ? (
          <motion.div key="empty"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-2xl border border-white/8 bg-white/[0.02] py-16 text-center space-y-3">
            <p className="text-slate-400 font-medium">No matching problems</p>
            <p className="text-sm text-slate-600">
              Try a different search or{' '}
              <button onClick={() => handleSearch('')}
                className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors">
                clear
              </button>
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>

    </div>
  )
}
