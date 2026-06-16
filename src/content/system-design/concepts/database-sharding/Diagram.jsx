import { useMemo, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { buildDatabaseShardingSteps } from './steps'
import { useStepRunner } from '../../../../hooks/useStepRunner'
import StepControls from '../../../../components/ui/StepControls'

const CW = 640
const CH = 310

const NODES = [
  {
    id: 'client', label: 'Client', icon: '💻', dir: 'left',
    cx: 68, cy: 78, w: 96, h: 72,
    color: '#94a3b8', glow: 'rgba(148,163,184,0.55)', lc: '#cbd5e1', strip: 'bg-slate-400',
    sub1: 'app layer', sub2: 'sends queries',
    desc: 'The application layer. Must include the shard key in every write so the router can determine the target shard.',
    note: 'Application code must be shard-aware — foreign key lookups across shards require explicit fan-out logic.',
  },
  {
    id: 'router', label: 'Shard Router', icon: '🔀', dir: 'top',
    cx: 240, cy: 78, w: 118, h: 80,
    color: '#8b5cf6', glow: 'rgba(139,92,246,0.65)', lc: '#c4b5fd', strip: 'bg-violet-500',
    sub1: 'hash(shard_key)', sub2: 'routes to shard',
    desc: 'Computes hash(shard_key) % N to determine the target shard, then forwards the query. May be a library, proxy (Vitess, ProxySQL), or application logic.',
    note: 'The router is stateless — it needs no knowledge of the data, only the shard mapping.',
  },
  {
    id: 'shard-1', label: 'Shard 1', icon: '🗄️', dir: 'right',
    cx: 480, cy: 78, w: 122, h: 84,
    color: '#3b82f6', glow: 'rgba(59,130,246,0.65)', lc: '#93c5fd', strip: 'bg-blue-500',
    sub1: 'user_id 0–999K', sub2: 'range partition',
    desc: 'Holds all rows where user_id hashes to shard 0. Independently queryable — reads and writes are local.',
    note: 'Each shard is a full independent database with its own replication, backups, and failover.',
  },
  {
    id: 'shard-2', label: 'Shard 2', icon: '🗄️', dir: 'right',
    cx: 480, cy: 175, w: 122, h: 84,
    color: '#10b981', glow: 'rgba(16,185,129,0.65)', lc: '#6ee7b7', strip: 'bg-emerald-500',
    sub1: 'user_id 1M–1.99M', sub2: 'range partition',
    desc: 'Holds rows mapping to shard 1. Can be on a different physical machine, data centre, or cloud region.',
    note: 'Shards can be sized differently — important users can be isolated to a dedicated shard.',
  },
  {
    id: 'shard-3', label: 'Shard 3', icon: '🗄️', dir: 'right',
    cx: 480, cy: 268, w: 122, h: 84,
    color: '#f59e0b', glow: 'rgba(245,158,11,0.65)', lc: '#fcd34d', strip: 'bg-amber-500',
    sub1: 'user_id 2M+', sub2: 'range partition',
    desc: 'Third shard. Overflow writes from shard 2 can be moved here during resharding with minimal disruption.',
    note: 'Range-based sharding (not hash) allows hot ranges to be split and rebalanced more precisely.',
  },
]

const EDGES = {
  'client-router':   { x1: 116, y1: 78,  x2: 181, y2: 78,  axis: 'h' },
  'router-shard-1':  { x1: 299, y1: 78,  x2: 419, y2: 78,  axis: 'h' },
  'router-shard-2':  { x1: 299, y1: 95,  x2: 419, y2: 165, axis: 'd' },
  'router-shard-3':  { x1: 299, y1: 105, x2: 419, y2: 256, axis: 'd' },
}

const C = {
  violet:  { hex: '#8b5cf6', glow: 'rgba(139,92,246,0.85)' },
  blue:    { hex: '#3b82f6', glow: 'rgba(59,130,246,0.85)'  },
  emerald: { hex: '#10b981', glow: 'rgba(16,185,129,0.85)'  },
  amber:   { hex: '#f59e0b', glow: 'rgba(245,158,11,0.85)'  },
  red:     { hex: '#f43f5e', glow: 'rgba(244,63,94,0.85)'   },
}

const DIR_MAP = {
  request:  { fwd: C.violet,  bwd: null       },
  response: { fwd: C.emerald, bwd: null       },
  both:     { fwd: C.violet,  bwd: C.emerald  },
}

const LOAD_STYLE = {
  normal:     null,
  overloaded: { label: '🔴 OVERLOADED', color: C.red.hex,   bg: 'rgba(244,63,94,0.10)',   border: 'rgba(244,63,94,0.4)'   },
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

function NodeBlock({ node, isActive, wasVisited, isExpanded, onClick, popKey, shardLoad }) {
  const { cx, cy, w, h } = node
  const isShard   = node.id.startsWith('shard')
  const loadState = isShard ? shardLoad : null
  const loadStyle = loadState ? LOAD_STYLE[loadState] : null

  return (
    <div className="absolute" style={{ left: cx - w / 2, top: cy - h / 2, width: w, height: h }}>
      <motion.button
        onClick={onClick}
        className="relative w-full h-full rounded-xl border-2 overflow-hidden flex flex-col items-center justify-center gap-0.5 px-1 cursor-pointer focus:outline-none"
        animate={{
          borderColor:     isActive ? node.color : loadState === 'overloaded' ? C.red.hex : wasVisited ? `${node.color}38` : 'rgba(255,255,255,0.08)',
          backgroundColor: isActive ? `${node.color}16` : loadState === 'overloaded' ? 'rgba(244,63,94,0.06)' : wasVisited ? `${node.color}07` : 'rgba(10,18,36,1)',
          boxShadow:       isActive ? `0 0 28px -5px ${node.glow}` : loadState === 'overloaded' ? `0 0 24px -6px ${C.red.glow}` : 'none',
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

        <AnimatePresence>
          {loadStyle && (
            <motion.span
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 360, damping: 20 }}
              className="absolute bottom-1 text-[7px] font-bold font-mono px-1 rounded"
              style={{ color: loadStyle.color, background: loadStyle.bg, border: `1px solid ${loadStyle.border}` }}
            >
              {loadStyle.label}
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
              ...(node.dir === 'top'  ? { top: '105%',   left: '50%', transform: 'translateX(-50%)' } : {}),
              ...(node.dir === 'left' ? { right: '105%', top: '50%',  transform: 'translateY(-50%)' } : {}),
              ...(node.dir === 'right'? { left: '105%',  top: '50%',  transform: 'translateY(-50%)' } : {}),
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

export default function DatabaseShardingDiagram({ onStepChange }) {
  const steps  = useMemo(() => buildDatabaseShardingSteps(), [])
  const runner = useStepRunner(steps)
  const { step, index } = runner

  useEffect(() => { onStepChange?.(step) }, [step, onStepChange])

  const [expandedNode, setExpandedNode] = useState(null)

  const visitedNodes = useMemo(() => {
    const s = new Set()
    for (let i = 0; i <= index; i++) steps[i].activeNodes.forEach((id) => s.add(id))
    return s
  }, [steps, index])

  const isCrossShard = step.type === 'cross-shard-query'
  const isHotShard   = step.type === 'hot-shard'

  return (
    <div className="space-y-4">

      <div>
        <h2 className="text-lg font-semibold text-white">Database Sharding — Horizontal Partitioning</h2>
        <p className="text-sm text-slate-400">
          See how a shard router distributes writes, the cost of cross-shard queries, and the hot shard problem.
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

            {NODES.map((node) => {
              const shardLoad = node.id.startsWith('shard')
                ? step.shardLoads?.[node.id] ?? 'normal'
                : null
              return (
                <NodeBlock
                  key={node.id}
                  node={node}
                  isActive={step.activeNodes.includes(node.id)}
                  wasVisited={visitedNodes.has(node.id) && !step.activeNodes.includes(node.id)}
                  isExpanded={expandedNode === node.id}
                  onClick={() => setExpandedNode((p) => p === node.id ? null : node.id)}
                  popKey={step.activeNodes.includes(node.id) ? index : null}
                  shardLoad={shardLoad}
                />
              )
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isCrossShard && (
            <motion.div
              key="cross-shard"
              initial={{ opacity: 0, y: 6, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 340, damping: 22 }}
              className="mt-3 flex items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-500/[0.07] px-4 py-2.5"
            >
              <span className="text-amber-400 select-none">⚠️</span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Cross-Shard Fan-Out</p>
                <p className="text-[11px] font-mono text-amber-300">All 3 shards queried · results merged in application memory · O(N shards)</p>
              </div>
            </motion.div>
          )}
          {isHotShard && (
            <motion.div
              key="hot-shard"
              initial={{ opacity: 0, y: 6, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 340, damping: 22 }}
              className="mt-3 flex items-center gap-3 rounded-xl border border-red-500/40 bg-red-500/[0.07] px-4 py-2.5"
            >
              <span className="text-red-400 select-none">🔥</span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-red-400">Hot Shard Detected</p>
                <p className="text-[11px] font-mono text-red-300">Celebrity user drives 100× normal traffic to Shard 1 · others underutilised</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-5 mt-3 px-1 flex-wrap">
          {[
            { color: C.violet.hex,  glow: C.violet.glow,  label: 'routed write' },
            { color: C.emerald.hex, glow: C.emerald.glow, label: 'response'     },
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
