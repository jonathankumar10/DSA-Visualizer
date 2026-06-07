import { useMemo, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { buildObjectStorageSteps } from './steps'
import { useStepRunner } from '../../../../hooks/useStepRunner'
import StepControls from '../../../../components/ui/StepControls'

// ── Layout ────────────────────────────────────────────────────────────────────
// Client (left) → Object Storage API (center) → Storage Nodes A/B/C (right, stacked)

const CW = 640
const CH = 300

const NODES = [
  {
    id: 'client', label: 'Client', icon: '💻', dir: 'bottom',
    cx: 72, cy: 150, w: 100, h: 78,
    color: '#94a3b8', glow: 'rgba(148,163,184,0.65)', lc: '#cbd5e1', strip: 'bg-slate-400',
    sub1: 'HTTP PUT / GET', sub2: 'browser / backend',
    desc: 'Makes HTTP calls to the storage API. For large uploads, uses presigned URLs to write directly — bypassing application servers entirely.',
    note: 'Never route file uploads through your app servers. Use presigned URLs for direct S3 access.',
  },
  {
    id: 'api', label: 'S3 API', icon: '☁️', dir: 'top',
    cx: 290, cy: 150, w: 128, h: 86,
    color: '#8b5cf6', glow: 'rgba(139,92,246,0.65)', lc: '#c4b5fd', strip: 'bg-violet-500',
    sub1: 'object storage', sub2: 'REST API / SDK',
    desc: 'The storage service API (AWS S3, GCS, Azure Blob). Handles authentication, generates object keys, and orchestrates replication across nodes.',
    note: 'Bucket names are globally unique and become part of the URL — choose carefully, they cannot be renamed.',
  },
  {
    id: 'nodeA', label: 'Node A', icon: '💾', dir: 'right',
    cx: 548, cy: 80, w: 100, h: 72,
    color: '#10b981', glow: 'rgba(16,185,129,0.65)', lc: '#6ee7b7', strip: 'bg-emerald-500',
    sub1: 'AZ-1', sub2: 'replica 1/3',
    desc: 'Storage node in Availability Zone 1. Each S3 object is stored in at least 3 AZs for 11-nines durability.',
    note: 'Durability: 99.999999999%. Even if two AZs fail simultaneously, your data is safe.',
  },
  {
    id: 'nodeB', label: 'Node B', icon: '💾', dir: 'right',
    cx: 548, cy: 155, w: 100, h: 72,
    color: '#10b981', glow: 'rgba(16,185,129,0.65)', lc: '#6ee7b7', strip: 'bg-emerald-500',
    sub1: 'AZ-2', sub2: 'replica 2/3',
    desc: 'Storage node in Availability Zone 2. Stores the same object independently.',
    note: 'Read-after-write consistency: a GET immediately after PUT returns the new object, guaranteed.',
  },
  {
    id: 'nodeC', label: 'Node C', icon: '💾', dir: 'right',
    cx: 548, cy: 230, w: 100, h: 72,
    color: '#10b981', glow: 'rgba(16,185,129,0.65)', lc: '#6ee7b7', strip: 'bg-emerald-500',
    sub1: 'AZ-3', sub2: 'replica 3/3',
    desc: 'Storage node in Availability Zone 3. Third replica ensures durability even if two AZs are lost.',
    note: 'Lifecycle policy can move objects from Standard → Infrequent Access → Glacier to cut storage costs automatically.',
  },
]

const EDGES = {
  'client-api':  { x1: 122, y1: 150, x2: 226, y2: 150, axis: 'h' },
  'api-nodeA':   { x1: 354, y1: 120, x2: 498, y2: 92,  axis: 'd' },
  'api-nodeB':   { x1: 354, y1: 150, x2: 498, y2: 155, axis: 'h' },
  'api-nodeC':   { x1: 354, y1: 180, x2: 498, y2: 218, axis: 'd' },
}

const C = {
  request:  { hex: '#8b5cf6', glow: 'rgba(139,92,246,0.85)'  },
  response: { hex: '#10b981', glow: 'rgba(16,185,129,0.85)'  },
  replicate:{ hex: '#3b82f6', glow: 'rgba(59,130,246,0.85)'  },
  presigned:{ hex: '#f59e0b', glow: 'rgba(245,158,11,0.85)'  },
}

const DIR_C_MAP = {
  request:   C.request,
  response:  C.response,
  replicate: C.replicate,
  presigned: C.presigned,
  both:      C.request,
}

// ── Edge connection ───────────────────────────────────────────────────────────

function EdgeConnection({ edgeId, connections, stepKey }) {
  const edge      = EDGES[edgeId]
  const direction = connections[edgeId]
  const isActive  = !!direction
  const fwdC      = isActive ? (DIR_C_MAP[direction] ?? C.request) : null
  const bwd       = direction === 'both'
  const bwdC      = bwd ? C.response : null

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
          boxShadow:       isActive ? `0 0 30px -5px ${node.glow}` : 'none',
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

        <AnimatePresence>
          {badge && isActive && (
            <motion.span
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 360, damping: 20 }}
              className="absolute top-1 right-1 text-[7px] font-bold font-mono text-violet-300 bg-violet-500/15 border border-violet-400/30 rounded px-1 leading-tight"
            >
              {badge}
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

export default function ObjectStorageDiagram({ onStepChange }) {
  const steps  = useMemo(() => buildObjectStorageSteps(), [])
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

  const showKeyBadge    = step.type === 'key-generated'
  const showPresigned   = step.type === 'presigned-url'
  const showReplicated  = step.type === 'replication'

  return (
    <div className="space-y-4">

      <div>
        <h2 className="text-lg font-semibold text-white">Object Storage — Upload, Replicate, Retrieve</h2>
        <p className="text-sm text-slate-400">
          Trace a file from HTTP PUT through key assignment, three-way AZ replication, and retrieval by key.
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
                {/* Replica label */}
                {showReplicated && (
                  <text x={388} y={106} style={{ fill: '#3b82f6', fontSize: 8, fontFamily: 'ui-monospace, monospace', fontWeight: 700, opacity: 0.8 }}>
                    3× replicate
                  </text>
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
                  badge={node.id === 'api' && step.badge ? step.badge : null}
                />
              ))}
            </div>

            {/* Status banners */}
            <AnimatePresence mode="wait">
              {showKeyBadge && (
                <motion.div
                  key="key"
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                  className="relative mt-3 flex items-center gap-4 rounded-xl border border-violet-500/40 bg-violet-500/[0.06] px-4 py-3 overflow-hidden"
                >
                  <span className="text-xl relative z-10 select-none">🔑</span>
                  <div className="relative z-10">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-violet-400">Object Key Assigned</p>
                    <p className="text-sm font-mono text-white">uploads/2024/user-123/<span className="text-violet-300 font-bold">avatar.jpg</span></p>
                  </div>
                </motion.div>
              )}
              {showPresigned && (
                <motion.div
                  key="presigned"
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                  className="relative mt-3 flex items-center gap-4 rounded-xl border border-amber-500/40 bg-amber-500/[0.06] px-4 py-3 overflow-hidden"
                >
                  <span className="text-xl relative z-10 select-none">⏱️</span>
                  <div className="relative z-10">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Presigned URL Generated</p>
                    <p className="text-sm font-mono text-white">expires in <span className="text-amber-300 font-bold">15 min</span> · client uploads directly to S3</p>
                  </div>
                </motion.div>
              )}
              {showReplicated && (
                <motion.div
                  key="replicated"
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                  className="relative mt-3 flex items-center gap-4 rounded-xl border border-emerald-500/40 bg-emerald-500/[0.06] px-4 py-3 overflow-hidden"
                >
                  <span className="text-xl relative z-10 select-none">✅</span>
                  <div className="relative z-10">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Replicated — 3 AZs</p>
                    <p className="text-sm text-white">Durability: <span className="text-emerald-300 font-bold">99.999999999%</span> (11 nines)</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 mt-3 px-1 flex-wrap">
          {[
            { color: C.request.hex,   glow: C.request.glow,   label: 'upload / request'   },
            { color: C.response.hex,  glow: C.response.glow,  label: 'retrieve / response'},
            { color: C.replicate.hex, glow: C.replicate.glow, label: 'replication'         },
            { color: C.presigned.hex, glow: C.presigned.glow, label: 'presigned URL'       },
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
