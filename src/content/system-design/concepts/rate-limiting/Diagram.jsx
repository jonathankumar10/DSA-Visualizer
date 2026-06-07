import { useMemo, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { buildRateLimitingSteps } from './steps'
import { useStepRunner } from '../../../../hooks/useStepRunner'
import StepControls from '../../../../components/ui/StepControls'

const CW = 680
const CH = 285

const NODES = [
  {
    id: 'client', label: 'API Client', icon: '💻', dir: 'right',
    cx: 72,  cy: 145, w: 100, h: 78,
    color: '#94a3b8', glow: 'rgba(148,163,184,0.65)', lc: '#cbd5e1', strip: 'bg-slate-400',
    sub1: 'sends requests', sub2: 'reads headers',
    desc: 'Any caller making API requests — a web app, mobile client, or another service.',
    note: 'Well-behaved clients read X-RateLimit-Remaining and self-throttle before hitting zero.',
  },
  {
    id: 'limiter', label: 'Rate Limiter', icon: '🛡️', dir: 'top',
    cx: 265, cy: 108, w: 118, h: 84,
    color: '#8b5cf6', glow: 'rgba(139,92,246,0.65)', lc: '#c4b5fd', strip: 'bg-violet-500',
    sub1: 'token bucket', sub2: 'check + decrement',
    desc: 'The gateway that intercepts every request and decides allow or reject based on the current token count.',
    note: 'Uses an atomic Lua script in Redis — check-and-decrement in one round trip, no race conditions.',
  },
  {
    id: 'api', label: 'API Server', icon: '🖥️', dir: 'left',
    cx: 490, cy: 108, w: 118, h: 84,
    color: '#10b981', glow: 'rgba(16,185,129,0.65)', lc: '#6ee7b7', strip: 'bg-emerald-500',
    sub1: 'business logic', sub2: 'sees allowed only',
    desc: 'The backend service. It only ever receives requests that have passed the rate limiter.',
    note: 'Protected from bursts and DDoS — the limiter absorbs all rejection logic upstream.',
  },
  {
    id: 'redis', label: 'Redis Counter', icon: '⚡', dir: 'bottom',
    cx: 265, cy: 248, w: 118, h: 70,
    color: '#f59e0b', glow: 'rgba(245,158,11,0.65)', lc: '#fcd34d', strip: 'bg-amber-500',
    sub1: 'INCR + EXPIRE', sub2: 'shared counter',
    desc: 'Stores the token count atomically. All gateway nodes share this single source of truth.',
    note: 'Without Redis each node would have its own counter — users could multiply their limit by hitting N servers.',
  },
]

const EDGES = {
  'client-limiter': { x1: 122, y1: 145, x2: 206, y2: 118, axis: 'd' },
  'limiter-api':    { x1: 324, y1: 108, x2: 431, y2: 108, axis: 'h' },
  'limiter-redis':  { x1: 265, y1: 150, x2: 265, y2: 213, axis: 'v' },
}

const DIR_C = {
  request:  { hex: '#8b5cf6', glow: 'rgba(139,92,246,0.85)' },
  response: { hex: '#10b981', glow: 'rgba(16,185,129,0.85)' },
  rejected: { hex: '#f43f5e', glow: 'rgba(244,63,94,0.85)'  },
  refill:   { hex: '#f59e0b', glow: 'rgba(245,158,11,0.85)' },
  both:     { hex: '#8b5cf6', glow: 'rgba(139,92,246,0.85)' },
}

const FWD_COLOR = { request: 'request', response: 'response', both: 'request', rejected: 'rejected', refill: 'refill' }
const BWD_COLOR = { both: 'response', rejected: 'rejected', refill: 'refill' }

// ── Edge connection ───────────────────────────────────────────────────────────

function EdgeConnection({ edgeId, connections, stepKey }) {
  const edge = EDGES[edgeId]
  const dir  = connections[edgeId]
  const isActive = !!dir

  const { x1, y1, x2, y2, axis } = edge
  const fwdKey = FWD_COLOR[dir]
  const bwdKey = BWD_COLOR[dir]
  const fwdC = fwdKey ? DIR_C[fwdKey] : null
  const bwdC = bwdKey ? DIR_C[bwdKey] : null

  const fwdAnim = axis === 'v' ? { cx: x1, cy: [y1, y2] } : axis === 'h' ? { cx: [x1, x2], cy: y1 } : { cx: [x1, x2], cy: [y1, y2] }
  const bwdAnim = axis === 'v' ? { cx: x2, cy: [y2, y1] } : axis === 'h' ? { cx: [x2, x1], cy: y2 } : { cx: [x2, x1], cy: [y2, y1] }

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

// ── Token bucket ──────────────────────────────────────────────────────────────

const MAX_TOKENS = 5

function TokenBucket({ tokens }) {
  return (
    <div className="flex flex-col items-center gap-2 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-400">Token Bucket</p>
      <div className="flex items-center gap-2.5">
        {Array.from({ length: MAX_TOKENS }).map((_, i) => (
          <motion.div
            key={i}
            className="w-7 h-7 rounded-full border-2"
            animate={{
              backgroundColor: i < tokens ? 'rgba(139,92,246,0.35)' : 'rgba(255,255,255,0.02)',
              borderColor:     i < tokens ? '#7c3aed'               : 'rgba(255,255,255,0.08)',
              boxShadow:       i < tokens ? '0 0 10px 2px rgba(139,92,246,0.55)' : 'none',
            }}
            transition={{ duration: 0.3, delay: i * 0.04 }}
          />
        ))}
      </div>
      <motion.p
        key={tokens}
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1,    opacity: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 18 }}
        className="text-[12px] font-mono font-bold"
        style={{ color: tokens === 0 ? '#f43f5e' : tokens <= 1 ? '#f59e0b' : '#a78bfa' }}
      >
        {tokens} / {MAX_TOKENS} tokens
      </motion.p>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function RateLimitingDiagram() {
  const steps  = useMemo(() => buildRateLimitingSteps(), [])
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

  return (
    <div className="space-y-4">

      <div>
        <h2 className="text-lg font-semibold text-white">Rate Limiting — Token Bucket</h2>
        <p className="text-sm text-slate-400">
          Step through how a token bucket rate limiter allows bursts, enforces sustained limits, and rejects excess traffic.
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

            {/* Node + edge canvas */}
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

            {/* Token bucket + status */}
            <div className="mt-2 flex flex-col sm:flex-row items-center justify-between gap-3 px-2">
              <TokenBucket tokens={step.tokens} />

              {/* Status badge */}
              <AnimatePresence mode="wait">
                {step.status === 'allowed' && (
                  <motion.div
                    key="allowed"
                    initial={{ opacity: 0, scale: 0.85, y: 6 }}
                    animate={{ opacity: 1, scale: 1,    y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 340, damping: 22 }}
                    className="relative flex items-center gap-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/[0.08] px-4 py-2.5 overflow-hidden"
                  >
                    {[0, 1].map((i) => (
                      <motion.div
                        key={i}
                        className="absolute inset-0 rounded-xl border border-emerald-400/25 pointer-events-none"
                        initial={{ scale: 0.95, opacity: 0.7 }}
                        animate={{ scale: 1.5 + i * 0.3, opacity: 0 }}
                        transition={{ duration: 0.9, delay: i * 0.18, ease: 'easeOut' }}
                      />
                    ))}
                    <span className="text-emerald-400 text-base relative z-10 select-none">✓</span>
                    <div className="relative z-10">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Request Allowed</p>
                      <p className="text-[11px] text-emerald-300 font-mono">HTTP 200 · forwarded to API</p>
                    </div>
                  </motion.div>
                )}
                {step.status === 'rejected' && (
                  <motion.div
                    key="rejected"
                    initial={{ opacity: 0, scale: 0.85, y: 6 }}
                    animate={{ opacity: 1, scale: 1,    y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 340, damping: 22 }}
                    className="relative flex items-center gap-2.5 rounded-xl border border-rose-500/40 bg-rose-500/[0.08] px-4 py-2.5 overflow-hidden"
                  >
                    {[0, 1].map((i) => (
                      <motion.div
                        key={i}
                        className="absolute inset-0 rounded-xl border border-rose-400/25 pointer-events-none"
                        initial={{ scale: 0.95, opacity: 0.7 }}
                        animate={{ scale: 1.5 + i * 0.3, opacity: 0 }}
                        transition={{ duration: 0.9, delay: i * 0.18, ease: 'easeOut' }}
                      />
                    ))}
                    <span className="text-rose-400 text-base relative z-10 select-none">✕</span>
                    <div className="relative z-10">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Request Rejected</p>
                      <p className="text-[11px] text-rose-300 font-mono">HTTP 429 · Retry-After header set</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 mt-3 px-1 flex-wrap">
          {[
            { color: DIR_C.request.hex,  glow: DIR_C.request.glow,  label: 'request' },
            { color: DIR_C.response.hex, glow: DIR_C.response.glow, label: 'allowed' },
            { color: DIR_C.rejected.hex, glow: DIR_C.rejected.glow, label: 'rejected (429)' },
            { color: DIR_C.refill.hex,   glow: DIR_C.refill.glow,   label: 'token refill' },
          ].map(({ color, glow, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-5 h-px rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 4px ${glow}` }} />
              <span className="text-[10px] text-slate-500">{label}</span>
            </div>
          ))}
          <span className="text-[10px] text-slate-600 ml-auto hidden sm:inline">tap any component for details</span>
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
