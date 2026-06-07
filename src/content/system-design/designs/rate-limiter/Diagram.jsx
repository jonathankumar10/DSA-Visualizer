import { useMemo, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { buildRateLimiterSteps } from './steps'
import { useStepRunner } from '../../../../hooks/useStepRunner'
import StepControls from '../../../../components/ui/StepControls'

// ── Layout ─────────────────────────────────────────────────────────────────────
// client (left) → gateway (center-left) → ratelimiter (center)
//                                              ↓
//                                           redis (center-bottom)
// gateway → backend (right, stacked services)
// adminui (top-right)

const CW = 720
const CH = 340

const NODES = [
  {
    id: 'client', label: 'Client', icon: '💻', dir: 'left',
    cx: 68, cy: 170, w: 100, h: 78,
    color: '#94a3b8', glow: 'rgba(148,163,184,0.65)', lc: '#cbd5e1', strip: 'bg-slate-400',
    sub1: 'API consumer', sub2: 'user / service',
    desc: 'Any caller making requests — a browser, mobile app, or third-party service.',
    note: 'Clients should respect X-RateLimit-Remaining and back off before hitting 429.',
  },
  {
    id: 'gateway', label: 'API Gateway', icon: '🚪', dir: 'top',
    cx: 210, cy: 170, w: 114, h: 82,
    color: '#8b5cf6', glow: 'rgba(139,92,246,0.65)', lc: '#c4b5fd', strip: 'bg-violet-500',
    sub1: 'entry point', sub2: 'SSL + routing',
    desc: 'Single entry point for all traffic. Extracts identifiers and invokes rate limiter middleware before routing.',
    note: 'All gateway nodes share state via Redis — any node can handle any request without over-counting.',
  },
  {
    id: 'ratelimiter', label: 'Rate Limiter', icon: '🛡️', dir: 'top',
    cx: 380, cy: 155, w: 120, h: 86,
    color: '#7c3aed', glow: 'rgba(124,58,237,0.65)', lc: '#ddd6fe', strip: 'bg-violet-700',
    sub1: 'rule engine', sub2: 'token bucket / sliding window',
    desc: 'Middleware that applies the configured algorithm (token bucket, sliding window, fixed window) for the current user tier.',
    note: 'Runs a Lua script on Redis for atomic check-and-increment — the only correct way to avoid race conditions.',
  },
  {
    id: 'redis', label: 'Redis Cluster', icon: '⚡', dir: 'bottom',
    cx: 380, cy: 285, w: 120, h: 78,
    color: '#10b981', glow: 'rgba(16,185,129,0.65)', lc: '#6ee7b7', strip: 'bg-emerald-500',
    sub1: 'atomic INCR', sub2: 'rl:{userId}:{window}',
    desc: 'Shared counter store. Lua scripts ensure check-then-increment is atomic across all gateway nodes.',
    note: 'At 1M users × 5 windows the key space is 5M small keys — trivial for Redis, which handles billions.',
  },
  {
    id: 'backend', label: 'Backend Services', icon: '⚙️', dir: 'right',
    cx: 588, cy: 170, w: 118, h: 84,
    color: '#3b82f6', glow: 'rgba(59,130,246,0.65)', lc: '#93c5fd', strip: 'bg-blue-500',
    sub1: 'service-a / service-b', sub2: 'never see 429 traffic',
    desc: 'Downstream services that only receive requests that have passed the rate limiter. They are shielded from abuse.',
    note: 'Backend services should still implement their own resource limits — rate limiting is defense-in-depth, not a complete shield.',
  },
  {
    id: 'adminui', label: 'Admin UI', icon: '🎛️', dir: 'top',
    cx: 588, cy: 52, w: 112, h: 72,
    color: '#f59e0b', glow: 'rgba(245,158,11,0.65)', lc: '#fcd34d', strip: 'bg-amber-500',
    sub1: 'rule management', sub2: 'live updates',
    desc: 'Operators update rate limit rules (limits per tier, per endpoint) without redeploying. Gateways refresh config periodically.',
    note: 'Multi-tier limits combine per-second burst (token bucket) with per-day quota (fixed window) for the same identifier.',
  },
]

const EDGES = {
  'client-gateway':  { x1: 118, y1: 170, x2: 153, y2: 170, axis: 'h' },
  'gateway-rl':      { x1: 267, y1: 162, x2: 320, y2: 155, axis: 'h' },
  'rl-redis':        { x1: 380, y1: 198, x2: 380, y2: 246, axis: 'v' },
  'gateway-backend': { x1: 267, y1: 178, x2: 529, y2: 178, axis: 'h' },
  'admin-rl':        { x1: 532, y1: 88,  x2: 440, y2: 112, axis: 'd' },
}

const C = {
  violet:  { hex: '#8b5cf6', glow: 'rgba(139,92,246,0.85)'  },
  emerald: { hex: '#10b981', glow: 'rgba(16,185,129,0.85)'  },
  red:     { hex: '#f43f5e', glow: 'rgba(244,63,94,0.85)'   },
  amber:   { hex: '#f59e0b', glow: 'rgba(245,158,11,0.85)'  },
}

const DIR_MAP = {
  request:  { fwd: C.violet,  bwd: null      },
  response: { fwd: C.emerald, bwd: null      },
  both:     { fwd: C.violet,  bwd: C.emerald },
}

// ── Edge connection (SVG particles) ──────────────────────────────────────────

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
        <motion.div
          className={`absolute top-0 left-0 right-0 h-0.5 ${node.strip}`}
          animate={{ opacity: isActive ? 1 : wasVisited ? 0.35 : 0.12 }}
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
          {node.icon}
        </motion.span>

        <motion.p
          animate={{ color: isActive ? node.lc : wasVisited ? '#94a3b8' : '#475569' }}
          className="text-[10px] font-bold text-center leading-tight"
        >
          {node.label}
        </motion.p>

        <motion.p
          animate={{ color: isActive ? node.color : '#1f2937' }}
          className="text-[9px] font-mono"
        >
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

// ── Main component ────────────────────────────────────────────────────────────

export default function RateLimiterDiagram() {
  const steps  = useMemo(() => buildRateLimiterSteps(), [])
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

  const showRejectBanner = step.type === 'reject-request'
  const showFailOpen     = step.type === 'fail-open'

  return (
    <div className="space-y-4">

      <div>
        <h2 className="text-lg font-semibold text-white">Rate Limiter — Distributed Design</h2>
        <p className="text-sm text-slate-400">
          Trace a request from client through the API Gateway, Rate Limiter middleware, and Redis atomic counters.
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
                  popKey={popKeys[node.id] ?? null}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              {showRejectBanner && (
                <motion.div
                  key="reject"
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                  className="relative mt-3 flex items-center gap-3 rounded-xl border border-rose-500/40 bg-rose-500/[0.07] px-4 py-3 overflow-hidden"
                >
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={`rj-${i}`}
                      className="absolute inset-0 rounded-xl border border-rose-400/18 pointer-events-none"
                      initial={{ scale: 0.95, opacity: 0.65 }}
                      animate={{ scale: 1.5 + i * 0.3, opacity: 0 }}
                      transition={{ duration: 1.1, delay: i * 0.2, ease: 'easeOut' }}
                    />
                  ))}
                  <span className="text-xl relative z-10 select-none">🚫</span>
                  <div className="relative z-10">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-rose-400">HTTP 429 Too Many Requests</p>
                    <p className="text-sm text-white">Retry-After: 47s · X-RateLimit-Remaining: 0 · X-RateLimit-Reset: 1735689600</p>
                  </div>
                </motion.div>
              )}
              {showFailOpen && (
                <motion.div
                  key="failopen"
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                  className="relative mt-3 flex items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-500/[0.07] px-4 py-3 overflow-hidden"
                >
                  <span className="text-xl relative z-10 select-none">⚠️</span>
                  <div className="relative z-10">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Fail-Open Mode — Redis Unavailable</p>
                    <p className="text-sm text-white">Requests pass through unthrottled. Every bypass is logged for alerting.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-5 mt-3 px-1 flex-wrap">
          {[
            { color: C.violet.hex,  glow: C.violet.glow,  label: 'request flow'   },
            { color: C.emerald.hex, glow: C.emerald.glow, label: 'response / allow' },
            { color: C.red.hex,     glow: C.red.glow,     label: '429 reject'     },
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
