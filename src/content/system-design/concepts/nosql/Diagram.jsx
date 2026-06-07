import { useMemo, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { buildNoSqlSteps } from './steps'
import { useStepRunner } from '../../../../hooks/useStepRunner'
import StepControls from '../../../../components/ui/StepControls'

const CW = 640
const CH = 295

const NODES = [
  {
    id: 'client', label: 'Client', icon: '💻', dir: 'left',
    cx: 68, cy: 148, w: 96, h: 76,
    color: '#94a3b8', glow: 'rgba(148,163,184,0.55)', lc: '#cbd5e1', strip: 'bg-slate-400',
    sub1: 'app layer', sub2: 'any access pattern',
    desc: 'The application. NoSQL lets you model data to match exactly how the app reads it — one document per page load instead of multiple JOINs.',
    note: 'Drive schema design from your access patterns, not normalisation rules.',
  },
  {
    id: 'nosql', label: 'NoSQL DB', icon: '🗂️', dir: 'top',
    cx: 300, cy: 148, w: 130, h: 90,
    color: '#8b5cf6', glow: 'rgba(139,92,246,0.65)', lc: '#c4b5fd', strip: 'bg-violet-500',
    sub1: 'document store', sub2: 'MongoDB / Firestore',
    desc: 'Document store — each record is a schema-free JSON document. Fields vary between documents. Nested objects and arrays allowed. No ALTER TABLE.',
    note: 'Other NoSQL types: key-value (Redis), wide-column (Cassandra), graph (Neo4j).',
  },
  {
    id: 'node-1', label: 'Node 1', icon: '🖥️', dir: 'top',
    cx: 520, cy: 68, w: 108, h: 74,
    color: '#3b82f6', glow: 'rgba(59,130,246,0.65)', lc: '#93c5fd', strip: 'bg-blue-500',
    sub1: 'shard A + replica', sub2: 'us-east-1',
    desc: 'Holds one shard of the dataset plus replica copies of other shards. Reads for its shard are handled locally.',
    note: 'Adding this node increases both storage and write throughput — true horizontal scaling.',
  },
  {
    id: 'node-2', label: 'Node 2', icon: '🖥️', dir: 'top',
    cx: 520, cy: 157, w: 108, h: 74,
    color: '#10b981', glow: 'rgba(16,185,129,0.65)', lc: '#6ee7b7', strip: 'bg-emerald-500',
    sub1: 'shard B + replica', sub2: 'us-west-2',
    desc: 'A second physical node holding a different shard. Cross-shard queries fan out to all nodes and merge results.',
    note: 'Eventual consistency: a write to Node 2 propagates to Node 1 within milliseconds.',
  },
  {
    id: 'node-3', label: 'Node 3', icon: '🖥️', dir: 'bottom',
    cx: 520, cy: 245, w: 108, h: 74,
    color: '#f59e0b', glow: 'rgba(245,158,11,0.65)', lc: '#fcd34d', strip: 'bg-amber-500',
    sub1: 'shard C + replica', sub2: 'eu-west-1',
    desc: 'Third node in a different region. Geo-distributed replication enables low-latency reads worldwide.',
    note: 'Cassandra and DynamoDB replicate across regions automatically — no application changes needed.',
  },
]

const EDGES = {
  'client-nosql':  { x1: 116, y1: 148, x2: 235, y2: 148, axis: 'h' },
  'nosql-node-1':  { x1: 365, y1: 113, x2: 466, y2: 80,  axis: 'd' },
  'nosql-node-2':  { x1: 365, y1: 148, x2: 466, y2: 157, axis: 'h' },
  'nosql-node-3':  { x1: 365, y1: 183, x2: 466, y2: 235, axis: 'd' },
}

const C = {
  violet:  { hex: '#8b5cf6', glow: 'rgba(139,92,246,0.85)' },
  blue:    { hex: '#3b82f6', glow: 'rgba(59,130,246,0.85)'  },
  emerald: { hex: '#10b981', glow: 'rgba(16,185,129,0.85)'  },
  amber:   { hex: '#f59e0b', glow: 'rgba(245,158,11,0.85)'  },
}

const DIR_MAP = {
  request:  { fwd: C.violet,  bwd: null      },
  response: { fwd: C.emerald, bwd: null      },
  both:     { fwd: C.violet,  bwd: C.emerald },
}

const DB_MODE_BADGE = {
  document: { label: 'DOCUMENT STORE',       color: C.violet.hex, bg: 'bg-violet-500/[0.08]',  border: 'border-violet-500/40',  icon: '🗂️',  note: 'schema-free JSON · nested objects · no migration' },
  eventual: { label: 'EVENTUAL CONSISTENCY',  color: C.amber.hex,  bg: 'bg-amber-500/[0.08]',   border: 'border-amber-500/40',   icon: '⏱️',  note: 'writes propagate to replicas within milliseconds' },
  base:     { label: 'BASE SEMANTICS',        color: C.blue.hex,   bg: 'bg-blue-500/[0.08]',    border: 'border-blue-500/40',    icon: '⚖️',  note: 'Basically Available · Soft state · Eventually consistent' },
}

function EdgeConnection({ edgeId, connections, stepKey }) {
  const edge = EDGES[edgeId]
  if (!edge) return null
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
              ...(node.dir === 'top'    ? { top: '105%',    left: '50%', transform: 'translateX(-50%)' } : {}),
              ...(node.dir === 'left'   ? { right: '105%',  top: '50%',  transform: 'translateY(-50%)' } : {}),
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

export default function NoSqlDiagram({ onStepChange }) {
  const steps  = useMemo(() => buildNoSqlSteps(), [])
  const runner = useStepRunner(steps)
  const { step, index } = runner

  useEffect(() => { onStepChange?.(step) }, [step, onStepChange])

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

  const badge = step.dbMode ? DB_MODE_BADGE[step.dbMode] : null

  return (
    <div className="space-y-4">

      <div>
        <h2 className="text-lg font-semibold text-white">NoSQL — Horizontal Scale &amp; Flexible Schemas</h2>
        <p className="text-sm text-slate-400">
          Step through document storage, horizontal scaling, eventual consistency, and BASE semantics to know when to choose NoSQL.
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
        </div>

        <AnimatePresence mode="wait">
          {badge && (
            <motion.div
              key={step.dbMode}
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
            { color: C.violet.hex,  glow: C.violet.glow,  label: 'request / write' },
            { color: C.emerald.hex, glow: C.emerald.glow, label: 'response / replication' },
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
