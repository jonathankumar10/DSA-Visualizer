import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { buildCachingSteps } from './steps'
import { useStepRunner } from '../../../../hooks/useStepRunner'
import StepControls from '../../../../components/ui/StepControls'

// ── Layout ────────────────────────────────────────────────────────────────────
// Server (left) branches upward to Cache and downward to DB.
// Two paths visualised simultaneously: fast (server↔cache) and slow (server↔db).

const CW = 580
const CH = 270

const NODES = [
  {
    id: 'server', label: 'App Server', icon: '🖥️', dir: 'left',
    cx: 90,  cy: 135, w: 110, h: 82,
    color: '#3b82f6', glow: 'rgba(59,130,246,0.65)', lc: '#93c5fd', strip: 'bg-blue-500',
    sub1: 'queries cache first', sub2: 'falls back to DB',
    desc: 'The application server. It always checks the cache before going to the database.',
    note: 'On a miss it queries the DB, then populates the cache so the next request is a hit.',
  },
  {
    id: 'cache', label: 'Cache', icon: '⚡', dir: 'top',
    cx: 345, cy: 70,  w: 120, h: 80,
    color: '#10b981', glow: 'rgba(16,185,129,0.65)', lc: '#6ee7b7', strip: 'bg-emerald-500',
    sub1: '< 1 ms', sub2: 'Redis / Memcached',
    desc: 'In-memory key-value store. Returns data in microseconds — no disk I/O, no SQL parsing.',
    note: 'Hit rate is the key metric. 99% hit rate = 100× less DB load.',
  },
  {
    id: 'db', label: 'Database', icon: '🗄️', dir: 'top',
    cx: 345, cy: 215, w: 120, h: 80,
    color: '#f59e0b', glow: 'rgba(245,158,11,0.65)', lc: '#fcd34d', strip: 'bg-amber-500',
    sub1: '1–10 ms', sub2: 'persistent',
    desc: 'The source of truth. Every write lands here; reads happen only on cache misses.',
    note: 'At 99% cache hit rate the DB sees 1% of read traffic — the cache is the real workhorse.',
  },
]

const EDGES = {
  'server-cache': { x1: 145, y1: 118, x2: 285, y2: 82,  axis: 'd' },
  'server-db':    { x1: 145, y1: 152, x2: 285, y2: 200, axis: 'd' },
}

const C = {
  blue:    { hex: '#3b82f6', glow: 'rgba(59,130,246,0.85)'  },
  emerald: { hex: '#10b981', glow: 'rgba(16,185,129,0.85)'  },
  red:     { hex: '#f43f5e', glow: 'rgba(244,63,94,0.85)'   },
  amber:   { hex: '#f59e0b', glow: 'rgba(245,158,11,0.85)'  },
}

// direction → { fwd, bwd }  (null = no particles in that direction)
const DIR_MAP = {
  both:     { fwd: C.blue,    bwd: C.emerald },
  miss:     { fwd: C.blue,    bwd: C.red     },
  write:    { fwd: C.amber,   bwd: null       },
  response: { fwd: C.emerald, bwd: null       },
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

function NodeBlock({ node, isActive, wasVisited, isExpanded, onClick, popKey, cacheState }) {
  const { cx, cy, w, h } = node

  const isExpiring  = node.id === 'cache' && cacheState === 'expired'
  const isEvicting  = node.id === 'cache' && cacheState === 'evicting'
  const borderColor = isActive  ? node.color
                    : isExpiring || isEvicting ? '#f59e0b'
                    : wasVisited ? `${node.color}38`
                    : 'rgba(255,255,255,0.08)'
  const bgColor     = isActive  ? `${node.color}16`
                    : isExpiring || isEvicting ? 'rgba(245,158,11,0.06)'
                    : wasVisited ? `${node.color}07`
                    : 'rgba(10,18,36,1)'

  return (
    <div className="absolute" style={{ left: cx - w / 2, top: cy - h / 2, width: w, height: h }}>
      <motion.button
        onClick={onClick}
        className="relative w-full h-full rounded-xl border-2 overflow-hidden flex flex-col items-center justify-center gap-0.5 px-1 cursor-pointer focus:outline-none"
        animate={{ borderColor, backgroundColor: bgColor, boxShadow: isActive ? `0 0 28px -5px ${node.glow}` : 'none' }}
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

        {/* TTL expired / evicting badge */}
        <AnimatePresence>
          {(isExpiring || isEvicting) && (
            <motion.span
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 360, damping: 20 }}
              className="absolute top-1 right-1 text-[8px] font-bold font-mono text-amber-400 bg-amber-400/10 border border-amber-400/30 rounded px-1"
            >
              {isExpiring ? 'EXPIRED' : 'EVICTING'}
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

// ── Path labels ───────────────────────────────────────────────────────────────

function PathLabel({ x, y, label, color }) {
  return (
    <text x={x} y={y} className="select-none"
      style={{ fill: color, fontSize: 9, fontFamily: 'ui-monospace, monospace', fontWeight: 600, opacity: 0.65 }}>
      {label}
    </text>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CachingDiagram() {
  const steps  = useMemo(() => buildCachingSteps(), [])
  const runner = useStepRunner(steps)
  const { step, index } = runner

  const [expandedNode, setExpandedNode] = useState(null)

  const visitedNodes = useMemo(() => {
    const s = new Set()
    for (let i = 0; i <= index; i++) steps[i].activeNodes.forEach((id) => s.add(id))
    return s
  }, [steps, index])

  return (
    <div className="space-y-4">

      <div>
        <h2 className="text-lg font-semibold text-white">Caching — Hit vs Miss</h2>
        <p className="text-sm text-slate-400">
          Step through the cache hit, miss, and populate cycle. See why hit rate is the number that matters.
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
              <PathLabel x={200} y={68}  label="FAST PATH  ~1 ms"  color={C.emerald.hex} />
              <PathLabel x={200} y={222} label="SLOW PATH  ~10 ms" color={C.amber.hex}   />
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
                cacheState={step.cacheState}
              />
            ))}
          </div>
        </div>

        {/* Hit / miss result badge */}
        <AnimatePresence mode="wait">
          {step.hitResult === 'hit' && (
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
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Cache HIT</p>
                <p className="text-[11px] font-mono text-emerald-300">~1 ms response · database not touched</p>
              </div>
            </motion.div>
          )}
          {step.hitResult === 'miss' && (
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
                <p className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Cache MISS</p>
                <p className="text-[11px] font-mono text-rose-300">~10 ms · falls back to database</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Legend */}
        <div className="flex items-center gap-5 mt-3 px-1 flex-wrap">
          {[
            { color: C.blue.hex,    glow: C.blue.glow,    label: 'request (check cache / DB)' },
            { color: C.emerald.hex, glow: C.emerald.glow, label: 'response (hit / DB result)'  },
            { color: C.red.hex,     glow: C.red.glow,     label: 'cache miss'                  },
            { color: C.amber.hex,   glow: C.amber.glow,   label: 'write / populate'             },
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
