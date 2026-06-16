import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { buildConsistencyPatternsSteps } from './steps'
import { useStepRunner } from '../../../../hooks/useStepRunner'
import StepControls from '../../../../components/ui/StepControls'

const CW = 640
const CH = 310

const NODES = [
  {
    id: 'writer', label: 'Writer', icon: '✍️', dir: 'left',
    cx: 72, cy: 155, w: 104, h: 74,
    color: '#8b5cf6', glow: 'rgba(139,92,246,0.65)', lc: '#c4b5fd', strip: 'bg-violet-500',
    sub1: 'writes x=1', sub2: 'client / app server',
    desc: 'The writer sends a write operation to the primary. The consistency model determines how quickly and how reliably that write becomes visible to subsequent readers.',
    note: 'In a well-designed system, the writer\'s consistency requirement (strong, eventual, etc.) is set per-operation based on the business need — not globally for the entire service.',
  },
  {
    id: 'primary', label: 'Primary DB', icon: '🗄️', dir: 'top',
    cx: 280, cy: 155, w: 122, h: 80,
    color: '#0ea5e9', glow: 'rgba(14,165,233,0.65)', lc: '#7dd3fc', strip: 'bg-sky-500',
    sub1: 'receives writes', sub2: 'source of truth',
    desc: 'The primary database node that receives all write operations. The consistency level determines how many replicas must confirm before the primary acknowledges the write.',
    note: 'Strong consistency: waits for quorum ACK before replying. Eventual consistency: acknowledges immediately and replicates asynchronously.',
  },
  {
    id: 'replica-a', label: 'Replica A', icon: '💾', dir: 'right',
    cx: 490, cy: 95, w: 116, h: 74,
    color: '#10b981', glow: 'rgba(16,185,129,0.65)', lc: '#6ee7b7', strip: 'bg-emerald-500',
    sub1: 'sync / async copy', sub2: 'serves reads',
    desc: 'A read replica that receives replication from the primary. In strong consistency, the primary waits for this replica to confirm before acknowledging the write.',
    note: 'Read replicas handle 80-95% of traffic in read-heavy systems. The consistency level per read determines whether you hit the replica or the primary.',
  },
  {
    id: 'replica-b', label: 'Replica B', icon: '💾', dir: 'right',
    cx: 490, cy: 225, w: 116, h: 74,
    color: '#f59e0b', glow: 'rgba(245,158,11,0.65)', lc: '#fcd34d', strip: 'bg-amber-500',
    sub1: 'async copy', sub2: 'may lag behind',
    desc: 'A second read replica, potentially in a different availability zone or region. May be slightly behind Replica A due to replication lag differences.',
    note: 'Without monotonic reads, a user can see data from Replica A (fast) then stale data from Replica B (lagging) on the next request — the time-travel anti-pattern.',
  },
]

const EDGES = {
  'writer-primary': { x1: 124, y1: 155, x2: 219, y2: 155, axis: 'h' },
  'primary-ra':     { x1: 341, y1: 128, x2: 432, y2: 108, axis: 'd' },
  'primary-rb':     { x1: 341, y1: 182, x2: 432, y2: 212, axis: 'd' },
}

const C = {
  violet:  { hex: '#8b5cf6', glow: 'rgba(139,92,246,0.85)'  },
  sky:     { hex: '#0ea5e9', glow: 'rgba(14,165,233,0.85)'  },
  emerald: { hex: '#10b981', glow: 'rgba(16,185,129,0.85)'  },
  amber:   { hex: '#f59e0b', glow: 'rgba(245,158,11,0.85)'  },
  red:     { hex: '#f43f5e', glow: 'rgba(244,63,94,0.85)'   },
}

const DIR_MAP = {
  request:  { fwd: C.violet,  bwd: null      },
  response: { fwd: C.emerald, bwd: null      },
  both:     { fwd: C.violet,  bwd: C.emerald },
}

const CONSISTENCY_INFO = {
  strong:           { label: 'Strong Consistency',      color: 'sky',     sub: 'Quorum write confirmed before ACK — every reader sees the latest write' },
  eventual:         { label: 'Eventual Consistency',    color: 'amber',   sub: 'Write acknowledged immediately — replicas sync asynchronously in ms–s' },
  weak:             { label: 'Weak Consistency',        color: 'rose',    sub: 'No timing guarantee — reads may miss the write indefinitely' },
  'read-your-writes': { label: 'Read-Your-Writes',      color: 'violet',  sub: 'You always see your own writes — others may briefly see stale data' },
  'monotonic-reads':  { label: 'Monotonic Reads',       color: 'emerald', sub: 'Once you see version V, you never see an older version on any read' },
  causal:           { label: 'Causal Consistency',      color: 'sky',     sub: 'Causally related writes appear in order — independent writes may reorder' },
  session:          { label: 'Session Consistency',     color: 'violet',  sub: 'Read-your-writes + monotonic reads within your session' },
}

const COLOR_MAP = {
  sky:     { bg: 'bg-sky-500/10',     border: 'border-sky-500/40',     text: 'text-sky-400'     },
  amber:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/40',   text: 'text-amber-400'   },
  rose:    { bg: 'bg-rose-500/10',    border: 'border-rose-500/40',    text: 'text-rose-400'    },
  violet:  { bg: 'bg-violet-500/10',  border: 'border-violet-500/40',  text: 'text-violet-400'  },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/40', text: 'text-emerald-400' },
}

function EdgeConnection({ edgeId, connections, stepKey, consistency }) {
  const edge = EDGES[edgeId]
  const dir  = connections[edgeId]
  const map  = DIR_MAP[dir]
  const { x1, y1, x2, y2, axis } = edge

  const fwdC = map?.fwd ?? null
  const bwdC = map?.bwd ?? null
  const isActive = !!map

  const isAsyncEdge = edgeId === 'primary-rb' && consistency === 'eventual'

  const fwdAnim = axis === 'v' ? { cx: x1,       cy: [y1, y2] }
                : axis === 'h' ? { cx: [x1, x2], cy: y1       }
                :                { cx: [x1, x2], cy: [y1, y2] }
  const bwdAnim = axis === 'v' ? { cx: x2,       cy: [y2, y1] }
                : axis === 'h' ? { cx: [x2, x1], cy: y2       }
                :                { cx: [x2, x1], cy: [y2, y1] }

  return (
    <g>
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={isActive ? (fwdC?.hex ?? '#1e293b') : '#182030'}
        strokeWidth={isActive ? 2 : 1}
        strokeDasharray={isAsyncEdge ? '6 4' : isActive ? 'none' : '5 4'}
        style={{ filter: isActive && fwdC ? `drop-shadow(0 0 5px ${fwdC.glow})` : 'none', transition: 'all 0.3s' }}
      />
      {isAsyncEdge && isActive && (
        <text
          x={(x1 + x2) / 2 - 8} y={(y1 + y2) / 2 - 6}
          fill={C.amber.hex} fontSize="7" fontWeight="600"
          style={{ filter: `drop-shadow(0 0 3px ${C.amber.glow})` }}
        >
          async
        </text>
      )}
      {fwdC && [0, 1, 2].map((p) => (
        <motion.circle
          key={`${stepKey}-${edgeId}-f${p}`}
          r={3.5} fill={fwdC.hex}
          style={{ filter: `drop-shadow(0 0 5px ${fwdC.glow})` }}
          animate={fwdAnim}
          transition={{ duration: isAsyncEdge ? 0.9 : 0.5, delay: p * 0.16, ease: 'linear', repeat: Infinity, repeatDelay: isAsyncEdge ? 0.4 : 0.1 }}
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

function NodeBlock({ node, isActive, wasVisited, isExpanded, onClick, popKey, staleBadge }) {
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

        <motion.p animate={{ color: isActive ? node.lc : wasVisited ? '#94a3b8' : '#475569' }}
          className="text-[10px] font-bold text-center leading-tight">
          {node.label}
        </motion.p>

        <motion.p animate={{ color: isActive ? node.color : '#1f2937' }} className="text-[9px] font-mono">
          {node.sub1}
        </motion.p>
        <p className="text-[8px] text-slate-700">{node.sub2}</p>

        <AnimatePresence>
          {staleBadge && (
            <motion.span
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 360, damping: 20 }}
              className="absolute top-1 right-1 text-[7px] font-bold font-mono text-amber-400 bg-amber-400/10 border border-amber-400/30 rounded px-1"
            >
              STALE
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

export default function ConsistencyPatternsDiagram() {
  const steps  = useMemo(() => buildConsistencyPatternsSteps(), [])
  const runner = useStepRunner(steps)
  const { step, index } = runner

  const [expandedNode, setExpandedNode] = useState(null)

  const visitedNodes = useMemo(() => {
    const s = new Set()
    for (let i = 0; i <= index; i++) steps[i].activeNodes.forEach((id) => s.add(id))
    return s
  }, [steps, index])

  const consistencyInfo = step.consistency ? CONSISTENCY_INFO[step.consistency] : null
  const colorStyle = consistencyInfo ? COLOR_MAP[consistencyInfo.color] : null

  const showStaleBadge = step.consistency === 'eventual' || step.consistency === 'weak'

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">Consistency Patterns</h2>
        <p className="text-sm text-slate-400">
          Step through strong, eventual, weak, read-your-writes, monotonic, and causal consistency. See what each guarantees — and what it costs.
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
                <text x="72"  y="22" textAnchor="middle" fill="#334155" fontSize="9" fontWeight="600" letterSpacing="1.5">WRITER</text>
                <text x="280" y="22" textAnchor="middle" fill="#334155" fontSize="9" fontWeight="600" letterSpacing="1.5">PRIMARY</text>
                <text x="490" y="22" textAnchor="middle" fill="#334155" fontSize="9" fontWeight="600" letterSpacing="1.5">REPLICAS</text>

                {Object.keys(EDGES).map((edgeId) => (
                  <EdgeConnection
                    key={edgeId}
                    edgeId={edgeId}
                    connections={step.connections}
                    stepKey={index}
                    consistency={step.consistency}
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
                  staleBadge={showStaleBadge && node.id === 'replica-b' && step.activeNodes.includes('replica-a')}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              {consistencyInfo && colorStyle && (
                <motion.div
                  key={step.consistency}
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                  className={`mt-3 flex items-center gap-3 rounded-xl border px-4 py-2.5 ${colorStyle.bg} ${colorStyle.border}`}
                >
                  <div>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${colorStyle.text}`}>{consistencyInfo.label}</p>
                    <p className={`text-[11px] font-mono ${colorStyle.text} opacity-80`}>{consistencyInfo.sub}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-5 mt-3 px-1 flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-px rounded-full" style={{ background: C.violet.hex, boxShadow: `0 0 4px ${C.violet.glow}` }} />
                <span className="text-[10px] text-slate-500">write / request</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-px rounded-full" style={{ background: C.emerald.hex, boxShadow: `0 0 4px ${C.emerald.glow}` }} />
                <span className="text-[10px] text-slate-500">replication / response</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-2 border-b-2 border-dashed rounded-full" style={{ borderColor: C.amber.hex }} />
                <span className="text-[10px] text-slate-500">async / eventual</span>
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
