import { useMemo, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { buildAcidAndBaseSteps } from './steps'
import { useStepRunner } from '../../../../hooks/useStepRunner'
import StepControls from '../../../../components/ui/StepControls'

const CW = 620
const CH = 280

const NODES = [
  {
    id: 'client', label: 'Client', icon: '💻', dir: 'left',
    cx: 80, cy: 100, w: 108, h: 80,
    color: '#8b5cf6', glow: 'rgba(139,92,246,0.65)', lc: '#c4b5fd', strip: 'bg-violet-500',
    sub1: 'initiates tx', sub2: 'awaits ACK',
    desc: 'The application client that initiates transactions — a banking app, an order service, or an ORM layer issuing SQL statements.',
    note: 'The client receives a commit confirmation only after all ACID guarantees are satisfied — including WAL flush to disk.',
  },
  {
    id: 'tx-manager', label: 'Tx Manager', icon: '🔒', dir: 'top',
    cx: 280, cy: 100, w: 118, h: 80,
    color: '#6366f1', glow: 'rgba(99,102,241,0.65)', lc: '#a5b4fc', strip: 'bg-indigo-500',
    sub1: 'ACID enforcer', sub2: 'WAL + locks',
    desc: 'Coordinates atomicity, isolation, and durability. Manages the Write-Ahead Log (WAL), row locks, and the two-phase commit protocol.',
    note: 'On crash, the Tx Manager replays the WAL — committed transactions are recovered, uncommitted ones are rolled back.',
  },
  {
    id: 'database', label: 'Database', icon: '🗄️', dir: 'right',
    cx: 470, cy: 100, w: 118, h: 80,
    color: '#0ea5e9', glow: 'rgba(14,165,233,0.65)', lc: '#7dd3fc', strip: 'bg-sky-500',
    sub1: 'PostgreSQL / MySQL', sub2: 'disk + buffer pool',
    desc: 'The persistent data store. The buffer pool holds recently accessed pages in memory; the WAL ensures changes survive crashes before they reach the data files.',
    note: 'ACID databases flush the WAL to disk (fsync) before confirming COMMIT — this is what makes durability real, not just a promise.',
  },
  {
    id: 'replica', label: 'BASE Replica', icon: '🔄', dir: 'right',
    cx: 470, cy: 210, w: 118, h: 72,
    color: '#10b981', glow: 'rgba(16,185,129,0.65)', lc: '#6ee7b7', strip: 'bg-emerald-500',
    sub1: 'async replication', sub2: 'eventually consistent',
    desc: 'In a BASE system, the primary acknowledges writes immediately and propagates to replicas asynchronously. Readers on this replica may briefly see stale values.',
    note: 'Convergence window is typically milliseconds to seconds — "eventually" does not mean "might be wrong forever".',
  },
]

const EDGES = {
  'client-tx':  { x1: 134, y1: 100, x2: 221, y2: 100, axis: 'h' },
  'tx-db':      { x1: 339, y1: 100, x2: 411, y2: 100, axis: 'h' },
  'client-db':  { x1: 134, y1: 115, x2: 411, y2: 115, axis: 'h' },
  'db-replica': { x1: 470, y1: 140, x2: 470, y2: 174, axis: 'v' },
}

const C = {
  violet:  { hex: '#8b5cf6', glow: 'rgba(139,92,246,0.85)' },
  emerald: { hex: '#10b981', glow: 'rgba(16,185,129,0.85)' },
  red:     { hex: '#f43f5e', glow: 'rgba(244,63,94,0.85)'  },
  sky:     { hex: '#0ea5e9', glow: 'rgba(14,165,233,0.85)' },
}

const DIR_MAP = {
  request:  { fwd: C.violet,  bwd: null      },
  response: { fwd: C.emerald, bwd: null       },
  both:     { fwd: C.violet,  bwd: C.emerald  },
}

const TX_STATE_LABELS = {
  open:        { text: 'IN PROGRESS',  color: '#6366f1' },
  writing:     { text: 'WRITING',      color: '#0ea5e9' },
  committed:   { text: 'COMMITTED ✓', color: '#10b981' },
  'rolled-back': { text: 'ROLLBACK ✗', color: '#f43f5e' },
  isolating:   { text: 'ISOLATED',     color: '#8b5cf6' },
  base:        { text: 'BASE MODE',    color: '#10b981' },
  converging:  { text: 'CONVERGING',   color: '#10b981' },
}

function EdgeConnection({ edgeId, connections, stepKey }) {
  const edge = EDGES[edgeId]
  const dir  = connections[edgeId]
  const map  = DIR_MAP[dir]
  const { x1, y1, x2, y2, axis } = edge

  const fwdC = map?.fwd ?? null
  const bwdC = map?.bwd ?? null
  const isActive = !!map

  const fwdAnim = axis === 'v' ? { cx: x1,         cy: [y1, y2] }
                : axis === 'h' ? { cx: [x1, x2],   cy: y1       }
                :                { cx: [x1, x2],   cy: [y1, y2] }
  const bwdAnim = axis === 'v' ? { cx: x2,         cy: [y2, y1] }
                : axis === 'h' ? { cx: [x2, x1],   cy: y2       }
                :                { cx: [x2, x1],   cy: [y2, y1] }

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

function NodeBlock({ node, isActive, wasVisited, isExpanded, onClick, popKey, badge }) {
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
          {badge && (
            <motion.span
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 360, damping: 20 }}
              className="absolute top-1 right-1 text-[7px] font-bold font-mono border rounded px-1"
              style={{ color: badge.color, borderColor: `${badge.color}50`, background: `${badge.color}15` }}
            >
              {badge.text}
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

export default function AcidAndBaseDiagram() {
  const steps  = useMemo(() => buildAcidAndBaseSteps(), [])
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

  const txLabel   = step.transactionState ? TX_STATE_LABELS[step.transactionState] : null
  const isRollback = step.transactionState === 'rolled-back'
  const isCommit   = step.transactionState === 'committed'

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">ACID Transactions &amp; BASE Consistency</h2>
        <p className="text-sm text-slate-400">
          Step through a bank transfer — from BEGIN to COMMIT or ROLLBACK — then see how BASE trades correctness for availability.
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
                <text x="80"  y="22" textAnchor="middle" fill="#334155" fontSize="9" fontWeight="600" letterSpacing="1.5">CLIENT</text>
                <text x="280" y="22" textAnchor="middle" fill="#334155" fontSize="9" fontWeight="600" letterSpacing="1.5">TX MANAGER</text>
                <text x="470" y="22" textAnchor="middle" fill="#334155" fontSize="9" fontWeight="600" letterSpacing="1.5">DATA LAYER</text>

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
                  badge={node.id === 'tx-manager' && txLabel ? txLabel : null}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              {(isCommit || isRollback) && (
                <motion.div
                  key={step.transactionState}
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                  className={`mt-3 flex items-center gap-3 rounded-xl border px-4 py-2.5 ${
                    isCommit
                      ? 'border-emerald-500/40 bg-emerald-500/[0.07]'
                      : 'border-rose-500/40 bg-rose-500/[0.07]'
                  }`}
                >
                  <span className={`text-lg select-none ${isCommit ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isCommit ? '✓' : '✗'}
                  </span>
                  <div>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${isCommit ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isCommit ? 'Transaction Committed — all writes durable' : 'Transaction Rolled Back — no partial state'}
                    </p>
                    <p className={`text-[11px] font-mono ${isCommit ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {isCommit
                        ? 'WAL flushed · both writes visible · atomicity + durability delivered'
                        : 'Both writes undone · constraints preserved · atomicity + consistency delivered'}
                    </p>
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
                <span className="text-[10px] text-slate-500">response / ack</span>
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
