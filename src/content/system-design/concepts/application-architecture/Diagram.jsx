import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { buildApplicationArchitectureSteps } from './steps'
import { useTtsRunner } from '../../../../hooks/useTtsRunner'
import StepControls from '../../../../components/ui/StepControls'

// ── Layout ────────────────────────────────────────────────────────────────────
// Two-lane directed flow:
//   Deploy lane (top): Developer → CI/CD → Server
//   Request lane:      User → Frontend → Load Balancer → Server → Cache / DB
//   Observability:     Server → Monitoring (below)

const CW = 770  // container width
const CH = 400  // container height

const NODES = [
  {
    id: 'developer', label: 'Developer', icon: '👨‍💻', dir: 'top',
    cx: 85,  cy: 65,  w: 110, h: 80,
    sub1: 'push → deploy', sub2: 'version control',
    color: '#6366f1', glow: 'rgba(99,102,241,0.65)',   lc: '#a5b4fc', strip: 'bg-indigo-500',
    desc: 'Writes code and pushes to version control.',
    note: 'Every change is tracked and can be rolled back in seconds.',
  },
  {
    id: 'cicd', label: 'CI / CD', icon: '🔄', dir: 'top',
    cx: 245, cy: 65,  w: 110, h: 80,
    sub1: 'build + test', sub2: 'automated',
    color: '#8b5cf6', glow: 'rgba(139,92,246,0.65)',   lc: '#c4b5fd', strip: 'bg-violet-500',
    desc: 'Builds, tests, and deploys every code change automatically.',
    note: 'If any test fails the pipeline stops — nothing broken ships.',
  },
  {
    id: 'user', label: 'User', icon: '👤', dir: 'bottom',
    cx: 68,  cy: 300, w: 96,  h: 76,
    sub1: 'browser', sub2: 'end user',
    color: '#94a3b8', glow: 'rgba(148,163,184,0.65)',  lc: '#cbd5e1', strip: 'bg-slate-400',
    desc: 'The person using the application.',
    note: 'Their experience is what every other layer is optimised for.',
  },
  {
    id: 'frontend', label: 'Frontend', icon: '💻', dir: 'bottom',
    cx: 210, cy: 300, w: 110, h: 80,
    sub1: 'React / Vue', sub2: 'served by CDN',
    color: '#06b6d4', glow: 'rgba(6,182,212,0.65)',    lc: '#67e8f9', strip: 'bg-cyan-500',
    desc: 'JavaScript app running in the browser.',
    note: 'Static assets served by CDN — fast load worldwide.',
  },
  {
    id: 'lb', label: 'Load Balancer', icon: '⚖️', dir: 'left',
    cx: 350, cy: 190, w: 112, h: 86,
    sub1: 'round-robin', sub2: 'health checks',
    color: '#0ea5e9', glow: 'rgba(14,165,233,0.65)',   lc: '#7dd3fc', strip: 'bg-sky-500',
    desc: 'Routes requests to healthy servers, skips failed ones.',
    note: 'Add a server and traffic shifts to it automatically.',
  },
  {
    id: 'server', label: 'App Server', icon: '🖥️', dir: 'right',
    cx: 510, cy: 190, w: 120, h: 92,
    sub1: 'stateless', sub2: 'business logic',
    color: '#3b82f6', glow: 'rgba(59,130,246,0.65)',   lc: '#93c5fd', strip: 'bg-blue-500',
    desc: 'Handles requests, runs business logic, returns responses.',
    note: 'Stateless by design — any server handles any request.',
  },
  {
    id: 'cache', label: 'Cache', icon: '⚡', dir: 'right',
    cx: 655, cy: 115, w: 110, h: 80,
    sub1: '< 1 ms', sub2: 'Redis',
    color: '#10b981', glow: 'rgba(16,185,129,0.65)',   lc: '#6ee7b7', strip: 'bg-emerald-500',
    desc: 'In-memory store — returns data without hitting the database.',
    note: '90%+ hit rate means the DB sees a fraction of the reads.',
  },
  {
    id: 'db', label: 'Database', icon: '🗄️', dir: 'right',
    cx: 680, cy: 255, w: 110, h: 80,
    sub1: '1–10 ms', sub2: 'persistent',
    color: '#f59e0b', glow: 'rgba(245,158,11,0.65)',   lc: '#fcd34d', strip: 'bg-amber-500',
    desc: 'Permanent source of truth — every write lands here.',
    note: 'Reads go to cache. Writes go to the database.',
  },
  {
    id: 'monitor', label: 'Monitoring', icon: '📊', dir: 'bottom',
    cx: 510, cy: 335, w: 110, h: 78,
    sub1: 'real-time', sub2: 'logs + alerts',
    color: '#f43f5e', glow: 'rgba(244,63,94,0.65)',    lc: '#fda4af', strip: 'bg-rose-500',
    desc: 'Tracks every request, error, and metric across the system.',
    note: 'You cannot fix what you cannot see.',
  },
]

// Connection endpoints — (x1,y1) is the "from" side, (x2,y2) is the "to" side.
// axis: 'h' horizontal | 'v' vertical | 'd' diagonal
const EDGES = {
  'dev-cicd':       { x1: 140, y1: 65,  x2: 190, y2: 65,  axis: 'h' },
  'cicd-server':    { x1: 245, y1: 105, x2: 450, y2: 144, axis: 'd' },
  'user-frontend':  { x1: 116, y1: 300, x2: 155, y2: 300, axis: 'h' },
  'frontend-lb':    { x1: 265, y1: 300, x2: 350, y2: 233, axis: 'd' },
  'lb-server':      { x1: 406, y1: 190, x2: 450, y2: 190, axis: 'h' },
  'server-cache':   { x1: 570, y1: 162, x2: 600, y2: 155, axis: 'd' },
  'server-db':      { x1: 570, y1: 218, x2: 625, y2: 245, axis: 'd' },
  'server-monitor': { x1: 510, y1: 236, x2: 510, y2: 296, axis: 'v' },
}

const DIR_C = {
  request:  { hex: '#3b82f6', glow: 'rgba(59,130,246,0.85)' },
  response: { hex: '#10b981', glow: 'rgba(16,185,129,0.85)' },
}

// ── Edge connection (SVG particles) ──────────────────────────────────────────

function EdgeConnection({ edgeId, connections, stepKey }) {
  const edge      = EDGES[edgeId]
  const direction = connections[edgeId]
  const isActive  = !!direction
  const fwd       = isActive && (direction === 'request'  || direction === 'both')
  const bwd       = isActive && (direction === 'response' || direction === 'both')

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
        stroke={isActive ? DIR_C.request.hex : '#182030'}
        strokeWidth={isActive ? 2 : 1}
        strokeDasharray={isActive ? 'none' : '5 4'}
        style={{ filter: isActive ? `drop-shadow(0 0 5px ${DIR_C.request.glow})` : 'none', transition: 'all 0.3s' }}
      />

      {fwd && [0, 1, 2].map((p) => (
        <motion.circle
          key={`${stepKey}-${edgeId}-f${p}`}
          r={3.5} fill={DIR_C.request.hex}
          style={{ filter: `drop-shadow(0 0 5px ${DIR_C.request.glow})` }}
          animate={fwdAnim}
          transition={{ duration: 0.5, delay: p * 0.16, ease: 'linear', repeat: Infinity, repeatDelay: 0.1 }}
        />
      ))}

      {bwd && [0, 1, 2].map((p) => (
        <motion.circle
          key={`${stepKey}-${edgeId}-b${p}`}
          r={3.5} fill={DIR_C.response.hex}
          style={{ filter: `drop-shadow(0 0 5px ${DIR_C.response.glow})` }}
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
        <motion.div className={`absolute top-0 left-0 right-0 h-0.5 ${node.strip}`}
          animate={{ opacity: isActive ? 1 : wasVisited ? 0.35 : 0.12 }} />

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
      </motion.button>

      {/* Info panel — opens toward diagram interior */}
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

export default function ApplicationArchitectureDiagram() {
  const steps  = useMemo(() => buildApplicationArchitectureSteps(), [])
  const runner = useTtsRunner(steps, (step) => `${step.message}. ${step.detail}`)
  const { step, index } = runner

  const [expandedNode, setExpandedNode] = useState(null)

  const visitedNodes = useMemo(() => {
    const s = new Set()
    for (let i = 0; i <= index; i++) steps[i].activeNodes.forEach((id) => s.add(id))
    return s
  }, [steps, index])

  const showBanner = step.type === 'monitoring'

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-white">Application Architecture — End to End</h2>
        <p className="text-sm text-slate-400">
          From a developer pushing code to a user getting a response. Step through each layer to see how they interact.
        </p>
      </div>

      {/* Diagram */}
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

              {/* SVG overlay for edges + particles */}
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
                  popKey={step.activeNodes.includes(node.id) ? index : null}
                />
              ))}
            </div>

            {/* Monitoring / full-system banner */}
            <AnimatePresence>
              {showBanner && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0,  scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                  className="relative mt-3 flex items-center gap-3 rounded-xl border border-rose-500/40 bg-rose-500/[0.07] px-4 py-3 overflow-hidden"
                >
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={`br-${i}`}
                      className="absolute inset-0 rounded-xl border border-rose-400/18 pointer-events-none"
                      initial={{ scale: 0.95, opacity: 0.65 }}
                      animate={{ scale: 1.5 + i * 0.3, opacity: 0 }}
                      transition={{ duration: 1.1, delay: i * 0.2, ease: 'easeOut' }}
                    />
                  ))}
                  <span className="text-xl relative z-10 select-none">📊</span>
                  <div className="relative z-10">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-rose-400">Full System Active</p>
                    <p className="text-sm text-white">Every layer is visible — deploy pipeline, request path, data layer, and observability all live.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 mt-3 px-1 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-px bg-blue-500 rounded-full" style={{ boxShadow: '0 0 4px rgba(59,130,246,0.8)' }} />
            <span className="text-[10px] text-slate-500">request / deploy</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-px bg-emerald-500 rounded-full" style={{ boxShadow: '0 0 4px rgba(16,185,129,0.8)' }} />
            <span className="text-[10px] text-slate-500">response / data</span>
          </div>
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
