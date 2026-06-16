import { useMemo, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { buildDatabaseIndexesSteps } from './steps'
import { useStepRunner } from '../../../../hooks/useStepRunner'
import StepControls from '../../../../components/ui/StepControls'

const CW = 620
const CH = 280

const NODES = [
  {
    id: 'table', label: 'Table', icon: '📋', dir: 'left',
    cx: 95, cy: 140, w: 110, h: 84,
    color: '#3b82f6', glow: 'rgba(59,130,246,0.65)', lc: '#93c5fd', strip: 'bg-blue-500',
    sub1: '10M rows', sub2: 'heap pages',
    desc: 'The base table stored on disk as unordered heap pages. Without an index every query reads all 10M rows.',
    note: 'A sequential scan of 10M rows may take 150ms+ even when data is cached in memory.',
  },
  {
    id: 'btree', label: 'B-Tree Index', icon: '🌳', dir: 'top',
    cx: 370, cy: 80, w: 130, h: 84,
    color: '#8b5cf6', glow: 'rgba(139,92,246,0.65)', lc: '#c4b5fd', strip: 'bg-violet-500',
    sub1: 'O(log n) lookup', sub2: 'sorted leaf list',
    desc: 'A balanced tree sorted by the indexed column. Each leaf node holds column values and row pointers (ctid/rowid). Leaf nodes are linked for efficient range scans.',
    note: 'PostgreSQL and MySQL default to B-tree. Supports equality, range, ORDER BY, and prefix matching.',
  },
  {
    id: 'disk', label: 'Disk / Heap', icon: '💾', dir: 'bottom',
    cx: 370, cy: 218, w: 130, h: 76,
    color: '#f59e0b', glow: 'rgba(245,158,11,0.65)', lc: '#fcd34d', strip: 'bg-amber-500',
    sub1: 'heap pages', sub2: 'random I/O',
    desc: 'Physical storage on disk. An index lookup returns a row pointer (ctid), then the engine fetches the actual row from its heap page.',
    note: 'A covering index eliminates this step entirely — data is returned directly from the index.',
  },
]

const EDGES = {
  'table-btree': { x1: 150, y1: 118, x2: 305, y2: 88,  axis: 'd' },
  'table-disk':  { x1: 150, y1: 162, x2: 305, y2: 210, axis: 'd' },
  'btree-disk':  { x1: 370, y1: 122, x2: 370, y2: 180, axis: 'v' },
}

const C = {
  violet:  { hex: '#8b5cf6', glow: 'rgba(139,92,246,0.85)' },
  blue:    { hex: '#3b82f6', glow: 'rgba(59,130,246,0.85)'  },
  amber:   { hex: '#f59e0b', glow: 'rgba(245,158,11,0.85)'  },
  red:     { hex: '#f43f5e', glow: 'rgba(244,63,94,0.85)'   },
  emerald: { hex: '#10b981', glow: 'rgba(16,185,129,0.85)'  },
}

const DIR_MAP = {
  both:     { fwd: C.blue,    bwd: C.emerald },
  request:  { fwd: C.violet,  bwd: null       },
  response: { fwd: C.emerald, bwd: null       },
  write:    { fwd: C.amber,   bwd: null       },
}

const QUERY_BADGE = {
  scan:      { label: 'SEQ SCAN',         color: C.red.hex,     bg: 'bg-red-500/[0.08]',     border: 'border-red-500/40',     icon: '🐢', note: 'O(n) — reads all 10M rows' },
  create:    { label: 'CREATE INDEX',     color: C.violet.hex,  bg: 'bg-violet-500/[0.08]',  border: 'border-violet-500/40',  icon: '🌳', note: 'one-time build cost' },
  indexed:   { label: 'INDEX SCAN',       color: C.violet.hex,  bg: 'bg-violet-500/[0.08]',  border: 'border-violet-500/40',  icon: '⚡', note: 'O(log n) — ~0.1 ms' },
  range:     { label: 'INDEX RANGE SCAN', color: C.violet.hex,  bg: 'bg-violet-500/[0.08]',  border: 'border-violet-500/40',  icon: '📊', note: 'walks sorted leaf list' },
  composite: { label: 'COMPOSITE INDEX',  color: C.blue.hex,    bg: 'bg-blue-500/[0.08]',    border: 'border-blue-500/40',    icon: '🔑', note: 'leftmost-prefix rule' },
  write:     { label: 'WRITE OVERHEAD',   color: C.amber.hex,   bg: 'bg-amber-500/[0.08]',   border: 'border-amber-500/40',   icon: '⚠️', note: '11 writes for 1 row + 10 indexes' },
  covering:  { label: 'COVERING INDEX',   color: C.emerald.hex, bg: 'bg-emerald-500/[0.08]', border: 'border-emerald-500/40', icon: '✓',  note: 'index-only scan — disk never touched' },
}

function EdgeConnection({ edgeId, connections, stepKey }) {
  const edge = EDGES[edgeId]
  const dir  = connections[edgeId]
  const map  = DIR_MAP[dir]

  const { x1, y1, x2, y2, axis } = edge
  const fwdC = map?.fwd ?? null
  const bwdC = map?.bwd ?? null
  const isActive = !!map

  const fwdAnim = axis === 'v' ? { cx: x1, cy: [y1, y2] }
                : axis === 'd' ? { cx: [x1, x2], cy: [y1, y2] }
                : { cx: [x1, x2], cy: y1 }
  const bwdAnim = axis === 'v' ? { cx: x2, cy: [y2, y1] }
                : axis === 'd' ? { cx: [x2, x1], cy: [y2, y1] }
                : { cx: [x2, x1], cy: y2 }

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
          boxShadow:       isActive ? `0 0 28px -5px ${node.glow}` : 'none',
        }}
        transition={{ duration: 0.28 }}
      >
        <motion.div className={`absolute top-0 left-0 right-0 h-0.5 ${node.strip}`}
          animate={{ opacity: isActive ? 1 : wasVisited ? 0.35 : 0.12 }} />

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

        <motion.p animate={{ color: isActive ? node.color : '#1f2937' }} className="text-[9px] font-mono">
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
              ...(node.dir === 'top'    ? { top: '105%',   left: '50%', transform: 'translateX(-50%)' } : {}),
              ...(node.dir === 'left'   ? { right: '105%', top: '50%',  transform: 'translateY(-50%)' } : {}),
              ...(node.dir === 'bottom' ? { bottom: '105%', left: '50%', transform: 'translateX(-50%)' } : {}),
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

export default function DatabaseIndexesDiagram({ onStepChange }) {
  const steps  = useMemo(() => buildDatabaseIndexesSteps(), [])
  const runner = useStepRunner(steps)
  const { step, index } = runner

  useEffect(() => { onStepChange?.(step) }, [step, onStepChange])

  const [expandedNode, setExpandedNode] = useState(null)

  const visitedNodes = useMemo(() => {
    const s = new Set()
    for (let i = 0; i <= index; i++) steps[i].activeNodes.forEach((id) => s.add(id))
    return s
  }, [steps, index])

  const badge = step.queryType ? QUERY_BADGE[step.queryType] : null

  return (
    <div className="space-y-4">

      <div>
        <h2 className="text-lg font-semibold text-white">Database Indexes — B-Tree in Action</h2>
        <p className="text-sm text-slate-400">
          See how a B-tree index transforms a full table scan into an O(log n) lookup, and when indexes hurt.
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
          <div className="relative mx-auto" style={{ width: CW, height: CH }}>

            <svg
              className="absolute inset-0 pointer-events-none overflow-visible"
              viewBox={`0 0 ${CW} ${CH}`}
              width={CW} height={CH}
            >
              {Object.keys(EDGES).map((edgeId) => (
                <EdgeConnection key={edgeId} edgeId={edgeId} connections={step.connections} stepKey={index} />
              ))}
              <text x={225} y={65}  style={{ fill: C.violet.hex, fontSize: 9, fontFamily: 'ui-monospace, monospace', fontWeight: 600, opacity: 0.65 }}>FAST PATH  O(log n)</text>
              <text x={225} y={235} style={{ fill: C.amber.hex,  fontSize: 9, fontFamily: 'ui-monospace, monospace', fontWeight: 600, opacity: 0.65 }}>SLOW PATH  O(n)</text>
            </svg>

            {NODES.map((node) => (
              <NodeBlock
                key={node.id}
                node={node}
                isActive={step.activeNodes.includes(node.id)}
                wasVisited={visitedNodes.has(node.id) && !step.activeNodes.includes(node.id)}
                isExpanded={expandedNode === node.id}
                onClick={() => setExpandedNode((p) => p === node.id ? null : node.id)}
                popKey={step.activeNodes.includes(node.id) ? index : null}
              />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {badge && (
            <motion.div
              key={step.queryType}
              initial={{ opacity: 0, y: 6, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 340, damping: 22 }}
              className={`mt-3 flex items-center gap-3 rounded-xl border px-4 py-2.5 ${badge.bg} ${badge.border}`}
            >
              <span className="select-none">{badge.icon}</span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider font-mono" style={{ color: badge.color }}>{badge.label}</p>
                <p className="text-[11px] font-mono" style={{ color: badge.color, opacity: 0.75 }}>{badge.note}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-5 mt-3 px-1 flex-wrap">
          {[
            { color: C.violet.hex, glow: C.violet.glow, label: 'index lookup (fast path)' },
            { color: C.amber.hex,  glow: C.amber.glow,  label: 'table scan / write overhead' },
            { color: C.emerald.hex,glow: C.emerald.glow,label: 'result returned'            },
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
