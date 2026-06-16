import { useMemo, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { buildSqlSteps } from './steps'
import { useStepRunner } from '../../../../hooks/useStepRunner'
import StepControls from '../../../../components/ui/StepControls'

const CW = 620
const CH = 300

const NODES = [
  {
    id: 'client', label: 'Client', icon: '💻', dir: 'left',
    cx: 80, cy: 150, w: 110, h: 82,
    color: '#8b5cf6', glow: 'rgba(139,92,246,0.65)', lc: '#c4b5fd', strip: 'bg-violet-500',
    sub1: 'SQL queries', sub2: 'application layer',
    desc: 'The application issuing SQL queries — a web server, background job, or analytics tool.',
    note: 'Connection pooling is essential: each DB connection is expensive. Use PgBouncer or HikariCP to reuse connections.',
  },
  {
    id: 'db', label: 'SQL Database', icon: '🗄️', dir: 'top',
    cx: 340, cy: 150, w: 140, h: 88,
    color: '#3b82f6', glow: 'rgba(59,130,246,0.65)', lc: '#93c5fd', strip: 'bg-blue-500',
    sub1: 'ACID transactions', sub2: 'query planner',
    desc: 'The relational database engine (PostgreSQL, MySQL, SQLite). Parses SQL, plans execution, manages transactions.',
    note: 'The query planner uses table statistics (ANALYZE) to choose between index scan, full scan, and join strategies.',
  },
  {
    id: 'index', label: 'B-tree Index', icon: '🌲', dir: 'top',
    cx: 540, cy: 150, w: 120, h: 82,
    color: '#10b981', glow: 'rgba(16,185,129,0.65)', lc: '#6ee7b7', strip: 'bg-emerald-500',
    sub1: 'O(log n) lookup', sub2: 'sorted pages',
    desc: 'A B-tree index stores column values in a balanced tree. Lookups traverse ~log₂(n) nodes regardless of table size.',
    note: 'Composite indexes (a, b) serve queries on both columns. CREATE INDEX CONCURRENTLY avoids table locks on PostgreSQL.',
  },
]

const EDGES = {
  'client-db':  { x1: 135, y1: 150, x2: 270, y2: 150, axis: 'h' },
  'db-index':   { x1: 410, y1: 150, x2: 480, y2: 150, axis: 'h' },
}

const C = {
  violet:  { hex: '#8b5cf6', glow: 'rgba(139,92,246,0.85)' },
  blue:    { hex: '#3b82f6', glow: 'rgba(59,130,246,0.85)' },
  emerald: { hex: '#10b981', glow: 'rgba(16,185,129,0.85)' },
  amber:   { hex: '#f59e0b', glow: 'rgba(245,158,11,0.85)' },
}

const DIR_MAP = {
  request:  { fwd: C.violet,  bwd: null       },
  both:     { fwd: C.violet,  bwd: C.emerald  },
  response: { fwd: C.emerald, bwd: null       },
}

function EdgeConnection({ edgeId, connections, stepKey }) {
  const edge = EDGES[edgeId]
  const dir  = connections[edgeId]
  const map  = DIR_MAP[dir]

  const { x1, y1, x2, y2 } = edge
  const fwdC    = map?.fwd ?? null
  const bwdC    = map?.bwd ?? null
  const isActive = !!map

  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={isActive ? (fwdC?.hex ?? '#1e293b') : '#182030'}
        strokeWidth={isActive ? 2 : 1}
        strokeDasharray={isActive ? 'none' : '5 4'}
        style={{ filter: isActive && fwdC ? `drop-shadow(0 0 5px ${fwdC.glow})` : 'none', transition: 'all 0.3s' }}
      />
      {fwdC && [0, 1, 2].map((p) => (
        <motion.circle key={`${stepKey}-${edgeId}-f${p}`} r={3.5} fill={fwdC.hex}
          style={{ filter: `drop-shadow(0 0 5px ${fwdC.glow})` }}
          animate={{ cx: [x1, x2], cy: y1 }}
          transition={{ duration: 0.5, delay: p * 0.16, ease: 'linear', repeat: Infinity, repeatDelay: 0.1 }}
        />
      ))}
      {bwdC && [0, 1, 2].map((p) => (
        <motion.circle key={`${stepKey}-${edgeId}-b${p}`} r={3.5} fill={bwdC.hex}
          style={{ filter: `drop-shadow(0 0 5px ${bwdC.glow})` }}
          animate={{ cx: [x2, x1], cy: y1 }}
          transition={{ duration: 0.5, delay: p * 0.16, ease: 'linear', repeat: Infinity, repeatDelay: 0.1 }}
        />
      ))}
    </g>
  )
}

function NodeBlock({ node, isActive, wasVisited, isExpanded, onClick, popKey, transactionState }) {
  const { cx, cy, w, h } = node
  const isTxActive = node.id === 'db' && transactionState === 'active'
  const isTxDone   = node.id === 'db' && transactionState === 'committed'

  const borderColor = isActive    ? node.color
                    : isTxActive  ? '#f59e0b'
                    : isTxDone    ? '#10b981'
                    : wasVisited  ? `${node.color}38`
                    : 'rgba(255,255,255,0.08)'

  const bgColor = isActive   ? `${node.color}16`
                : isTxActive ? 'rgba(245,158,11,0.06)'
                : isTxDone   ? 'rgba(16,185,129,0.06)'
                : wasVisited ? `${node.color}07`
                : 'rgba(10,18,36,1)'

  return (
    <div className="absolute" style={{ left: cx - w / 2, top: cy - h / 2, width: w, height: h }}>
      <motion.button
        onClick={onClick}
        className="relative w-full h-full rounded-xl border-2 overflow-hidden flex flex-col items-center justify-center gap-0.5 px-1 cursor-pointer focus:outline-none"
        animate={{ borderColor, backgroundColor: bgColor, boxShadow: isActive ? `0 0 28px -5px ${node.glow}` : 'none' }}
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

        <motion.p animate={{ color: isActive ? node.lc : wasVisited ? '#94a3b8' : '#475569' }}
          className="text-[10px] font-bold text-center leading-tight">
          {node.label}
        </motion.p>

        <motion.p animate={{ color: isActive ? node.color : '#1f2937' }} className="text-[9px] font-mono">
          {node.sub1}
        </motion.p>
        <p className="text-[8px] text-slate-700">{node.sub2}</p>

        <AnimatePresence>
          {(isTxActive || isTxDone) && (
            <motion.span
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 360, damping: 20 }}
              className="absolute top-1 right-1 text-[8px] font-bold font-mono border rounded px-1"
              style={{
                color:       isTxDone ? '#34d399' : '#fbbf24',
                borderColor: isTxDone ? 'rgba(52,211,153,0.35)' : 'rgba(251,191,36,0.35)',
                background:  isTxDone ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
              }}
            >
              {isTxDone ? 'COMMITTED' : 'TX ACTIVE'}
            </motion.span>
          )}
        </AnimatePresence>
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
              ...(node.dir === 'top'  ? { top: '105%',    left: '50%', transform: 'translateX(-50%)' } : {}),
              ...(node.dir === 'left' ? { right: '105%',  top: '50%',  transform: 'translateY(-50%)' } : {}),
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

export default function SqlDiagram({ onStepChange }) {
  const steps  = useMemo(() => buildSqlSteps(), [])
  const runner = useStepRunner(steps)
  const { step, index } = runner

  useEffect(() => { onStepChange?.(step) }, [step, onStepChange])

  const [expandedNode, setExpandedNode] = useState(null)

  const visitedNodes = useMemo(() => {
    const s = new Set()
    for (let i = 0; i <= index; i++) steps[i].activeNodes.forEach((id) => s.add(id))
    return s
  }, [steps, index])

  return (
    <div className="space-y-4">

      <div>
        <h2 className="text-lg font-semibold text-white">SQL — Queries, Indexes & Transactions</h2>
        <p className="text-sm text-slate-400">
          Step through how SQL queries flow from client to database, how B-tree indexes accelerate lookups, and how ACID transactions guarantee correctness.
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

            <svg className="absolute inset-0 pointer-events-none overflow-visible"
              viewBox={`0 0 ${CW} ${CH}`} width={CW} height={CH}>
              {Object.keys(EDGES).map((edgeId) => (
                <EdgeConnection key={edgeId} edgeId={edgeId} connections={step.connections} stepKey={index} />
              ))}
              <text x={175} y={138} style={{ fill: '#8b5cf685', fontSize: 9, fontFamily: 'ui-monospace,monospace', fontWeight: 600 }}>
                SQL query
              </text>
              <text x={420} y={138} style={{ fill: '#10b98185', fontSize: 9, fontFamily: 'ui-monospace,monospace', fontWeight: 600 }}>
                index scan
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
                popKey={step.activeNodes.includes(node.id) ? index : null}
                transactionState={step.transactionState}
              />
            ))}
          </div>
        </div>

        {/* ACID badge */}
        <AnimatePresence>
          {step.transactionState === 'committed' && (
            <motion.div
              key="acid"
              initial={{ opacity: 0, y: 6, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 340, damping: 22 }}
              className="mt-3 flex items-center gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/[0.07] px-4 py-2.5"
            >
              <span className="text-emerald-400 select-none">✓</span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Transaction Committed — ACID guaranteed</p>
                <p className="text-[11px] font-mono text-emerald-300">Durable write to WAL · all-or-nothing atomicity</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-5 mt-3 px-1 flex-wrap">
          {[
            { color: C.violet.hex,  glow: C.violet.glow,  label: 'query / request'  },
            { color: C.emerald.hex, glow: C.emerald.glow, label: 'result / response' },
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
