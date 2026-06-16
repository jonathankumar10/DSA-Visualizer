import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { buildCdnsSteps } from './steps'
import { useStepRunner } from '../../../../hooks/useStepRunner'
import StepControls from '../../../../components/ui/StepControls'

// ── Layout ────────────────────────────────────────────────────────────────────
// Two users (upper-left US, lower-left EU) each connect to their nearest edge.
// Both edges reach back to the single origin on the right.

const CW = 620
const CH = 295

const NODES = [
  {
    id: 'user-a', label: 'US User', icon: '👤', dir: 'left',
    cx: 68,  cy: 80,  w: 96, h: 70,
    color: '#94a3b8', glow: 'rgba(148,163,184,0.55)', lc: '#cbd5e1', strip: 'bg-slate-400',
    sub1: 'browser', sub2: '~US region',
    desc: 'End user in North America. DNS resolves the CDN hostname to the nearest US edge node.',
    note: 'Anycast routing directs the user to the closest edge automatically.',
  },
  {
    id: 'user-b', label: 'EU User', icon: '👤', dir: 'left',
    cx: 68,  cy: 220, w: 96, h: 70,
    color: '#94a3b8', glow: 'rgba(148,163,184,0.55)', lc: '#cbd5e1', strip: 'bg-slate-400',
    sub1: 'browser', sub2: '~EU region',
    desc: 'End user in Europe. Their DNS query resolves to the nearest EU edge node.',
    note: "Without a CDN they'd reach the US-based origin — 150–200 ms away.",
  },
  {
    id: 'us-edge', label: 'US Edge', icon: '🌐', dir: 'top',
    cx: 265, cy: 80,  w: 120, h: 76,
    color: '#0ea5e9', glow: 'rgba(14,165,233,0.65)', lc: '#7dd3fc', strip: 'bg-sky-500',
    sub1: 'PoP: North America', sub2: 'cold / warm cache',
    desc: 'A CDN Point of Presence (PoP) in North America. Stores cached copies of origin content.',
    note: 'Once warm, US requests never reach the origin — served entirely from this edge.',
  },
  {
    id: 'eu-edge', label: 'EU Edge', icon: '🌐', dir: 'top',
    cx: 265, cy: 220, w: 120, h: 76,
    color: '#0ea5e9', glow: 'rgba(14,165,233,0.65)', lc: '#7dd3fc', strip: 'bg-sky-500',
    sub1: 'PoP: Europe', sub2: 'cold / warm cache',
    desc: 'A CDN Point of Presence in Europe. Independently caches the same origin content.',
    note: 'Each PoP maintains its own cache — a miss at one edge never affects another.',
  },
  {
    id: 'origin', label: 'Origin Server', icon: '🖥️', dir: 'left',
    cx: 510, cy: 150, w: 122, h: 84,
    color: '#8b5cf6', glow: 'rgba(139,92,246,0.65)', lc: '#c4b5fd', strip: 'bg-violet-500',
    sub1: 'source of truth', sub2: 'CDN shield',
    desc: 'Your actual server. Only receives traffic when an edge has a cache miss.',
    note: 'With a warm CDN the origin handles a tiny fraction of total requests — often < 5%.',
  },
]

const EDGES = {
  'ua-edge':    { x1: 116, y1: 80,  x2: 205, y2: 80,  axis: 'h' },
  'ub-edge':    { x1: 116, y1: 220, x2: 205, y2: 220, axis: 'h' },
  'us-origin':  { x1: 325, y1: 80,  x2: 449, y2: 132, axis: 'd' },
  'eu-origin':  { x1: 325, y1: 220, x2: 449, y2: 170, axis: 'd' },
}

const C = {
  violet:  { hex: '#8b5cf6', glow: 'rgba(139,92,246,0.85)' },
  emerald: { hex: '#10b981', glow: 'rgba(16,185,129,0.85)' },
  sky:     { hex: '#0ea5e9', glow: 'rgba(14,165,233,0.85)' },
  red:     { hex: '#f43f5e', glow: 'rgba(244,63,94,0.85)'  },
}

const DIR_MAP = {
  request: { fwd: C.violet,  bwd: null       },
  both:    { fwd: C.violet,  bwd: C.emerald  },
  response:{ fwd: C.emerald, bwd: null       },
}

// ── Edge connection ───────────────────────────────────────────────────────────

function EdgeConnection({ edgeId, connections, stepKey }) {
  const edge = EDGES[edgeId]
  const dir  = connections[edgeId]
  const map  = DIR_MAP[dir]

  const { x1, y1, x2, y2, axis } = edge
  const fwdC = map?.fwd ?? null
  const bwdC = map?.bwd ?? null
  const isActive = !!map

  const fwdAnim = axis === 'd' ? { cx: [x1, x2], cy: [y1, y2] } : { cx: [x1, x2], cy: y1 }
  const bwdAnim = axis === 'd' ? { cx: [x2, x1], cy: [y2, y1] } : { cx: [x2, x1], cy: y2 }

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

// ── Node block ────────────────────────────────────────────────────────────────

function NodeBlock({ node, isActive, wasVisited, isExpanded, onClick, popKey, cacheHot }) {
  const { cx, cy, w, h } = node
  const isEdge    = node.id === 'us-edge' || node.id === 'eu-edge'
  const isWarm    = isEdge && cacheHot === 'warm'
  const accentBorder = isActive ? node.color
                     : isWarm   ? '#10b981'
                     : wasVisited ? `${node.color}38`
                     : 'rgba(255,255,255,0.08)'

  return (
    <div className="absolute" style={{ left: cx - w / 2, top: cy - h / 2, width: w, height: h }}>
      <motion.button
        onClick={onClick}
        className="relative w-full h-full rounded-xl border-2 overflow-hidden flex flex-col items-center justify-center gap-0.5 px-1 cursor-pointer focus:outline-none"
        animate={{
          borderColor:     accentBorder,
          backgroundColor: isActive ? `${node.color}16` : isWarm ? 'rgba(16,185,129,0.05)' : wasVisited ? `${node.color}07` : 'rgba(10,18,36,1)',
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

        {/* Cache warm / cold badge on edge nodes */}
        {isEdge && (
          <motion.span
            animate={{
              color:           isWarm ? '#34d399' : '#475569',
              backgroundColor: isWarm ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.03)',
              borderColor:     isWarm ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.08)',
            }}
            transition={{ duration: 0.35 }}
            className="mt-0.5 rounded border px-1.5 text-[8px] font-bold font-mono leading-4"
          >
            {isWarm ? '● WARM' : '○ COLD'}
          </motion.span>
        )}
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

// ── Main component ────────────────────────────────────────────────────────────

export default function CdnsDiagram() {
  const steps  = useMemo(() => buildCdnsSteps(), [])
  const runner = useStepRunner(steps)
  const { step, index } = runner

  const [expandedNode, setExpandedNode] = useState(null)

  const visitedNodes = useMemo(() => {
    const s = new Set()
    for (let i = 0; i <= index; i++) steps[i].activeNodes.forEach((id) => s.add(id))
    return s
  }, [steps, index])

  const { hitResult } = step

  return (
    <div className="space-y-4">

      <div>
        <h2 className="text-lg font-semibold text-white">CDN — Edge Cache Hit vs Miss</h2>
        <p className="text-sm text-slate-400">
          Watch content propagate from origin to edge nodes. Each user is served from the nearest cache — not the origin.
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

            {NODES.map((node) => {
              const edgeCacheKey = node.id === 'us-edge' ? 'us-edge' : node.id === 'eu-edge' ? 'eu-edge' : null
              return (
                <NodeBlock
                  key={node.id}
                  node={node}
                  isActive={step.activeNodes.includes(node.id)}
                  wasVisited={visitedNodes.has(node.id) && !step.activeNodes.includes(node.id)}
                  isExpanded={expandedNode === node.id}
                  onClick={() => setExpandedNode((p) => p === node.id ? null : node.id)}
                  popKey={step.activeNodes.includes(node.id) ? index : null}
                  cacheHot={edgeCacheKey ? step.edgeCache[edgeCacheKey] : null}
                />
              )
            })}
          </div>
        </div>

        {/* Hit / miss banner */}
        <AnimatePresence mode="wait">
          {hitResult?.type === 'hit' && (
            <motion.div
              key="hit"
              initial={{ opacity: 0, y: 6, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 340, damping: 22 }}
              className="mt-3 flex items-center gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/[0.07] px-4 py-2.5"
            >
              <span className="text-emerald-400 select-none">⚡</span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Edge Cache HIT</p>
                <p className="text-[11px] font-mono text-emerald-300">&lt; 20 ms · origin not contacted</p>
              </div>
            </motion.div>
          )}
          {hitResult?.type === 'miss' && (
            <motion.div
              key="miss"
              initial={{ opacity: 0, y: 6, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 340, damping: 22 }}
              className="mt-3 flex items-center gap-3 rounded-xl border border-rose-500/40 bg-rose-500/[0.07] px-4 py-2.5"
            >
              <span className="text-rose-400 select-none">✕</span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Edge Cache MISS</p>
                <p className="text-[11px] font-mono text-rose-300">fetching from origin · populating edge cache</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Legend */}
        <div className="flex items-center gap-5 mt-3 px-1 flex-wrap">
          {[
            { color: C.violet.hex,  glow: C.violet.glow,  label: 'request' },
            { color: C.emerald.hex, glow: C.emerald.glow, label: 'response / serve from edge' },
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
