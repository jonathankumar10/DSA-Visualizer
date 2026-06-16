import { useMemo, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { buildApiParadigmsSteps } from './steps'
import { useStepRunner } from '../../../../hooks/useStepRunner'
import StepControls from '../../../../components/ui/StepControls'

const CW = 620
const CH = 320

const NODES = [
  {
    id: 'client', label: 'Client', icon: '📱', dir: 'left',
    cx: 75, cy: 160, w: 106, h: 82,
    color: '#8b5cf6', glow: 'rgba(139,92,246,0.65)', lc: '#c4b5fd', strip: 'bg-violet-500',
    sub1: 'sends requests', sub2: 'any paradigm',
    desc: 'The API consumer — web app, mobile client, or another service. Each paradigm presents a different interface to this consumer.',
    note: 'Pick the paradigm that matches your consumer\'s needs: flexibility (GraphQL), performance (gRPC), or simplicity (REST).',
  },
  {
    id: 'rest', label: 'REST', icon: '📡', dir: 'top',
    cx: 340, cy: 68, w: 126, h: 80,
    color: '#0ea5e9', glow: 'rgba(14,165,233,0.65)', lc: '#7dd3fc', strip: 'bg-sky-500',
    sub1: 'HTTP + JSON', sub2: 'resource URLs',
    desc: 'REST uses HTTP verbs on resource URLs. GET /users/42 returns a JSON object. Simple, cacheable, supported by every HTTP client.',
    note: 'Downside: fixed response shapes cause over-fetching. A mobile app receiving 30 fields when it needs 3 wastes bandwidth and battery.',
  },
  {
    id: 'graphql', label: 'GraphQL', icon: '⬡', dir: 'top',
    cx: 340, cy: 165, w: 126, h: 80,
    color: '#e879f9', glow: 'rgba(232,121,249,0.65)', lc: '#f0abfc', strip: 'bg-fuchsia-500',
    sub1: 'POST /graphql', sub2: 'query language',
    desc: 'GraphQL exposes one endpoint. Clients send a query specifying exactly which fields to return, including nested relations in one round trip.',
    note: 'N+1 problem: fetching 100 users each with their orders fires 101 queries. Solved with DataLoader (batching + caching).',
  },
  {
    id: 'grpc', label: 'gRPC', icon: '⚡', dir: 'top',
    cx: 340, cy: 262, w: 126, h: 80,
    color: '#10b981', glow: 'rgba(16,185,129,0.65)', lc: '#6ee7b7', strip: 'bg-emerald-500',
    sub1: 'HTTP/2 + Protobuf', sub2: 'binary protocol',
    desc: 'gRPC uses Protocol Buffers over HTTP/2. Binary serialisation, strongly typed contracts, multiplexed streams, and server/client streaming.',
    note: 'gRPC contracts are .proto files — compile-time type checking across languages. Breaking changes are caught before deployment.',
  },
]

const EDGES = {
  'client-rest':    { x1: 128, y1: 130, x2: 277, y2: 80,  axis: 'd' },
  'client-graphql': { x1: 128, y1: 160, x2: 277, y2: 162, axis: 'h' },
  'client-grpc':    { x1: 128, y1: 190, x2: 277, y2: 248, axis: 'd' },
}

const C = {
  violet:  { hex: '#8b5cf6', glow: 'rgba(139,92,246,0.85)' },
  sky:     { hex: '#0ea5e9', glow: 'rgba(14,165,233,0.85)' },
  fuchsia: { hex: '#e879f9', glow: 'rgba(232,121,249,0.85)' },
  emerald: { hex: '#10b981', glow: 'rgba(16,185,129,0.85)' },
}

const DIR_MAP = {
  request:  { fwd: C.violet,  bwd: null       },
  both:     { fwd: C.violet,  bwd: C.emerald  },
  response: { fwd: C.emerald, bwd: null       },
}

function EdgeConnection({ edgeId, connections, stepKey }) {
  const edge = EDGES[edgeId]
  const dir  = connections[edgeId]
  const map  = DIR_MAP[dir]

  const { x1, y1, x2, y2, axis } = edge
  const fwdC    = map?.fwd ?? null
  const bwdC    = map?.bwd ?? null
  const isActive = !!map

  const fwdAnim = axis === 'd' ? { cx: [x1, x2], cy: [y1, y2] } : { cx: [x1, x2], cy: y1 }
  const bwdAnim = axis === 'd' ? { cx: [x2, x1], cy: [y2, y1] } : { cx: [x2, x1], cy: y1 }

  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={isActive ? (fwdC?.hex ?? '#1e293b') : '#182030'}
        strokeWidth={isActive ? 2 : 1}
        strokeDasharray={isActive ? 'none' : '5 4'}
        style={{ filter: isActive && fwdC ? `drop-shadow(0 0 5px ${fwdC.glow})` : 'none', transition: 'all 0.3s' }}
      />
      {fwdC && [0, 1, 2].map((p) => (
        <motion.circle key={`${stepKey}-${edgeId}-f${p}`} r={3.5} fill={fwdC.hex}
          style={{ filter: `drop-shadow(0 0 5px ${fwdC.glow})` }}
          animate={fwdAnim}
          transition={{ duration: 0.5, delay: p * 0.16, ease: 'linear', repeat: Infinity, repeatDelay: 0.1 }}
        />
      ))}
      {bwdC && [0, 1, 2].map((p) => (
        <motion.circle key={`${stepKey}-${edgeId}-b${p}`} r={3.5} fill={bwdC.hex}
          style={{ filter: `drop-shadow(0 0 5px ${bwdC.glow})` }}
          animate={bwdAnim}
          transition={{ duration: 0.5, delay: p * 0.16, ease: 'linear', repeat: Infinity, repeatDelay: 0.1 }}
        />
      ))}
    </g>
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
            className="absolute z-30 w-56 rounded-xl border bg-slate-900/96 backdrop-blur shadow-2xl p-3 space-y-1.5"
            style={{
              borderColor: `${node.color}40`,
              ...(node.dir === 'top'  ? { top: '105%',    left: '50%', transform: 'translateX(-50%)' } : {}),
              ...(node.dir === 'left' ? { right: '105%',  top: '50%',  transform: 'translateY(-50%)' } : {}),
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

const PARADIGM_LABELS = {
  rest:    { color: '#0ea5e9', label: 'REST' },
  graphql: { color: '#e879f9', label: 'GraphQL' },
  grpc:    { color: '#10b981', label: 'gRPC' },
}

export default function ApiParadigmsDiagram({ onStepChange }) {
  const steps  = useMemo(() => buildApiParadigmsSteps(), [])
  const runner = useStepRunner(steps)
  const { step, index } = runner

  useEffect(() => { onStepChange?.(step) }, [step, onStepChange])

  const [expandedNode, setExpandedNode] = useState(null)

  const visitedNodes = useMemo(() => {
    const s = new Set()
    for (let i = 0; i <= index; i++) steps[i].activeNodes.forEach((id) => s.add(id))
    return s
  }, [steps, index])

  const activeParadigm = step.activeNodes.find((id) => id in PARADIGM_LABELS) ?? null

  return (
    <div className="space-y-4">

      <div>
        <h2 className="text-lg font-semibold text-white">API Paradigms — REST vs GraphQL vs gRPC</h2>
        <p className="text-sm text-slate-400">
          Compare the three dominant API styles. See when each paradigm wins and what trade-offs each introduces.
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

            <svg className="absolute inset-0 pointer-events-none overflow-visible"
              viewBox={`0 0 ${CW} ${CH}`} width={CW} height={CH}>
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
                popKey={step.activeNodes.includes(node.id) ? index : null}
              />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeParadigm && (
            <motion.div
              key={activeParadigm}
              initial={{ opacity: 0, y: 6, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 340, damping: 22 }}
              className="mt-3 flex items-center gap-3 rounded-xl border px-4 py-2.5"
              style={{
                borderColor: `${PARADIGM_LABELS[activeParadigm].color}40`,
                background:  `${PARADIGM_LABELS[activeParadigm].color}0e`,
              }}
            >
              <span style={{ color: PARADIGM_LABELS[activeParadigm].color }} className="select-none text-lg">◎</span>
              <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: PARADIGM_LABELS[activeParadigm].color }}>
                Active paradigm: {PARADIGM_LABELS[activeParadigm].label}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-5 mt-3 px-1 flex-wrap">
          {[
            { color: C.sky.hex,     glow: C.sky.glow,     label: 'REST (HTTP + JSON)' },
            { color: C.fuchsia.hex, glow: C.fuchsia.glow, label: 'GraphQL (query)' },
            { color: C.emerald.hex, glow: C.emerald.glow, label: 'gRPC (Protobuf)' },
          ].map(({ color, glow, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 4px ${glow}` }} />
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
