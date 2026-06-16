import { useMemo, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { buildDatabaseReplicationSteps } from './steps'
import { useStepRunner } from '../../../../hooks/useStepRunner'
import StepControls from '../../../../components/ui/StepControls'

const CW = 640
const CH = 310

const NODES = [
  {
    id: 'client', label: 'Client', icon: '💻', dir: 'left',
    cx: 72, cy: 155, w: 96, h: 74,
    color: '#94a3b8', glow: 'rgba(148,163,184,0.55)', lc: '#cbd5e1', strip: 'bg-slate-400',
    sub1: 'reads + writes', sub2: 'app / service',
    desc: 'The application making database requests. Writes always go to the primary; reads can be routed to replicas.',
    note: 'A read/write splitting proxy (e.g. ProxySQL) can handle routing transparently.',
  },
  {
    id: 'primary', label: 'Primary', icon: '🗄️', dir: 'top',
    cx: 240, cy: 155, w: 118, h: 88,
    color: '#3b82f6', glow: 'rgba(59,130,246,0.65)', lc: '#93c5fd', strip: 'bg-blue-500',
    sub1: 'all writes', sub2: 'WAL stream',
    desc: 'The single write node. Receives all INSERT/UPDATE/DELETE operations and writes them to the Write-Ahead Log.',
    note: 'Every write is replicated from here. The primary is a SPOF unless failover is configured.',
  },
  {
    id: 'replica-1', label: 'Replica 1', icon: '🗄️', dir: 'right',
    cx: 490, cy: 78, w: 118, h: 78,
    color: '#8b5cf6', glow: 'rgba(139,92,246,0.65)', lc: '#c4b5fd', strip: 'bg-violet-500',
    sub1: 'sync replica', sub2: 'zero data loss',
    desc: 'Synchronous replica — the primary waits for this replica to confirm receipt before acknowledging the write.',
    note: 'One sync replica provides zero data loss on primary failure, at the cost of one extra network RTT per write.',
  },
  {
    id: 'replica-2', label: 'Replica 2', icon: '🗄️', dir: 'right',
    cx: 490, cy: 168, w: 118, h: 78,
    color: '#10b981', glow: 'rgba(16,185,129,0.65)', lc: '#6ee7b7', strip: 'bg-emerald-500',
    sub1: 'async replica', sub2: 'read traffic',
    desc: 'Asynchronous replica — replicates WAL changes in background. Absorbs read traffic to reduce primary load.',
    note: 'Replication lag is typically < 10 ms but can spike under heavy write load.',
  },
  {
    id: 'replica-3', label: 'Replica 3', icon: '🗄️', dir: 'right',
    cx: 490, cy: 258, w: 118, h: 78,
    color: '#f59e0b', glow: 'rgba(245,158,11,0.65)', lc: '#fcd34d', strip: 'bg-amber-500',
    sub1: 'async replica', sub2: 'read traffic',
    desc: 'Second async replica. 1 primary + 3 replicas is a common production configuration for read-heavy workloads.',
    note: 'In a failover, the replica with the least lag is promoted to primary.',
  },
]

const EDGES = {
  'client-primary':   { x1: 120, y1: 155, x2: 181, y2: 155, axis: 'h' },
  'client-replica-3': { x1: 120, y1: 172, x2: 431, y2: 250, axis: 'd' },
  'primary-replica-1':{ x1: 299, y1: 118, x2: 431, y2: 90,  axis: 'd' },
  'primary-replica-2':{ x1: 299, y1: 155, x2: 431, y2: 168, axis: 'd' },
  'primary-replica-3':{ x1: 299, y1: 192, x2: 431, y2: 248, axis: 'd' },
}

const C = {
  blue:    { hex: '#3b82f6', glow: 'rgba(59,130,246,0.85)'  },
  violet:  { hex: '#8b5cf6', glow: 'rgba(139,92,246,0.85)'  },
  emerald: { hex: '#10b981', glow: 'rgba(16,185,129,0.85)'  },
  amber:   { hex: '#f59e0b', glow: 'rgba(245,158,11,0.85)'  },
  red:     { hex: '#f43f5e', glow: 'rgba(244,63,94,0.85)'   },
}

const DIR_MAP = {
  request:  { fwd: C.blue,    bwd: null       },
  response: { fwd: C.emerald, bwd: null       },
  both:     { fwd: C.blue,    bwd: C.emerald  },
}

const STATUS_STYLE = {
  synced:   { label: '● SYNCED',   color: '#34d399', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(52,211,153,0.4)'  },
  lagging:  { label: '⟳ LAGGING', color: '#fbbf24', bg: 'rgba(245,158,11,0.10)',  border: 'rgba(251,191,36,0.4)'  },
  promoted: { label: '★ PRIMARY',  color: '#a78bfa', bg: 'rgba(139,92,246,0.14)',  border: 'rgba(167,139,250,0.5)' },
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

function NodeBlock({ node, isActive, wasVisited, isExpanded, onClick, popKey, replicaStatus }) {
  const { cx, cy, w, h } = node
  const isReplica = node.id.startsWith('replica')
  const status    = isReplica ? replicaStatus?.[node.id] : null
  const st        = status ? STATUS_STYLE[status] : null

  const isPrimary = node.id === 'primary'
  const isPromoted = isReplica && status === 'promoted'

  return (
    <div className="absolute" style={{ left: cx - w / 2, top: cy - h / 2, width: w, height: h }}>
      <motion.button
        onClick={onClick}
        className="relative w-full h-full rounded-xl border-2 overflow-hidden flex flex-col items-center justify-center gap-0.5 px-1 cursor-pointer focus:outline-none"
        animate={{
          borderColor:     isActive ? node.color : isPromoted ? '#a78bfa' : wasVisited ? `${node.color}38` : 'rgba(255,255,255,0.08)',
          backgroundColor: isActive ? `${node.color}16` : isPromoted ? 'rgba(139,92,246,0.08)' : wasVisited ? `${node.color}07` : 'rgba(10,18,36,1)',
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
          {isPromoted ? '⭐' : node.icon}
        </motion.span>

        <motion.p
          animate={{ color: isActive ? node.lc : wasVisited ? '#94a3b8' : '#475569' }}
          className="text-[10px] font-bold text-center leading-tight"
        >
          {isPromoted ? 'New Primary' : node.label}
        </motion.p>

        <motion.p animate={{ color: isActive ? node.color : '#1f2937' }} className="text-[9px] font-mono">
          {node.sub1}
        </motion.p>

        {st && (
          <motion.span
            animate={{ color: st.color, backgroundColor: st.bg, borderColor: st.border }}
            transition={{ duration: 0.35 }}
            className="mt-0.5 rounded border px-1.5 text-[8px] font-bold font-mono leading-4"
          >
            {st.label}
          </motion.span>
        )}
        {isPrimary && (
          <p className="text-[8px] text-slate-700">{node.sub2}</p>
        )}
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

export default function DatabaseReplicationDiagram({ onStepChange }) {
  const steps  = useMemo(() => buildDatabaseReplicationSteps(), [])
  const runner = useStepRunner(steps)
  const { step, index } = runner

  useEffect(() => { onStepChange?.(step) }, [step, onStepChange])

  const [expandedNode, setExpandedNode] = useState(null)

  const visitedNodes = useMemo(() => {
    const s = new Set()
    for (let i = 0; i <= index; i++) steps[i].activeNodes.forEach((id) => s.add(id))
    return s
  }, [steps, index])

  const isFailover = step.mode === 'failover'
  const isSync     = step.mode === 'sync'

  return (
    <div className="space-y-4">

      <div>
        <h2 className="text-lg font-semibold text-white">Database Replication — Primary &amp; Replicas</h2>
        <p className="text-sm text-slate-400">
          Step through WAL streaming, async vs sync replication, read replicas, and automatic failover.
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
              <text x={310} y={22}
                style={{ fill: isSync ? C.violet.hex : C.blue.hex, fontSize: 9, fontFamily: 'ui-monospace, monospace', fontWeight: 700, opacity: 0.7 }}>
                {isSync ? 'SYNCHRONOUS MODE' : isFailover ? 'FAILOVER IN PROGRESS' : 'ASYNC MODE'}
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
                replicaStatus={step.replicaStatus}
              />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isFailover && (
            <motion.div
              key="failover"
              initial={{ opacity: 0, y: 6, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 340, damping: 22 }}
              className="mt-3 flex items-center gap-3 rounded-xl border border-violet-500/40 bg-violet-500/[0.07] px-4 py-2.5"
            >
              <span className="text-violet-400 select-none">⭐</span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-violet-400">Failover Initiated</p>
                <p className="text-[11px] font-mono text-violet-300">Replica 1 promoted to primary · DNS updated · RTO ~30–60 s</p>
              </div>
            </motion.div>
          )}
          {isSync && (
            <motion.div
              key="sync"
              initial={{ opacity: 0, y: 6, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 340, damping: 22 }}
              className="mt-3 flex items-center gap-3 rounded-xl border border-blue-500/40 bg-blue-500/[0.07] px-4 py-2.5"
            >
              <span className="text-blue-400 select-none">🔒</span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Synchronous Mode</p>
                <p className="text-[11px] font-mono text-blue-300">Write blocked until replica confirms · zero data loss · +1 RTT per write</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-5 mt-3 px-1 flex-wrap">
          {[
            { color: C.blue.hex,    glow: C.blue.glow,    label: 'write / WAL stream' },
            { color: C.emerald.hex, glow: C.emerald.glow, label: 'read / acknowledge' },
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
