import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { buildKeyValueStoreSteps } from './steps'
import { useStepRunner } from '../../../../hooks/useStepRunner'
import StepControls from '../../../../components/ui/StepControls'
import StepBanner from '../../../../components/ui/StepBanner'

// ── Layout ────────────────────────────────────────────────────────────────────
// Left:   client
// Center: coordinator (any node acting as request router)
// Right:  three storage nodes (A, B, C) stacked vertically
// Bottom: consistent hash ring indicator

const CW = 720
const CH = 370

const NODES = [
  {
    id: 'client', label: 'Client', icon: '💻', dir: 'left',
    cx: 62, cy: 175, w: 96, h: 74,
    color: '#8b5cf6', glow: 'rgba(139,92,246,0.65)', lc: '#c4b5fd', strip: 'bg-violet-500',
    sub1: 'PUT / GET', sub2: 'any node',
    desc: 'Application sending read/write requests. Can target any node in the cluster — there is no primary gatekeeper.',
    note: 'Clients hold the cluster topology and hash the key locally to pick a coordinator.',
  },
  {
    id: 'coordinator', label: 'Coordinator', icon: '🔀', dir: 'top',
    cx: 245, cy: 175, w: 118, h: 78,
    color: '#6366f1', glow: 'rgba(99,102,241,0.65)', lc: '#a5b4fc', strip: 'bg-indigo-500',
    sub1: 'any node', sub2: 'routes + fans out',
    desc: 'The node that received the request acts as coordinator. It hashes the key, identifies the replica set, and fans out reads/writes.',
    note: 'The coordinator role is stateless and per-request — any node can be coordinator without configuration.',
  },
  {
    id: 'nodeA', label: 'Node A', icon: '🗄️', dir: 'right',
    cx: 500, cy: 100, w: 110, h: 76,
    color: '#10b981', glow: 'rgba(16,185,129,0.65)', lc: '#6ee7b7', strip: 'bg-emerald-500',
    sub1: 'primary replica', sub2: 'LSM tree',
    desc: 'Primary owner of the key range. Writes to WAL first (sequential I/O), then memtable. Periodically flushed to SSTables on disk.',
    note: 'LSM trees make writes fast (sequential) at the cost of more complex reads (multi-level merge).',
  },
  {
    id: 'nodeB', label: 'Node B', icon: '🗄️', dir: 'right',
    cx: 500, cy: 200, w: 110, h: 76,
    color: '#0ea5e9', glow: 'rgba(14,165,233,0.65)', lc: '#7dd3fc', strip: 'bg-sky-500',
    sub1: 'replica 2', sub2: 'async replication',
    desc: 'Second replica in the preference list. Receives writes asynchronously from the primary. Participates in quorum reads.',
    note: 'Asynchronous replication means B may briefly lag behind A — this is the source of eventual consistency.',
  },
  {
    id: 'nodeC', label: 'Node C', icon: '🗄️', dir: 'right',
    cx: 500, cy: 300, w: 110, h: 76,
    color: '#f59e0b', glow: 'rgba(245,158,11,0.65)', lc: '#fcd34d', strip: 'bg-amber-500',
    sub1: 'replica 3', sub2: 'hinted handoff',
    desc: 'Third replica. Can go offline; coordinator uses sloppy quorum and stores a hint for when C recovers.',
    note: 'Hinted handoff enables "always writable" — the system never refuses a write due to one failed replica.',
  },
  {
    id: 'ring', label: 'Hash Ring', icon: '⭕', dir: 'bottom',
    cx: 245, cy: 310, w: 120, h: 70,
    color: '#a855f7', glow: 'rgba(168,85,247,0.65)', lc: '#d8b4fe', strip: 'bg-purple-500',
    sub1: 'SHA-256 positions', sub2: 'virtual nodes',
    desc: 'Consistent hash ring. Each node owns a range of the ring. Virtual nodes spread a single physical node across multiple ring positions for even load.',
    note: 'Adding a node only rebalances the adjacent key range — not the full dataset. This is why consistent hashing replaced modulo hashing.',
  },
]

const EDGES = {
  'client-coordinator':  { x1: 110, y1: 175, x2: 186, y2: 175, axis: 'h' },
  'coordinator-nodeA':   { x1: 304, y1: 155, x2: 445, y2: 118, axis: 'd' },
  'coordinator-nodeB':   { x1: 304, y1: 178, x2: 445, y2: 200, axis: 'd' },
  'coordinator-nodeC':   { x1: 304, y1: 195, x2: 445, y2: 280, axis: 'd' },
  'nodeA-nodeB':         { x1: 500, y1: 138, x2: 500, y2: 162, axis: 'v' },
  'nodeB-nodeC':         { x1: 500, y1: 238, x2: 500, y2: 262, axis: 'v' },
  'nodeA-coordinator':   { x1: 445, y1: 112, x2: 304, y2: 158, axis: 'd' },
  'nodeB-coordinator':   { x1: 445, y1: 195, x2: 304, y2: 180, axis: 'd' },
  'coordinator-ring':    { x1: 245, y1: 214, x2: 245, y2: 275, axis: 'v' },
}

const C = {
  request:  { hex: '#8b5cf6', glow: 'rgba(139,92,246,0.85)' },
  response: { hex: '#10b981', glow: 'rgba(16,185,129,0.85)' },
  replicate:{ hex: '#0ea5e9', glow: 'rgba(14,165,233,0.85)' },
  gossip:   { hex: '#f59e0b', glow: 'rgba(245,158,11,0.85)' },
}

const DIR_MAP = {
  request:   { fwd: C.request,   bwd: null },
  response:  { fwd: C.response,  bwd: null },
  both:      { fwd: C.gossip,    bwd: C.gossip },
  replicate: { fwd: C.replicate, bwd: null },
}

// ── Edge connection ───────────────────────────────────────────────────────────

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

function NodeBlock({ node, isActive, wasVisited, isExpanded, onClick, popKey, isDown }) {
  const { cx, cy, w, h } = node
  const effectiveColor = isDown ? '#ef4444' : node.color
  const effectiveGlow  = isDown ? 'rgba(239,68,68,0.65)' : node.glow

  return (
    <div className="absolute" style={{ left: cx - w / 2, top: cy - h / 2, width: w, height: h }}>
      <motion.button
        onClick={onClick}
        className="relative w-full h-full rounded-xl border-2 overflow-hidden flex flex-col items-center justify-center gap-0.5 px-1 cursor-pointer focus:outline-none"
        animate={{
          borderColor:     isActive ? effectiveColor : isDown ? 'rgba(239,68,68,0.4)' : wasVisited ? `${node.color}38` : 'rgba(255,255,255,0.08)',
          backgroundColor: isActive ? `${effectiveColor}16` : isDown ? 'rgba(239,68,68,0.04)' : wasVisited ? `${node.color}07` : 'rgba(10,18,36,1)',
          boxShadow:       isActive ? `0 0 28px -5px ${effectiveGlow}` : 'none',
        }}
        transition={{ duration: 0.28 }}
      >
        <motion.div className={`absolute top-0 left-0 right-0 h-0.5 ${node.strip}`}
          animate={{ opacity: isActive ? 1 : isDown ? 0.2 : wasVisited ? 0.35 : 0.12 }} />

        {[0, 1, 2].map((i) => (
          <motion.div
            key={`${popKey ?? 'i'}-${node.id}-${i}`}
            className="absolute inset-0 rounded-xl border-2 pointer-events-none"
            style={{ borderColor: effectiveColor }}
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
          style={{ opacity: isDown ? 0.4 : 1 }}
        >
          {isDown ? '💀' : node.icon}
        </motion.span>

        <motion.p
          animate={{ color: isActive ? node.lc : isDown ? '#6b7280' : wasVisited ? '#94a3b8' : '#475569' }}
          className="text-[10px] font-bold text-center leading-tight"
        >
          {node.label}{isDown ? ' ✕' : ''}
        </motion.p>

        <motion.p
          animate={{ color: isActive ? node.color : '#1f2937' }}
          className="text-[9px] font-mono"
        >
          {isDown ? 'unavailable' : node.sub1}
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

// ── Quorum badge ──────────────────────────────────────────────────────────────

function QuorumBadge({ type }) {
  if (type !== 'quorum-write' && type !== 'quorum-read') return null
  const isWrite = type === 'quorum-write'
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={type}
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
          isWrite
            ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
            : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
        }`}
      >
        <span>{isWrite ? '✍️' : '📖'}</span>
        {isWrite ? 'W=2 of N=3 — write quorum' : 'R=2 of N=3 — read quorum  ·  W+R=4 > N=3'}
      </motion.div>
    </AnimatePresence>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function KeyValueStoreDiagram() {
  const steps  = useMemo(() => buildKeyValueStoreSteps(), [])
  const runner = useStepRunner(steps)
  const { step, index } = runner

  const [expandedNode, setExpandedNode] = useState(null)

  const visitedNodes = useMemo(() => {
    const s = new Set()
    for (let i = 0; i <= index; i++) steps[i].activeNodes.forEach((id) => s.add(id))
    return s
  }, [steps, index])

  const nodeCDown = step.type === 'hinted-handoff'

  return (
    <div className="space-y-4">

      <div>
        <h2 className="text-lg font-semibold text-white">Key-Value Store Architecture</h2>
        <p className="text-sm text-slate-400">
          Trace consistent hashing, quorum reads/writes, gossip failure detection, and conflict resolution.
        </p>
      </div>

      <QuorumBadge type={step.type} />

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
                {/* N=3 W=2 R=2 annotation */}
                <text x={176} y={270} style={{ fill: '#6d28d9', fontSize: 8, fontFamily: 'monospace', fontWeight: 700, opacity: 0.6 }}>N=3  W=2  R=2</text>
                <text x={176} y={280} style={{ fill: '#6d28d9', fontSize: 8, fontFamily: 'monospace', opacity: 0.6 }}>W+R=4 &gt; N=3</text>
                <text x={440} y={20} style={{ fill: '#064e3b', fontSize: 8, fontFamily: 'monospace', fontWeight: 700, opacity: 0.7 }}>REPLICA SET  (N=3)</text>
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
                  isDown={nodeCDown && node.id === 'nodeC'}
                />
              ))}
            </div>

            <StepBanner banner={step.banner} />
          </div>
        </div>

        <div className="flex items-center gap-5 mt-3 px-1 flex-wrap">
          {[
            { color: C.request.hex,   glow: C.request.glow,   label: 'request / route' },
            { color: C.response.hex,  glow: C.response.glow,  label: 'response / ack' },
            { color: C.replicate.hex, glow: C.replicate.glow, label: 'replication' },
            { color: C.gossip.hex,    glow: C.gossip.glow,    label: 'gossip / both' },
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
