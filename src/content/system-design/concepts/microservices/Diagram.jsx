import { useMemo, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { buildMicroservicesSteps } from './steps'
import { useTtsRunner } from '../../../../hooks/useTtsRunner'
import StepControls from '../../../../components/ui/StepControls'

// ── Layout constants ──────────────────────────────────────────────────────────
// Three columns:
//   Col 1 (x≈65):  Client
//   Col 2 (x≈205): API Gateway
//   Col 3 (x≈380): Users / Orders / Inventory (services behind the gateway)
//   Col 4 (x≈555): Payments / Queue / Notifications (downstream + async)

const CW = 700
const CH = 430

const NODES = [
  {
    id: 'client', label: 'Client', icon: '👤', dir: 'top',
    cx: 65, cy: 200, w: 100, h: 72,
    sub1: 'browser · mobile', sub2: 'external',
    color: '#94a3b8', glow: 'rgba(148,163,184,0.65)', lc: '#cbd5e1', strip: 'bg-slate-400',
    hasDb: false,
    desc: 'External user — browser, mobile app, or third-party system.',
    note: 'Clients only ever talk to the gateway, never to individual services.',
  },
  {
    id: 'gateway', label: 'API Gateway', icon: '🔀', dir: 'top',
    cx: 205, cy: 200, w: 120, h: 80,
    sub1: 'auth · routing', sub2: 'rate limiting',
    color: '#0ea5e9', glow: 'rgba(14,165,233,0.65)', lc: '#7dd3fc', strip: 'bg-sky-500',
    hasDb: false,
    desc: 'Single entry point — authenticates, rate-limits, and routes to the right service.',
    note: 'Adding or splitting services is invisible to clients.',
  },
  {
    id: 'users', label: 'Users Svc', icon: '🧑', dir: 'top',
    cx: 380, cy: 75, w: 120, h: 68,
    sub1: 'auth · profiles', sub2: 'bounded context',
    color: '#6366f1', glow: 'rgba(99,102,241,0.65)', lc: '#a5b4fc', strip: 'bg-indigo-500',
    hasDb: true,
    desc: 'Owns user identity: registration, login, profiles, sessions.',
    note: 'No other service may query the users table — call this API instead.',
  },
  {
    id: 'orders', label: 'Orders Svc', icon: '📦', dir: 'top',
    cx: 380, cy: 200, w: 120, h: 68,
    sub1: 'lifecycle · status', sub2: 'bounded context',
    color: '#8b5cf6', glow: 'rgba(139,92,246,0.65)', lc: '#c4b5fd', strip: 'bg-violet-500',
    hasDb: true,
    desc: 'Manages the order lifecycle: create, update, cancel, track.',
    note: 'Publishes "order.placed" events rather than calling downstream services directly.',
  },
  {
    id: 'inventory', label: 'Inventory Svc', icon: '🏪', dir: 'bottom',
    cx: 380, cy: 325, w: 120, h: 68,
    sub1: 'stock · reservations', sub2: 'bounded context',
    color: '#f59e0b', glow: 'rgba(245,158,11,0.65)', lc: '#fcd34d', strip: 'bg-amber-500',
    hasDb: true,
    desc: 'Tracks stock levels, reserves items on order, releases on cancellation.',
    note: 'Independently scalable — traffic spikes here leave other services unaffected.',
  },
  {
    id: 'payments', label: 'Payments Svc', icon: '💳', dir: 'left',
    cx: 555, cy: 130, w: 120, h: 68,
    sub1: 'charge · refund', sub2: 'sync / gRPC',
    color: '#10b981', glow: 'rgba(16,185,129,0.65)', lc: '#6ee7b7', strip: 'bg-emerald-500',
    hasDb: true,
    desc: 'Handles payment charging, refunds, and transaction records.',
    note: 'Called synchronously — Orders waits for the charge result before confirming.',
  },
  {
    id: 'queue', label: 'Message Queue', icon: '📨', dir: 'left',
    cx: 555, cy: 240, w: 130, h: 68,
    sub1: 'Kafka · SQS', sub2: 'async events',
    color: '#f43f5e', glow: 'rgba(244,63,94,0.65)', lc: '#fda4af', strip: 'bg-rose-500',
    hasDb: false,
    desc: 'Durable event bus — producers publish events, consumers subscribe independently.',
    note: 'Decouples services completely. Neither side needs to know the other exists.',
  },
  {
    id: 'notifs', label: 'Notifications', icon: '🔔', dir: 'left',
    cx: 555, cy: 355, w: 130, h: 68,
    sub1: 'email · push · SMS', sub2: 'async consumer',
    color: '#14b8a6', glow: 'rgba(20,184,166,0.65)', lc: '#5eead4', strip: 'bg-teal-500',
    hasDb: false,
    desc: 'Subscribes to events (order.placed, payment.failed) and sends notifications.',
    note: 'Decoupled from Orders — connected only through the event schema.',
  },
]

// Edge endpoints are exact boundary points of their source/target nodes
const EDGES = {
  'client-gateway':    { x1: 115, y1: 200, x2: 145, y2: 200, axis: 'h' },
  'gateway-users':     { x1: 205, y1: 160, x2: 320, y2: 75,  axis: 'd' },
  'gateway-orders':    { x1: 265, y1: 200, x2: 320, y2: 200, axis: 'h' },
  'gateway-inventory': { x1: 205, y1: 240, x2: 320, y2: 325, axis: 'd' },
  'orders-payments':   { x1: 440, y1: 180, x2: 495, y2: 130, axis: 'd' },
  'orders-queue':      { x1: 440, y1: 215, x2: 490, y2: 240, axis: 'd' },
  'queue-notifs':      { x1: 555, y1: 274, x2: 555, y2: 321, axis: 'v' },
}

const ASYNC_EDGES = new Set(['orders-queue', 'queue-notifs'])

const C = {
  sync:  { hex: '#3b82f6', glow: 'rgba(59,130,246,0.85)' },
  resp:  { hex: '#10b981', glow: 'rgba(16,185,129,0.85)' },
  async: { hex: '#f59e0b', glow: 'rgba(245,158,11,0.85)' },
}

// ── Edge (SVG line + animated particles) ─────────────────────────────────────

function EdgeConnection({ edgeId, connections, stepKey }) {
  const edge      = EDGES[edgeId]
  const direction = connections[edgeId]
  const isActive  = !!direction
  const isAsync   = ASYNC_EDGES.has(edgeId)
  const fwd = isActive && (direction === 'request' || direction === 'both')
  const bwd = isActive && (direction === 'response' || direction === 'both')

  const { x1, y1, x2, y2, axis } = edge
  const lineColor = isActive ? (isAsync ? C.async.hex : C.sync.hex) : '#182030'

  const fwdAnim = axis === 'v' ? { cx: x1, cy: [y1, y2] }
                : axis === 'h' ? { cx: [x1, x2], cy: y1 }
                : { cx: [x1, x2], cy: [y1, y2] }

  const bwdAnim = axis === 'v' ? { cx: x2, cy: [y2, y1] }
                : axis === 'h' ? { cx: [x2, x1], cy: y2 }
                : { cx: [x2, x1], cy: [y2, y1] }

  const fwdColor = isAsync ? C.async : C.sync

  return (
    <g>
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={lineColor}
        strokeWidth={isActive ? 2 : 1}
        strokeDasharray={isActive ? 'none' : '5 4'}
        style={{
          filter: isActive ? `drop-shadow(0 0 5px ${isAsync ? C.async.glow : C.sync.glow})` : 'none',
          transition: 'all 0.3s',
        }}
      />

      {fwd && [0, 1, 2].map((p) => (
        <motion.circle
          key={`${stepKey}-${edgeId}-f${p}`}
          r={3.5} fill={fwdColor.hex}
          style={{ filter: `drop-shadow(0 0 5px ${fwdColor.glow})` }}
          animate={fwdAnim}
          transition={{ duration: 0.5, delay: p * 0.16, ease: 'linear', repeat: Infinity, repeatDelay: 0.1 }}
        />
      ))}

      {bwd && [0, 1, 2].map((p) => (
        <motion.circle
          key={`${stepKey}-${edgeId}-b${p}`}
          r={3.5} fill={C.resp.hex}
          style={{ filter: `drop-shadow(0 0 5px ${C.resp.glow})` }}
          animate={bwdAnim}
          transition={{ duration: 0.5, delay: p * 0.16, ease: 'linear', repeat: Infinity, repeatDelay: 0.1 }}
        />
      ))}
    </g>
  )
}

// ── Node block ────────────────────────────────────────────────────────────────

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
          boxShadow:       isActive ? `0 0 32px -5px ${node.glow}` : 'none',
        }}
        transition={{ duration: 0.28 }}
      >
        {/* Top accent strip */}
        <motion.div
          className={`absolute top-0 left-0 right-0 h-0.5 ${node.strip}`}
          animate={{ opacity: isActive ? 1 : wasVisited ? 0.35 : 0.12 }}
        />

        {/* Ripple burst on activation */}
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

        {/* Icon */}
        <motion.span
          key={`ic-${popKey ?? 0}`}
          animate={popKey != null ? { scale: [1, 1.4, 0.88, 1.06, 1] } : { scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 12 }}
          className="text-xl leading-none select-none"
        >
          {node.icon}
        </motion.span>

        {/* Label */}
        <motion.p
          animate={{ color: isActive ? node.lc : wasVisited ? '#94a3b8' : '#475569' }}
          className="text-[10px] font-bold text-center leading-tight"
        >
          {node.label}
        </motion.p>

        {/* Sub-labels */}
        <motion.p
          animate={{ color: isActive ? node.color : '#1f2937' }}
          className="text-[9px] font-mono"
        >
          {node.sub1}
        </motion.p>
        <p className="text-[8px] text-slate-700">{node.sub2}</p>

        {/* DB badge — shows which services own their own data store */}
        {node.hasDb && (
          <motion.div
            animate={{ opacity: isActive ? 1 : wasVisited ? 0.5 : 0.2 }}
            className="absolute bottom-1 right-1.5 rounded px-1 py-px text-[7px] font-bold border leading-none"
            style={{
              color:           node.color,
              borderColor:     node.color + '40',
              backgroundColor: node.color + '15',
            }}
          >
            DB
          </motion.div>
        )}
      </motion.button>

      {/* Info panel — opens inward toward diagram centre */}
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

// ── Main component ────────────────────────────────────────────────────────────

export default function MicroservicesDiagram() {
  const steps  = useMemo(() => buildMicroservicesSteps(), [])
  const runner = useTtsRunner(steps, (step) => `${step.message}. ${step.detail}`)
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

  return (
    <div className="space-y-4">

      <div>
        <h2 className="text-lg font-semibold text-white">Microservices Architecture</h2>
        <p className="text-sm text-slate-400">
          Step through how services decompose, communicate, and isolate data independently.
        </p>
      </div>

      {/* Diagram */}
      <div
        className="rounded-2xl border border-white/10 p-3 sm:p-5"
        style={{
          background:      '#060d1a',
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px)',
          backgroundSize:  '22px 22px',
        }}
      >
        <div className="overflow-x-auto pb-2">
          <div style={{ minWidth: CW }}>

            <div className="relative mx-auto" style={{ width: CW, height: CH }}>

              {/* SVG overlay for edges and particles */}
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
              </svg>

              {/* Node blocks */}
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

            {/* Legend */}
            <div className="flex items-center gap-5 mt-3 px-1 flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-px bg-blue-500 rounded-full" style={{ boxShadow: '0 0 4px rgba(59,130,246,0.8)' }} />
                <span className="text-[10px] text-slate-500">sync (HTTP/gRPC)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-px bg-amber-500 rounded-full" style={{ boxShadow: '0 0 4px rgba(245,158,11,0.8)' }} />
                <span className="text-[10px] text-slate-500">async (events)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[7px] font-bold border border-white/20 rounded px-1 py-px text-slate-500">DB</span>
                <span className="text-[10px] text-slate-500">owns its database</span>
              </div>
              <span className="text-[10px] text-slate-600 ml-auto hidden sm:inline">tap any service for details</span>
            </div>
          </div>
        </div>
      </div>

      {/* Step message */}
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
