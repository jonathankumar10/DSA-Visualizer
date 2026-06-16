import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { buildCapTheoremSteps } from './steps'
import { useStepRunner } from '../../../../hooks/useStepRunner'
import StepControls from '../../../../components/ui/StepControls'

const CW = 620
const CH = 300

const NODES = [
  {
    id: 'client', label: 'Client', icon: '💻', dir: 'top',
    cx: 310, cy: 55, w: 108, h: 72,
    color: '#8b5cf6', glow: 'rgba(139,92,246,0.65)', lc: '#c4b5fd', strip: 'bg-violet-500',
    sub1: 'reads & writes', sub2: 'any node',
    desc: 'The application client that reads and writes to the distributed system. During a partition, the client\'s experience reveals the CP vs AP trade-off.',
    note: 'CP: client sees an error during partition. AP: client sees stale data during partition. Neither is universally "better" — it depends on your use case.',
  },
  {
    id: 'node-a', label: 'Node A', icon: '🖥️', dir: 'left',
    cx: 120, cy: 200, w: 118, h: 80,
    color: '#0ea5e9', glow: 'rgba(14,165,233,0.65)', lc: '#7dd3fc', strip: 'bg-sky-500',
    sub1: 'primary / leader', sub2: 'serves reads + writes',
    desc: 'Node A — often the primary or leader in CP systems, one of many peers in AP systems. Replicates state to Node B when the network is healthy.',
    note: 'In CP systems, Node A may refuse to accept writes during a partition if it cannot confirm a quorum. In AP systems, Node A keeps serving regardless.',
  },
  {
    id: 'node-b', label: 'Node B', icon: '🖥️', dir: 'right',
    cx: 500, cy: 200, w: 118, h: 80,
    color: '#10b981', glow: 'rgba(16,185,129,0.65)', lc: '#6ee7b7', strip: 'bg-emerald-500',
    sub1: 'replica / peer', sub2: 'serves reads',
    desc: 'Node B — a replica that stays synchronized with Node A when the network is healthy. During a partition, its behavior depends on the CP vs AP choice.',
    note: 'ZooKeeper (CP): Node B stops serving to avoid returning stale data. Cassandra (AP): Node B keeps serving from whatever state it has.',
  },
]

const EDGES = {
  'client-a': { x1: 256, y1: 91,  x2: 179, y2: 160, axis: 'd' },
  'client-b': { x1: 364, y1: 91,  x2: 441, y2: 160, axis: 'd' },
  'a-b':      { x1: 238, y1: 200, x2: 441, y2: 200, axis: 'h' },
}

const C = {
  violet:  { hex: '#8b5cf6', glow: 'rgba(139,92,246,0.85)'  },
  sky:     { hex: '#0ea5e9', glow: 'rgba(14,165,233,0.85)'  },
  emerald: { hex: '#10b981', glow: 'rgba(16,185,129,0.85)'  },
  red:     { hex: '#f43f5e', glow: 'rgba(244,63,94,0.85)'   },
  amber:   { hex: '#f59e0b', glow: 'rgba(245,158,11,0.85)'  },
}

const DIR_MAP = {
  request:  { fwd: C.violet, bwd: null      },
  response: { fwd: C.emerald, bwd: null     },
  both:     { fwd: C.violet, bwd: C.emerald },
}

const CAP_BADGE = {
  CP: { bg: 'bg-sky-500/10',    border: 'border-sky-500/40',    text: 'text-sky-400',    label: 'CP — Consistent + Partition Tolerant',    sub: 'Refuses requests during partition to guarantee correctness' },
  AP: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/40', text: 'text-emerald-400', label: 'AP — Available + Partition Tolerant', sub: 'Serves stale data during partition to guarantee availability' },
  CA: { bg: 'bg-violet-500/10', border: 'border-violet-500/40', text: 'text-violet-400', label: 'CA — Consistent + Available (single node)', sub: 'Not partition-tolerant — only possible without distribution' },
}

function EdgeConnection({ edgeId, connections, stepKey, partitioned }) {
  const edge = EDGES[edgeId]
  const dir  = connections[edgeId]
  const map  = DIR_MAP[dir]
  const { x1, y1, x2, y2, axis } = edge

  const fwdC = map?.fwd ?? null
  const bwdC = map?.bwd ?? null
  const isActive = !!map

  const isPartitionEdge = edgeId === 'a-b'
  const showPartition = isPartitionEdge && partitioned

  const fwdAnim = axis === 'v' ? { cx: x1,       cy: [y1, y2] }
                : axis === 'h' ? { cx: [x1, x2], cy: y1       }
                :                { cx: [x1, x2], cy: [y1, y2] }
  const bwdAnim = axis === 'v' ? { cx: x2,       cy: [y2, y1] }
                : axis === 'h' ? { cx: [x2, x1], cy: y2       }
                :                { cx: [x2, x1], cy: [y2, y1] }

  if (showPartition) {
    const midX = (x1 + x2) / 2
    const midY = (y1 + y2) / 2
    return (
      <g>
        <line x1={x1} y1={y1} x2={midX - 14} y2={midY} stroke="#374151" strokeWidth={1} strokeDasharray="5 4" />
        <line x1={midX + 14} y1={midY} x2={x2} y2={y2} stroke="#374151" strokeWidth={1} strokeDasharray="5 4" />
        <motion.g
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <line x1={midX - 12} y1={midY - 12} x2={midX + 12} y2={midY + 12} stroke={C.red.hex} strokeWidth={2.5}
            style={{ filter: `drop-shadow(0 0 5px ${C.red.glow})` }} />
          <line x1={midX + 12} y1={midY - 12} x2={midX - 12} y2={midY + 12} stroke={C.red.hex} strokeWidth={2.5}
            style={{ filter: `drop-shadow(0 0 5px ${C.red.glow})` }} />
        </motion.g>
        <text x={midX} y={midY + 22} textAnchor="middle" fill={C.red.hex} fontSize="8" fontWeight="700"
          style={{ filter: `drop-shadow(0 0 4px ${C.red.glow})` }}>
          PARTITION
        </text>
      </g>
    )
  }

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

function NodeBlock({ node, isActive, wasVisited, isExpanded, onClick, popKey, refused }) {
  const { cx, cy, w, h } = node
  return (
    <div className="absolute" style={{ left: cx - w / 2, top: cy - h / 2, width: w, height: h }}>
      <motion.button
        onClick={onClick}
        className="relative w-full h-full rounded-xl border-2 overflow-hidden flex flex-col items-center justify-center gap-0.5 px-1 cursor-pointer focus:outline-none"
        animate={{
          borderColor:     refused ? C.red.hex : isActive ? node.color : wasVisited ? `${node.color}38` : 'rgba(255,255,255,0.08)',
          backgroundColor: refused ? 'rgba(244,63,94,0.08)' : isActive ? `${node.color}16` : wasVisited ? `${node.color}07` : 'rgba(10,18,36,1)',
          boxShadow:       refused ? `0 0 24px -6px ${C.red.glow}` : isActive ? `0 0 28px -5px ${node.glow}` : 'none',
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

        <motion.p animate={{ color: refused ? C.red.hex : isActive ? node.lc : wasVisited ? '#94a3b8' : '#475569' }}
          className="text-[10px] font-bold text-center leading-tight">
          {node.label}
        </motion.p>

        <motion.p animate={{ color: isActive ? node.color : '#1f2937' }} className="text-[9px] font-mono">
          {refused ? 'REFUSING' : node.sub1}
        </motion.p>
        <p className="text-[8px] text-slate-700">{node.sub2}</p>

        <AnimatePresence>
          {refused && (
            <motion.span
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 360, damping: 20 }}
              className="absolute top-1 right-1 text-[7px] font-bold font-mono text-rose-400 bg-rose-400/10 border border-rose-400/30 rounded px-1"
            >
              UNAVAIL
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

export default function CapTheoremDiagram() {
  const steps  = useMemo(() => buildCapTheoremSteps(), [])
  const runner = useStepRunner(steps)
  const { step, index } = runner

  const [expandedNode, setExpandedNode] = useState(null)

  const visitedNodes = useMemo(() => {
    const s = new Set()
    for (let i = 0; i <= index; i++) steps[i].activeNodes.forEach((id) => s.add(id))
    return s
  }, [steps, index])

  const capBadge = step.capChoice ? CAP_BADGE[step.capChoice] : null

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">CAP Theorem</h2>
        <p className="text-sm text-slate-400">
          Watch a network partition split two nodes and force the system to choose between consistency (CP) and availability (AP).
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
                    partitioned={step.partition}
                  />
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
                  popKey={step.activeNodes.includes(node.id) ? index : null}
                  refused={step.capChoice === 'CP' && step.partition && node.id === 'node-a'}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              {capBadge && (
                <motion.div
                  key={step.capChoice}
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                  className={`mt-3 flex items-center gap-3 rounded-xl border px-4 py-2.5 ${capBadge.bg} ${capBadge.border}`}
                >
                  <span className={`text-xl font-black ${capBadge.text} select-none`}>{step.capChoice}</span>
                  <div>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${capBadge.text}`}>{capBadge.label}</p>
                    <p className={`text-[11px] font-mono ${capBadge.text} opacity-80`}>{capBadge.sub}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-5 mt-3 px-1 flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-px rounded-full" style={{ background: C.violet.hex, boxShadow: `0 0 4px ${C.violet.glow}` }} />
                <span className="text-[10px] text-slate-500">request / write</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-px rounded-full" style={{ background: C.emerald.hex, boxShadow: `0 0 4px ${C.emerald.glow}` }} />
                <span className="text-[10px] text-slate-500">response / replication</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-px rounded-full" style={{ background: C.red.hex, boxShadow: `0 0 4px ${C.red.glow}` }} />
                <span className="text-[10px] text-slate-500">network partition</span>
              </div>
              <span className="text-[10px] text-slate-600 ml-auto hidden sm:inline">tap any node for details</span>
            </div>
          </div>
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
