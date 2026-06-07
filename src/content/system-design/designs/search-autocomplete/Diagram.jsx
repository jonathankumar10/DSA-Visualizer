import { useMemo, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { buildSearchAutocompleteSteps } from './steps'
import { useStepRunner } from '../../../../hooks/useStepRunner'
import StepControls from '../../../../components/ui/StepControls'

// ── Layout ─────────────────────────────────────────────────────────────────────
// user (left) → frontend → cache (above frontend) → autocomplete → trie → ranking (right)
// pipeline (bottom-center) → trie (offline write path)

const CW = 740
const CH = 350

const NODES = [
  {
    id: 'user', label: 'User', icon: '🔍', dir: 'left',
    cx: 58, cy: 175, w: 90, h: 74,
    color: '#94a3b8', glow: 'rgba(148,163,184,0.65)', lc: '#cbd5e1', strip: 'bg-slate-400',
    sub1: 'typing "te…"', sub2: 'keyboard input',
    desc: 'The person typing a search query character by character.',
    note: 'Users expect suggestions to appear within 100ms of each keystroke — any slower feels broken.',
  },
  {
    id: 'frontend', label: 'Search Frontend', icon: '💻', dir: 'top',
    cx: 178, cy: 175, w: 114, h: 80,
    color: '#06b6d4', glow: 'rgba(6,182,212,0.65)', lc: '#67e8f9', strip: 'bg-cyan-500',
    sub1: 'debounce 150ms', sub2: 'cancel in-flight',
    desc: 'Debounces keystrokes and cancels stale in-flight requests when a newer prefix arrives.',
    note: 'Browser-side LRU cache stores session results — back-navigating to a previous prefix is instant without a network call.',
  },
  {
    id: 'cache', label: 'Redis Cache', icon: '⚡', dir: 'top',
    cx: 178, cy: 68, w: 110, h: 72,
    color: '#10b981', glow: 'rgba(16,185,129,0.65)', lc: '#6ee7b7', strip: 'bg-emerald-500',
    sub1: 'top 1,000 prefixes', sub2: 'TTL: minutes',
    desc: 'Caches pre-ranked suggestions for the 1,000 most popular prefixes. These cover the vast majority of all traffic.',
    note: 'Cache miss rate < 5% means the Trie service only ever handles the novel long tail — keeps it small and fast.',
  },
  {
    id: 'autocomplete', label: 'Autocomplete Svc', icon: '🔄', dir: 'top',
    cx: 358, cy: 175, w: 124, h: 80,
    color: '#8b5cf6', glow: 'rgba(139,92,246,0.65)', lc: '#c4b5fd', strip: 'bg-violet-500',
    sub1: 'orchestrates lookup', sub2: 'writes cache on miss',
    desc: 'Orchestrates the lookup: cache → trie → ranking → cache write. Returns suggestions to the frontend.',
    note: 'On a cache miss, the result is written back to Redis so the next identical prefix is served from cache.',
  },
  {
    id: 'trie', label: 'Trie Service', icon: '🌲', dir: 'top',
    cx: 530, cy: 175, w: 110, h: 80,
    color: '#7c3aed', glow: 'rgba(124,58,237,0.65)', lc: '#ddd6fe', strip: 'bg-violet-700',
    sub1: 'O(prefix) lookup', sub2: 'pre-computed top-K',
    desc: 'Prefix tree where each node stores the pre-computed top-5 completions. Lookup is O(prefix_length) — no sorting at query time.',
    note: 'The live trie is read-only. Updates happen via atomic swap — a new version is built offline and traffic is redirected.',
  },
  {
    id: 'ranking', label: 'Ranking Service', icon: '📊', dir: 'right',
    cx: 668, cy: 175, w: 110, h: 80,
    color: '#f59e0b', glow: 'rgba(245,158,11,0.65)', lc: '#fcd34d', strip: 'bg-amber-500',
    sub1: 'popularity + recency', sub2: 'optional personalization',
    desc: 'Blends global frequency with recency signals. A query spiking in the last hour (breaking news) outranks historically popular stale queries.',
    note: 'Personalization (per-user query history) can be blended here — but must add ≤ 10ms to keep the total response under 100ms.',
  },
  {
    id: 'pipeline', label: 'Data Pipeline', icon: '🏭', dir: 'bottom',
    cx: 530, cy: 295, w: 116, h: 74,
    color: '#64748b', glow: 'rgba(100,116,139,0.65)', lc: '#94a3b8', strip: 'bg-slate-500',
    sub1: 'MapReduce / Spark', sub2: 'hourly refresh',
    desc: 'Aggregates search logs to compute query frequencies. Builds a new trie version offline and atomically swaps traffic to it.',
    note: 'Atomic trie swap is critical: never mutate a live trie mid-query — partial top-K updates corrupt suggestions for in-flight requests.',
  },
]

const EDGES = {
  'user-frontend':       { x1: 103, y1: 175, x2: 121, y2: 175, axis: 'h' },
  'frontend-cache':      { x1: 178, y1: 135, x2: 178, y2: 104, axis: 'v' },
  'cache-autocomplete':  { x1: 233, y1: 68,  x2: 296, y2: 135, axis: 'd' },
  'autocomplete-trie':   { x1: 420, y1: 175, x2: 475, y2: 175, axis: 'h' },
  'trie-ranking':        { x1: 585, y1: 175, x2: 613, y2: 175, axis: 'h' },
  'pipeline-trie':       { x1: 530, y1: 258, x2: 530, y2: 215, axis: 'v' },
}

const C = {
  violet:  { hex: '#8b5cf6', glow: 'rgba(139,92,246,0.85)'  },
  emerald: { hex: '#10b981', glow: 'rgba(16,185,129,0.85)'  },
  cyan:    { hex: '#06b6d4', glow: 'rgba(6,182,212,0.85)'   },
  amber:   { hex: '#f59e0b', glow: 'rgba(245,158,11,0.85)'  },
}

const DIR_MAP = {
  request:  { fwd: C.violet,  bwd: null      },
  response: { fwd: C.emerald, bwd: null      },
  both:     { fwd: C.violet,  bwd: C.emerald },
}

// ── Edge connection (SVG particles) ──────────────────────────────────────────

function EdgeConnection({ edgeId, connections, stepKey }) {
  const edge = EDGES[edgeId]
  const dir  = connections[edgeId]
  const map  = DIR_MAP[dir]

  const { x1, y1, x2, y2, axis } = edge
  const fwdC    = map?.fwd ?? null
  const bwdC    = map?.bwd ?? null
  const isActive = !!map

  const fwdAnim = axis === 'v' ? { cx: x1, cy: [y1, y2] }
                : axis === 'h' ? { cx: [x1, x2], cy: y1 }
                : { cx: [x1, x2], cy: [y1, y2] }
  const bwdAnim = axis === 'v' ? { cx: x2, cy: [y2, y1] }
                : axis === 'h' ? { cx: [x2, x1], cy: y2 }
                : { cx: [x2, x1], cy: [y2, y1] }

  return (
    <g>
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={isActive ? (fwdC?.hex ?? '#1e293b') : '#182030'}
        strokeWidth={isActive ? 2 : 1}
        strokeDasharray={isActive ? 'none' : '5 4'}
        style={{ filter: isActive && fwdC ? `drop-shadow(0 0 5px ${fwdC.glow})` : 'none', transition: 'all 0.3s' }}
      />
      {fwdC && [0, 1, 2].map((p) => (
        <motion.circle
          key={`${stepKey}-${edgeId}-f${p}`}
          r={3.5} fill={fwdC.hex}
          style={{ filter: `drop-shadow(0 0 5px ${fwdC.glow})` }}
          animate={fwdAnim}
          transition={{ duration: 0.5, delay: p * 0.16, ease: 'linear', repeat: Infinity, repeatDelay: 0.1 }}
        />
      ))}
      {bwdC && [0, 1, 2].map((p) => (
        <motion.circle
          key={`${stepKey}-${edgeId}-b${p}`}
          r={3.5} fill={bwdC.hex}
          style={{ filter: `drop-shadow(0 0 5px ${bwdC.glow})` }}
          animate={bwdAnim}
          transition={{ duration: 0.5, delay: p * 0.16, ease: 'linear', repeat: Infinity, repeatDelay: 0.1 }}
        />
      ))}
    </g>
  )
}

// ── Node block ────────────────────────────────────────────────────────────────

function NodeBlock({ node, isActive, wasVisited, isExpanded, onClick, popKey }) {
  const { cx, cy, w, h } = node
  return (
    <div className="absolute" style={{ left: cx - w / 2, top: cy - h / 2, width: w, height: h }}>
      <motion.button
        onClick={onClick}
        className="relative w-full h-full rounded-xl border-2 overflow-hidden flex flex-col items-center justify-center gap-0.5 px-1 cursor-pointer focus:outline-none"
        animate={{
          borderColor:     isActive ? node.color : wasVisited ? `${node.color}38` : 'rgba(255,255,255,0.08)',
          backgroundColor: isActive ? `${node.color}16` : wasVisited ? `${node.color}07` : 'rgba(10,18,36,1)',
          boxShadow:       isActive ? `0 0 32px -5px ${node.glow}` : 'none',
        }}
        transition={{ duration: 0.28 }}
      >
        <motion.div
          className={`absolute top-0 left-0 right-0 h-0.5 ${node.strip}`}
          animate={{ opacity: isActive ? 1 : wasVisited ? 0.35 : 0.12 }}
        />

        {[0, 1, 2].map((i) => (
          <motion.div
            key={`${popKey ?? 'i'}-${node.id}-${i}`}
            className="absolute inset-0 rounded-xl border-2 pointer-events-none"
            style={{ borderColor: node.color }}
            initial={{ scale: 1, opacity: popKey != null ? 0.65 : 0 }}
            animate={{ scale: 2.0 + i * 0.35, opacity: 0 }}
            transition={{ duration: 0.7, delay: i * 0.12, ease: 'easeOut' }}
          />
        ))}

        <motion.span
          key={`ic-${popKey ?? 0}`}
          animate={popKey != null ? { scale: [1, 1.4, 0.88, 1.06, 1] } : { scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 12 }}
          className="text-xl leading-none select-none"
        >
          {node.icon}
        </motion.span>

        <motion.p
          animate={{ color: isActive ? node.lc : wasVisited ? '#94a3b8' : '#475569' }}
          className="text-[10px] font-bold text-center leading-tight"
        >
          {node.label}
        </motion.p>

        <motion.p
          animate={{ color: isActive ? node.color : '#1f2937' }}
          className="text-[9px] font-mono"
        >
          {node.sub1}
        </motion.p>
        <p className="text-[8px] text-slate-700">{node.sub2}</p>
      </motion.button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 360, damping: 26 }}
            className="absolute z-30 w-52 rounded-xl border bg-slate-900/96 backdrop-blur shadow-2xl p-3 space-y-1.5"
            style={{
              borderColor: `${node.color}40`,
              ...(node.dir === 'top'    ? { top: '105%',    left: '50%', transform: 'translateX(-50%)' } : {}),
              ...(node.dir === 'right'  ? { left: '105%',   top: '50%',  transform: 'translateY(-50%)' } : {}),
              ...(node.dir === 'bottom' ? { bottom: '105%', left: '50%', transform: 'translateX(-50%)' } : {}),
              ...(node.dir === 'left'   ? { right: '105%',  top: '50%',  transform: 'translateY(-50%)' } : {}),
            }}
          >
            <p className="text-[11px] font-bold" style={{ color: node.lc }}>{node.label}</p>
            <p className="text-[10px] text-slate-400 leading-relaxed">{node.desc}</p>
            <p className="text-[10px] italic" style={{ color: node.color }}>{node.note}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Suggestion preview badge ──────────────────────────────────────────────────

const SUGGESTIONS = ['technology', 'template', 'tensorflow', 'test driven', 'terraform']

function SuggestionPreview({ visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 24 }}
          className="mt-3 rounded-xl border border-violet-500/30 bg-violet-500/[0.07] px-4 py-3"
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-violet-400 mb-2">
            Top 5 Suggestions for "te"
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s, i) => (
              <motion.span
                key={s}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07, type: 'spring', stiffness: 360, damping: 22 }}
                className="text-[11px] font-mono text-violet-200 bg-violet-500/15 border border-violet-500/25 rounded px-2 py-0.5"
              >
                <span className="text-violet-400 font-bold">te</span>{s.slice(2)}
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SearchAutocompleteDiagram() {
  const steps  = useMemo(() => buildSearchAutocompleteSteps(), [])
  const runner = useStepRunner(steps)
  const { step, index } = runner

  const [expandedNode, setExpandedNode] = useState(null)
  const [popKeys,      setPopKeys]      = useState({})

  useEffect(() => {
    if (!step.activeNodes.length) return
    setPopKeys((prev) => {
      const next = { ...prev }
      step.activeNodes.forEach((id) => { next[id] = (prev[id] ?? -1) + 1 })
      return next
    })
  }, [step])

  const visitedNodes = useMemo(() => {
    const s = new Set()
    for (let i = 0; i <= index; i++) steps[i].activeNodes.forEach((id) => s.add(id))
    return s
  }, [steps, index])

  const showSuggestions = step.type === 'response-returned' || step.type === 'cache-hit' || step.type === 'full-system'

  return (
    <div className="space-y-4">

      <div>
        <h2 className="text-lg font-semibold text-white">Search Autocomplete — Typeahead System</h2>
        <p className="text-sm text-slate-400">
          Trace a query from keystroke through debounce, cache lookup, trie traversal, and ranking — then see how the offline pipeline keeps suggestions fresh.
        </p>
      </div>

      <div
        className="rounded-2xl border border-white/10 p-3 sm:p-5"
        style={{
          background: '#060d1a',
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      >
        <div className="overflow-x-auto pb-2">
          <div style={{ minWidth: CW }}>
            <div className="relative mx-auto" style={{ width: CW, height: CH }}>

              <svg
                className="absolute inset-0 pointer-events-none overflow-visible"
                viewBox={`0 0 ${CW} ${CH}`}
                width={CW} height={CH}
              >
                {Object.keys(EDGES).map((edgeId) => (
                  <EdgeConnection
                    key={edgeId}
                    edgeId={edgeId}
                    connections={step.connections}
                    stepKey={index}
                  />
                ))}

                {/* Lane labels */}
                <text x={310} y={40} style={{ fill: '#8b5cf6', fontSize: 9, fontFamily: 'ui-monospace, monospace', fontWeight: 600, opacity: 0.55 }}>
                  READ PATH  (sub-100ms)
                </text>
                <text x={440} y={320} style={{ fill: '#64748b', fontSize: 9, fontFamily: 'ui-monospace, monospace', fontWeight: 600, opacity: 0.55 }}>
                  OFFLINE WRITE PATH
                </text>
              </svg>

              {NODES.map((node) => (
                <NodeBlock
                  key={node.id}
                  node={node}
                  isActive={step.activeNodes.includes(node.id)}
                  wasVisited={visitedNodes.has(node.id) && !step.activeNodes.includes(node.id)}
                  isExpanded={expandedNode === node.id}
                  onClick={() => setExpandedNode((p) => p === node.id ? null : node.id)}
                  popKey={popKeys[node.id] ?? null}
                />
              ))}
            </div>

            <SuggestionPreview visible={showSuggestions} />
          </div>
        </div>

        <div className="flex items-center gap-5 mt-3 px-1 flex-wrap">
          {[
            { color: C.violet.hex,  glow: C.violet.glow,  label: 'query request'    },
            { color: C.emerald.hex, glow: C.emerald.glow, label: 'suggestions back' },
          ].map(({ color, glow, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-5 h-px rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 4px ${glow}` }} />
              <span className="text-[10px] text-slate-500">{label}</span>
            </div>
          ))}
          <span className="text-[10px] text-slate-600 ml-auto hidden sm:inline">tap any node for details</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step.message}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.2 }}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 space-y-1.5"
        >
          <p className="text-sm font-semibold text-white">{step.message}</p>
          <p className="text-xs text-slate-400 leading-relaxed">{step.detail}</p>
        </motion.div>
      </AnimatePresence>

      <StepControls runner={runner} />
    </div>
  )
}
