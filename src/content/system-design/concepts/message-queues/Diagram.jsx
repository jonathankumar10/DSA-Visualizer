import { useMemo, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { buildMessageQueuesSteps } from './steps'
import { useStepRunner } from '../../../../hooks/useStepRunner'
import StepControls from '../../../../components/ui/StepControls'

const CW = 660
const CH = 320

const NODES = [
  {
    id: 'producer', label: 'Producer', icon: '📤', dir: 'left',
    cx: 80, cy: 155, w: 112, h: 78,
    color: '#8b5cf6', glow: 'rgba(139,92,246,0.65)', lc: '#c4b5fd', strip: 'bg-violet-500',
    sub1: 'publishes & moves on', sub2: 'Order / Payment Svc',
    desc: 'The producer generates work and publishes messages to the queue. It does not wait for the work to be processed — it publishes and immediately returns to its next task.',
    note: 'Producers and consumers are completely independent. They can be written in different languages, deployed separately, and scaled independently.',
  },
  {
    id: 'queue', label: 'Queue / Broker', icon: '📨', dir: 'top',
    cx: 310, cy: 155, w: 132, h: 88,
    color: '#f59e0b', glow: 'rgba(245,158,11,0.65)', lc: '#fcd34d', strip: 'bg-amber-500',
    sub1: 'Kafka · SQS · RabbitMQ', sub2: 'durable buffer',
    desc: 'The message broker durably persists messages. Messages survive broker restarts. Consumers must explicitly acknowledge receipt — unacknowledged messages are redelivered.',
    note: 'Kafka retains messages for days/weeks — consumers can replay. SQS/RabbitMQ delete on ACK. Choose based on whether replay and event sourcing matter for your use case.',
  },
  {
    id: 'consumer-a', label: 'Consumer A', icon: '📥', dir: 'right',
    cx: 560, cy: 95, w: 116, h: 74,
    color: '#10b981', glow: 'rgba(16,185,129,0.65)', lc: '#6ee7b7', strip: 'bg-emerald-500',
    sub1: 'processes messages', sub2: 'email / notification',
    desc: 'Consumer A subscribes to the queue and processes messages at its own pace. It must be idempotent — processing the same message twice must produce the same result.',
    note: 'Scale consumers horizontally: add more Consumer A instances to increase throughput. Each instance competes for messages from the same queue.',
  },
  {
    id: 'consumer-b', label: 'Consumer B', icon: '📥', dir: 'right',
    cx: 560, cy: 215, w: 116, h: 74,
    color: '#0ea5e9', glow: 'rgba(14,165,233,0.65)', lc: '#7dd3fc', strip: 'bg-sky-500',
    sub1: 'independent group', sub2: 'analytics / warehouse',
    desc: 'Consumer B belongs to a different consumer group (pub/sub) or competes with Consumer A for the same messages (point-to-point). Both receive messages from the same queue.',
    note: 'Kafka consumer groups: each group gets its own copy of every message (pub/sub fan-out). SQS competing consumers: each message delivered to exactly one consumer.',
  },
  {
    id: 'dlq', label: 'Dead Letter', icon: '💀', dir: 'bottom',
    cx: 560, cy: 285, w: 116, h: 60,
    color: '#f43f5e', glow: 'rgba(244,63,94,0.65)', lc: '#fda4af', strip: 'bg-rose-500',
    sub1: 'failed messages', sub2: 'inspect + replay',
    desc: 'The Dead Letter Queue captures messages that fail processing after N retry attempts. Manual inspection reveals whether the message is malformed, the consumer has a bug, or the dependency is unavailable.',
    note: 'Without a DLQ, a poison-pill message blocks all consumers permanently. DLQs are mandatory in production — configure them before your first deployment.',
  },
]

const EDGES = {
  'producer-queue': { x1: 136, y1: 155, x2: 244, y2: 155, axis: 'h' },
  'queue-ca':       { x1: 376, y1: 128, x2: 502, y2: 108, axis: 'd' },
  'queue-cb':       { x1: 376, y1: 182, x2: 502, y2: 202, axis: 'd' },
  'queue-dlq':      { x1: 376, y1: 196, x2: 502, y2: 268, axis: 'd' },
}

const C = {
  violet:  { hex: '#8b5cf6', glow: 'rgba(139,92,246,0.85)'  },
  amber:   { hex: '#f59e0b', glow: 'rgba(245,158,11,0.85)'  },
  emerald: { hex: '#10b981', glow: 'rgba(16,185,129,0.85)'  },
  sky:     { hex: '#0ea5e9', glow: 'rgba(14,165,233,0.85)'  },
  red:     { hex: '#f43f5e', glow: 'rgba(244,63,94,0.85)'   },
}

const DIR_MAP = {
  request:  { fwd: C.violet,  bwd: null      },
  response: { fwd: C.emerald, bwd: null      },
  both:     { fwd: C.amber,   bwd: C.emerald },
}

const MAX_DEPTH_DISPLAY = 6

function EdgeConnection({ edgeId, connections, stepKey }) {
  const edge = EDGES[edgeId]
  const dir  = connections[edgeId]
  const map  = DIR_MAP[dir]
  const { x1, y1, x2, y2, axis } = edge

  const fwdC = map?.fwd ?? null
  const bwdC = map?.bwd ?? null
  const isActive = !!map

  const isDlqEdge = edgeId === 'queue-dlq'

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
        stroke={isActive ? (isDlqEdge ? C.red.hex : fwdC?.hex ?? '#1e293b') : '#182030'}
        strokeWidth={isActive ? 2 : 1}
        strokeDasharray={isDlqEdge && isActive ? '5 3' : isActive ? 'none' : '5 4'}
        style={{
          filter: isActive ? `drop-shadow(0 0 5px ${isDlqEdge ? C.red.glow : fwdC?.glow ?? 'none'})` : 'none',
          transition: 'all 0.3s',
        }}
      />
      {fwdC && !isDlqEdge && [0, 1, 2].map((p) => (
        <motion.circle
          key={`${stepKey}-${edgeId}-f${p}`}
          r={3.5} fill={fwdC.hex}
          style={{ filter: `drop-shadow(0 0 5px ${fwdC.glow})` }}
          animate={fwdAnim}
          transition={{ duration: 0.5, delay: p * 0.16, ease: 'linear', repeat: Infinity, repeatDelay: 0.1 }}
        />
      ))}
      {isDlqEdge && isActive && [0, 1].map((p) => (
        <motion.circle
          key={`${stepKey}-${edgeId}-dlq${p}`}
          r={3} fill={C.red.hex}
          style={{ filter: `drop-shadow(0 0 5px ${C.red.glow})` }}
          animate={fwdAnim}
          transition={{ duration: 0.7, delay: p * 0.28, ease: 'linear', repeat: Infinity, repeatDelay: 0.4 }}
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

function QueueBlock({ isActive, wasVisited, isExpanded, onClick, popKey, queueDepth }) {
  const node = NODES.find((n) => n.id === 'queue')
  const { cx, cy, w, h } = node
  const bars = Math.min(queueDepth, MAX_DEPTH_DISPLAY)

  return (
    <div className="absolute" style={{ left: cx - w / 2, top: cy - h / 2, width: w, height: h }}>
      <motion.button
        onClick={onClick}
        className="relative w-full h-full rounded-xl border-2 overflow-hidden flex flex-col items-center justify-center gap-1 px-2 cursor-pointer focus:outline-none"
        animate={{
          borderColor:     isActive ? node.color : wasVisited ? `${node.color}38` : 'rgba(255,255,255,0.08)',
          backgroundColor: isActive ? `${node.color}12` : wasVisited ? `${node.color}07` : 'rgba(10,18,36,1)',
          boxShadow:       isActive ? `0 0 36px -5px ${node.glow}` : 'none',
        }}
        transition={{ duration: 0.28 }}
      >
        <motion.div className={`absolute top-0 left-0 right-0 h-0.5 ${node.strip}`}
          animate={{ opacity: isActive ? 1 : wasVisited ? 0.35 : 0.12 }} />

        {[0, 1, 2].map((i) => (
          <motion.div
            key={`${popKey ?? 'i'}-queue-${i}`}
            className="absolute inset-0 rounded-xl border-2 pointer-events-none"
            style={{ borderColor: node.color }}
            initial={{ scale: 1, opacity: popKey != null ? 0.65 : 0 }}
            animate={{ scale: 2.0 + i * 0.35, opacity: 0 }}
            transition={{ duration: 0.7, delay: i * 0.12, ease: 'easeOut' }}
          />
        ))}

        <div className="flex items-center gap-1.5">
          <motion.span
            key={`ic-${popKey ?? 0}`}
            animate={popKey != null ? { scale: [1, 1.4, 0.88, 1.06, 1] } : { scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 12 }}
            className="text-base leading-none select-none"
          >
            {node.icon}
          </motion.span>
          <motion.p
            animate={{ color: isActive ? node.lc : wasVisited ? '#94a3b8' : '#475569' }}
            className="text-[10px] font-bold leading-none"
          >
            {node.label}
          </motion.p>
        </div>

        {/* Queue depth bars */}
        <div className="flex items-end gap-0.5 h-4 w-full px-2">
          {Array.from({ length: MAX_DEPTH_DISPLAY }).map((_, i) => (
            <motion.div
              key={i}
              className="flex-1 rounded-sm"
              animate={{
                height:          i < bars ? '100%' : '15%',
                backgroundColor: i < bars
                  ? (isActive ? node.color : `${node.color}55`)
                  : '#1e293b',
                boxShadow: i < bars && isActive ? `0 0 4px 1px ${node.glow}` : 'none',
              }}
              transition={{ duration: 0.35, delay: i < bars ? i * 0.05 : 0 }}
            />
          ))}
        </div>

        <motion.p animate={{ color: isActive ? node.color : '#1f2937' }} className="text-[8px] font-mono">
          {queueDepth} msg{queueDepth !== 1 ? 's' : ''} queued
        </motion.p>
        <p className="text-[8px] text-slate-700">{node.sub1}</p>
      </motion.button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 360, damping: 26 }}
            className="absolute z-30 w-56 rounded-xl border bg-slate-900/96 backdrop-blur shadow-2xl p-3 space-y-1.5"
            style={{ borderColor: `${node.color}40`, top: '105%', left: '50%', transform: 'translateX(-50%)' }}
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

        <motion.p animate={{ color: isActive ? node.lc : wasVisited ? '#94a3b8' : '#475569' }}
          className="text-[10px] font-bold text-center leading-tight">
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

export default function MessageQueuesDiagram() {
  const steps  = useMemo(() => buildMessageQueuesSteps(), [])
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

  const nonQueueNodes = NODES.filter((n) => n.id !== 'queue')

  const showDlqBanner = step.connections['queue-dlq']
  const showBackpressure = step.queueDepth >= 4

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">Message Queues</h2>
        <p className="text-sm text-slate-400">
          Step through async decoupling, backpressure absorption, dead letter queues, pub/sub, and delivery guarantees.
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
                <text x="80"  y="22" textAnchor="middle" fill="#334155" fontSize="9" fontWeight="600" letterSpacing="1.5">PRODUCER</text>
                <text x="310" y="22" textAnchor="middle" fill="#334155" fontSize="9" fontWeight="600" letterSpacing="1.5">QUEUE / BROKER</text>
                <text x="560" y="22" textAnchor="middle" fill="#334155" fontSize="9" fontWeight="600" letterSpacing="1.5">CONSUMERS</text>

                {Object.keys(EDGES).map((edgeId) => (
                  <EdgeConnection key={edgeId} edgeId={edgeId} connections={step.connections} stepKey={index} />
                ))}
              </svg>

              <QueueBlock
                isActive={step.activeNodes.includes('queue')}
                wasVisited={visitedNodes.has('queue') && !step.activeNodes.includes('queue')}
                isExpanded={expandedNode === 'queue'}
                onClick={() => setExpandedNode((p) => p === 'queue' ? null : 'queue')}
                popKey={popKeys['queue'] ?? null}
                queueDepth={step.queueDepth}
              />

              {nonQueueNodes.map((node) => (
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

            <AnimatePresence>
              {showBackpressure && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-3 flex items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-500/[0.07] px-4 py-2"
                >
                  <span className="text-amber-400 text-lg select-none">📈</span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Backpressure Building</p>
                    <p className="text-[11px] font-mono text-amber-300">Queue depth: {step.queueDepth} · consumers processing slower than producer rate</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showDlqBanner && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-3 flex items-center gap-3 rounded-xl border border-rose-500/40 bg-rose-500/[0.07] px-4 py-2"
                >
                  <span className="text-rose-400 text-lg select-none">💀</span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Dead Letter Queue — Poison Pill Quarantined</p>
                    <p className="text-[11px] font-mono text-rose-300">Message failed after 3 attempts · moved to DLQ for inspection · queue unblocked</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-5 mt-3 px-1 flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-px rounded-full" style={{ background: C.violet.hex, boxShadow: `0 0 4px ${C.violet.glow}` }} />
                <span className="text-[10px] text-slate-500">publish</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-px rounded-full" style={{ background: C.amber.hex, boxShadow: `0 0 4px ${C.amber.glow}` }} />
                <span className="text-[10px] text-slate-500">deliver</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-px rounded-full" style={{ background: C.emerald.hex, boxShadow: `0 0 4px ${C.emerald.glow}` }} />
                <span className="text-[10px] text-slate-500">acknowledge</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-px rounded-full" style={{ background: C.red.hex, boxShadow: `0 0 4px ${C.red.glow}` }} />
                <span className="text-[10px] text-slate-500">dead letter</span>
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
