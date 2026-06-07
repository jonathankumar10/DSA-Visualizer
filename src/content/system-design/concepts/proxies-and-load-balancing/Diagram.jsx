import { useMemo, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { buildProxiesAndLoadBalancingSteps } from './steps'
import { useStepRunner } from '../../../../hooks/useStepRunner'
import StepControls from '../../../../components/ui/StepControls'

// ── Layout ────────────────────────────────────────────────────────────────────
// Client (left) → Load Balancer (center) → Server 1/2/3 (right, stacked)

const CW = 640
const CH = 300

const NODES = [
  {
    id: 'client', label: 'Client', icon: '💻', dir: 'bottom',
    cx: 72, cy: 150, w: 100, h: 78,
    color: '#94a3b8', glow: 'rgba(148,163,184,0.65)', lc: '#cbd5e1', strip: 'bg-slate-400',
    sub1: 'browser / app', sub2: 'end user',
    desc: 'Makes HTTP requests. The client sees only one IP address — the load balancer. Backend topology is completely hidden.',
    note: 'The load balancer is the only public-facing component. Backend servers live in a private subnet.',
  },
  {
    id: 'lb', label: 'Load Balancer', icon: '⚖️', dir: 'top',
    cx: 290, cy: 150, w: 128, h: 86,
    color: '#8b5cf6', glow: 'rgba(139,92,246,0.65)', lc: '#c4b5fd', strip: 'bg-violet-500',
    sub1: 'L7 routing', sub2: 'SSL termination',
    desc: 'Distributes traffic, terminates TLS, performs health checks, and can route by path/header. AWS ALB, nginx, and HAProxy are common choices.',
    note: 'The load balancer is a SPOF itself — use an active-active pair of LBs with anycast IP or AWS Route53 for true HA.',
  },
  {
    id: 'server1', label: 'Server 1', icon: '🖥️', dir: 'right',
    cx: 545, cy: 80, w: 106, h: 72,
    color: '#3b82f6', glow: 'rgba(59,130,246,0.65)', lc: '#93c5fd', strip: 'bg-blue-500',
    sub1: 'healthy', sub2: 'stateless',
    desc: 'Stateless application server. Handles any request sent to it — no user-specific in-memory state.',
    note: 'Stateless servers are the key to horizontal scaling. Shared state lives in Redis or the database.',
  },
  {
    id: 'server2', label: 'Server 2', icon: '🖥️', dir: 'right',
    cx: 545, cy: 155, w: 106, h: 72,
    color: '#3b82f6', glow: 'rgba(59,130,246,0.65)', lc: '#93c5fd', strip: 'bg-blue-500',
    sub1: 'healthy', sub2: 'stateless',
    desc: 'Second application server. Round-robin means every third request goes here.',
    note: 'Adding a server is the primary scaling action. The load balancer auto-discovers it (e.g., via EC2 Auto Scaling Group).',
  },
  {
    id: 'server3', label: 'Server 3', icon: '🖥️', dir: 'right',
    cx: 545, cy: 230, w: 106, h: 72,
    color: '#3b82f6', glow: 'rgba(59,130,246,0.65)', lc: '#93c5fd', strip: 'bg-blue-500',
    sub1: 'healthy', sub2: 'stateless',
    desc: 'Third application server. Health checks keep it in rotation only when it responds to GET /health.',
    note: 'Health check failure threshold: 2 consecutive failures → removed. 3 consecutive successes → re-added.',
  },
]

const EDGES = {
  'client-lb':   { x1: 122, y1: 150, x2: 226, y2: 150, axis: 'h' },
  'lb-server1':  { x1: 354, y1: 118, x2: 492, y2: 92,  axis: 'd' },
  'lb-server2':  { x1: 354, y1: 150, x2: 492, y2: 155, axis: 'h' },
  'lb-server3':  { x1: 354, y1: 182, x2: 492, y2: 218, axis: 'd' },
}

const C = {
  request:  { hex: '#8b5cf6', glow: 'rgba(139,92,246,0.85)'  },
  response: { hex: '#10b981', glow: 'rgba(16,185,129,0.85)'  },
  both:     { hex: '#3b82f6', glow: 'rgba(59,130,246,0.85)'  },
  health:   { hex: '#f59e0b', glow: 'rgba(245,158,11,0.85)'  },
}

const DIR_C_MAP = {
  request:  C.request,
  response: C.response,
  both:     C.both,
  health:   C.health,
}

// ── Edge connection ───────────────────────────────────────────────────────────

function EdgeConnection({ edgeId, connections, stepKey, failedServer }) {
  const edge      = EDGES[edgeId]
  const direction = connections[edgeId]
  const isActive  = !!direction

  // Dim this edge if it connects to the failed server
  const serverIdFromEdge = edgeId.replace('lb-', '')
  const isFailed = failedServer && edgeId.startsWith('lb-') && serverIdFromEdge === failedServer

  const fwdC = isFailed ? null : isActive ? (DIR_C_MAP[direction] ?? C.request) : null
  const bwd  = !isFailed && direction === 'both'
  const bwdC = bwd ? C.response : null

  const { x1, y1, x2, y2, axis } = edge

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
        stroke={isFailed ? '#3f1f1f' : isActive ? (fwdC?.hex ?? '#1e293b') : '#182030'}
        strokeWidth={isActive && !isFailed ? 2 : 1}
        strokeDasharray={isFailed ? '4 4' : isActive ? 'none' : '5 4'}
        style={{
          filter: isActive && !isFailed && fwdC ? `drop-shadow(0 0 5px ${fwdC.glow})` : 'none',
          transition: 'all 0.3s',
        }}
      />
      {fwdC && !isFailed && [0, 1, 2].map((p) => (
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
      {/* X mark on failed edge */}
      {isFailed && (
        <text
          x={(x1 + x2) / 2 - 5} y={(y1 + y2) / 2 + 4}
          style={{ fill: '#f43f5e', fontSize: 12, fontWeight: 700, opacity: 0.9 }}
        >
          ✕
        </text>
      )}
    </g>
  )
}

// ── Node block ────────────────────────────────────────────────────────────────

function NodeBlock({ node, isActive, wasVisited, isExpanded, onClick, popKey, isFailed, isSticky }) {
  const { cx, cy, w, h } = node
  return (
    <div className="absolute" style={{ left: cx - w / 2, top: cy - h / 2, width: w, height: h }}>
      <motion.button
        onClick={onClick}
        className="relative w-full h-full rounded-xl border-2 overflow-hidden flex flex-col items-center justify-center gap-0.5 px-1 cursor-pointer focus:outline-none"
        animate={{
          borderColor:     isFailed ? '#f43f5e' : isActive ? node.color : wasVisited ? `${node.color}38` : 'rgba(255,255,255,0.08)',
          backgroundColor: isFailed ? 'rgba(244,63,94,0.08)' : isActive ? `${node.color}16` : wasVisited ? `${node.color}07` : 'rgba(10,18,36,1)',
          boxShadow:       isFailed ? '0 0 24px -6px rgba(244,63,94,0.7)' : isActive ? `0 0 30px -5px ${node.glow}` : 'none',
        }}
        transition={{ duration: 0.28 }}
      >
        <motion.div
          className={`absolute top-0 left-0 right-0 h-0.5 ${isFailed ? 'bg-rose-500' : node.strip}`}
          animate={{ opacity: isFailed ? 1 : isActive ? 1 : wasVisited ? 0.35 : 0.12 }}
        />

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
          {isFailed ? '💀' : node.icon}
        </motion.span>

        <motion.p
          animate={{ color: isFailed ? '#fda4af' : isActive ? node.lc : wasVisited ? '#94a3b8' : '#475569' }}
          className="text-[10px] font-bold text-center leading-tight"
        >
          {node.label}
        </motion.p>

        <motion.p
          animate={{ color: isFailed ? '#f43f5e' : isActive ? node.color : '#1f2937' }}
          className="text-[9px] font-mono"
        >
          {isFailed ? 'UNHEALTHY' : node.sub1}
        </motion.p>
        <p className="text-[8px] text-slate-700">{isFailed ? 'removed from pool' : node.sub2}</p>

        <AnimatePresence>
          {isSticky && (
            <motion.span
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 360, damping: 20 }}
              className="absolute top-1 right-1 text-[7px] font-bold font-mono text-amber-300 bg-amber-500/15 border border-amber-400/30 rounded px-1 leading-tight"
            >
              PINNED
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

// ── Main component ────────────────────────────────────────────────────────────

export default function ProxiesAndLoadBalancingDiagram({ onStepChange }) {
  const steps  = useMemo(() => buildProxiesAndLoadBalancingSteps(), [])
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

  const failedServer  = step.failedServer ?? null
  const stickyServer  = step.type === 'sticky-sessions' ? 'server1' : null
  const showL7Banner  = step.type === 'l4-vs-l7'
  const showAABanner  = step.type === 'active-active'

  return (
    <div className="space-y-4">

      <div>
        <h2 className="text-lg font-semibold text-white">Load Balancing — Distributing Traffic at Scale</h2>
        <p className="text-sm text-slate-400">
          From a single overloaded server to round-robin, health checks, sticky sessions, and active-active HA.
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
                    failedServer={failedServer}
                  />
                ))}

                {/* Round-robin indicator arrow labels */}
                {step.type === 'round-robin' && (
                  <>
                    <text x={390} y={78}  style={{ fill: '#8b5cf6', fontSize: 8, fontFamily: 'ui-monospace, monospace', fontWeight: 600, opacity: 0.75 }}>req 1</text>
                    <text x={390} y={154} style={{ fill: '#8b5cf6', fontSize: 8, fontFamily: 'ui-monospace, monospace', fontWeight: 600, opacity: 0.75 }}>req 2</text>
                    <text x={390} y={225} style={{ fill: '#8b5cf6', fontSize: 8, fontFamily: 'ui-monospace, monospace', fontWeight: 600, opacity: 0.75 }}>req 3</text>
                  </>
                )}
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
                  isFailed={failedServer === node.id}
                  isSticky={stickyServer === node.id}
                />
              ))}
            </div>

            {/* Informational banners */}
            <AnimatePresence mode="wait">
              {failedServer && (
                <motion.div
                  key="failed"
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                  className="relative mt-3 flex items-center gap-4 rounded-xl border border-rose-500/40 bg-rose-500/[0.06] px-4 py-3 overflow-hidden"
                >
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={`br-${i}`}
                      className="absolute inset-0 rounded-xl pointer-events-none border border-rose-400/20"
                      initial={{ scale: 0.95, opacity: 0.7 }}
                      animate={{ scale: 1.5 + i * 0.3, opacity: 0 }}
                      transition={{ duration: 1.1, delay: i * 0.2, ease: 'easeOut' }}
                    />
                  ))}
                  <span className="text-xl relative z-10 select-none">🔴</span>
                  <div className="relative z-10">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-rose-400">Server 3 Removed from Pool</p>
                    <p className="text-sm text-white">2 consecutive health check failures — traffic shifted to Server 1 &amp; 2 automatically</p>
                  </div>
                </motion.div>
              )}
              {showL7Banner && (
                <motion.div
                  key="l7"
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                  className="relative mt-3 rounded-xl border border-violet-500/40 bg-violet-500/[0.06] px-4 py-3"
                >
                  <p className="text-[11px] font-bold uppercase tracking-wider text-violet-400 mb-1.5">L4 vs L7 Comparison</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] font-semibold text-slate-300">L4 (TCP/IP)</p>
                      <p className="text-[10px] text-slate-500 leading-relaxed">Routes by IP + port. Fast, low CPU. No HTTP visibility. Good for raw TCP protocols.</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-300">L7 (HTTP)</p>
                      <p className="text-[10px] text-slate-500 leading-relaxed">Reads headers, paths, cookies. Path-based routing, A/B testing, canary deploys. Slight overhead.</p>
                    </div>
                  </div>
                </motion.div>
              )}
              {showAABanner && (
                <motion.div
                  key="aa"
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                  className="relative mt-3 flex items-center gap-4 rounded-xl border border-violet-500/40 bg-violet-500/[0.06] px-4 py-3 overflow-hidden"
                >
                  <span className="text-xl relative z-10 select-none">⚡</span>
                  <div className="relative z-10">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-violet-400">Active-Active — All Servers Handling Traffic</p>
                    <p className="text-sm text-white">Maximum throughput + instant failover. Requires stateless servers with shared session store (Redis).</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 mt-3 px-1 flex-wrap">
          {[
            { color: C.request.hex,  glow: C.request.glow,  label: 'request'              },
            { color: C.response.hex, glow: C.response.glow, label: 'response'              },
            { color: C.both.hex,     glow: C.both.glow,     label: 'bidirectional traffic' },
            { color: C.health.hex,   glow: C.health.glow,   label: 'health check'          },
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
