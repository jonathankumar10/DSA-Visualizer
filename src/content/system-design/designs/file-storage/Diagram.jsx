import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { buildFileStorageSteps } from './steps'
import { useStepRunner } from '../../../../hooks/useStepRunner'
import StepControls from '../../../../components/ui/StepControls'

// ── Layout ────────────────────────────────────────────────────────────────────
// Left:         client (Device 1), syncClient (Sync Client)
// Center-left:  apiSvc (API Service)
// Center:       metaDB (Metadata DB)
// Center-right: chunkStore (Object Storage), cdn (CDN)
// Right:        notifSvc (Notification Service), device2 (Device 2)

const CW = 740
const CH = 350

const NODES = [
  {
    id: 'client', label: 'Device 1', icon: '💻', dir: 'left',
    cx: 56, cy: 105, w: 92, h: 70,
    color: '#8b5cf6', glow: 'rgba(139,92,246,0.65)', lc: '#c4b5fd', strip: 'bg-violet-500',
    sub1: 'user device', sub2: 'any platform',
    desc: 'The user\'s primary device — desktop, laptop, or mobile. Changes detected by file system watcher.',
    note: 'The sync client runs as a background process, watching for file system events.',
  },
  {
    id: 'syncClient', label: 'Sync Client', icon: '🔄', dir: 'left',
    cx: 56, cy: 215, w: 92, h: 70,
    color: '#7c3aed', glow: 'rgba(124,58,237,0.65)', lc: '#c4b5fd', strip: 'bg-violet-700',
    sub1: 'chunk + hash', sub2: 'diff local index',
    desc: 'Computes SHA-256 per chunk, diffs against the local index, and uploads only new chunks. Also reassembles chunks on download.',
    note: 'The client owns the diff logic — the server is a store + notifier, not a diff engine.',
  },
  {
    id: 'apiSvc', label: 'API Service', icon: '⚙️', dir: 'top',
    cx: 210, cy: 160, w: 108, h: 72,
    color: '#6366f1', glow: 'rgba(99,102,241,0.65)', lc: '#a5b4fc', strip: 'bg-indigo-500',
    sub1: 'REST / gRPC', sub2: 'auth + routing',
    desc: 'Validates uploads, checks deduplication, orchestrates writes to Metadata DB and object storage, and triggers sync notifications.',
    note: 'Separates metadata operations (relational DB) from binary content (object storage) — different scaling tiers.',
  },
  {
    id: 'metaDB', label: 'Metadata DB', icon: '🗂️', dir: 'top',
    cx: 370, cy: 105, w: 112, h: 72,
    color: '#0ea5e9', glow: 'rgba(14,165,233,0.65)', lc: '#7dd3fc', strip: 'bg-sky-500',
    sub1: 'PostgreSQL', sub2: 'file tree + versions',
    desc: 'Stores file hierarchy, chunk hash lists, version history, share permissions, and device sync state. Relational DB for ACID guarantees on metadata.',
    note: 'Never mix metadata and content in the same store — they have different access patterns and scale independently.',
  },
  {
    id: 'chunkStore', label: 'Object Storage', icon: '🪣', dir: 'top',
    cx: 370, cy: 215, w: 112, h: 72,
    color: '#f59e0b', glow: 'rgba(245,158,11,0.65)', lc: '#fcd34d', strip: 'bg-amber-500',
    sub1: 'S3 / GCS', sub2: 'content-addressed',
    desc: 'Stores raw chunk bytes, keyed by SHA-256 hash. Immutable blobs — chunks are written once, never overwritten. Deduplication happens naturally.',
    note: 'Chunk key = SHA-256(content) means identical content from any user is stored exactly once.',
  },
  {
    id: 'cdn', label: 'CDN', icon: '🌐', dir: 'bottom',
    cx: 370, cy: 305, w: 112, h: 66,
    color: '#10b981', glow: 'rgba(16,185,129,0.65)', lc: '#6ee7b7', strip: 'bg-emerald-500',
    sub1: 'edge cache', sub2: 'hot chunks',
    desc: 'Caches frequently downloaded chunks at edge nodes close to users. Reduces object storage egress costs for popular shared files.',
    note: 'Cold / rarely accessed chunks fall back to object storage. CDN TTL tuned to file version lifecycle.',
  },
  {
    id: 'notifSvc', label: 'Notif Service', icon: '📣', dir: 'right',
    cx: 572, cy: 105, w: 112, h: 70,
    color: '#a855f7', glow: 'rgba(168,85,247,0.65)', lc: '#d8b4fe', strip: 'bg-purple-500',
    sub1: 'WebSocket / poll', sub2: 'push sync events',
    desc: 'Pushes "file changed" events to all connected devices for the affected user. Devices then pull only the new chunk hashes.',
    note: 'Long polling or WebSocket — the device does not poll for changes; the server pushes them.',
  },
  {
    id: 'device2', label: 'Device 2', icon: '📱', dir: 'right',
    cx: 690, cy: 160, w: 92, h: 70,
    color: '#06b6d4', glow: 'rgba(6,182,212,0.65)', lc: '#67e8f9', strip: 'bg-cyan-500',
    sub1: 'phone / tablet', sub2: 'receives sync',
    desc: 'Second user device. Receives push sync notification, fetches only new chunks, and assembles the updated file locally.',
    note: 'If both devices are offline and edit the same file, a conflict copy is created on sync.',
  },
]

const EDGES = {
  'syncClient-apiSvc':  { x1: 102, y1: 215, x2: 156, y2: 185, axis: 'd' },
  'client-syncClient':  { x1: 56,  y1: 140, x2: 56,  y2: 180, axis: 'v' },
  'client-apiSvc':      { x1: 102, y1: 110, x2: 156, y2: 148, axis: 'd' },
  'apiSvc-metaDB':      { x1: 264, y1: 145, x2: 314, y2: 122, axis: 'd' },
  'apiSvc-chunkStore':  { x1: 264, y1: 175, x2: 314, y2: 205, axis: 'd' },
  'apiSvc-notifSvc':    { x1: 264, y1: 152, x2: 516, y2: 122, axis: 'd' },
  'cdn-chunkStore':     { x1: 370, y1: 272, x2: 370, y2: 251, axis: 'v' },
  'device2-cdn':        { x1: 644, y1: 185, x2: 426, y2: 290, axis: 'd' },
  'device2-apiSvc':     { x1: 644, y1: 168, x2: 264, y2: 162, axis: 'h' },
  'notifSvc-device2':   { x1: 628, y1: 120, x2: 644, y2: 148, axis: 'd' },
}

const C = {
  request:  { hex: '#8b5cf6', glow: 'rgba(139,92,246,0.85)' },
  response: { hex: '#10b981', glow: 'rgba(16,185,129,0.85)' },
  write:    { hex: '#f59e0b', glow: 'rgba(245,158,11,0.85)' },
  notify:   { hex: '#a855f7', glow: 'rgba(168,85,247,0.85)' },
}

const DIR_MAP = {
  request:  { fwd: C.request,  bwd: null },
  response: { fwd: C.response, bwd: null },
  both:     { fwd: C.request,  bwd: C.response },
  write:    { fwd: C.write,    bwd: null },
  notify:   { fwd: C.notify,   bwd: null },
}

// ── Edge connection ───────────────────────────────────────────────────────────

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

// ── Main component ────────────────────────────────────────────────────────────

export default function FileStorageDiagram() {
  const steps  = useMemo(() => buildFileStorageSteps(), [])
  const runner = useStepRunner(steps)
  const { step, index } = runner

  const [expandedNode, setExpandedNode] = useState(null)

  const visitedNodes = useMemo(() => {
    const s = new Set()
    for (let i = 0; i <= index; i++) steps[i].activeNodes.forEach((id) => s.add(id))
    return s
  }, [steps, index])

  const showDeltaBanner    = step.type === 'delta-sync'
  const showConflictBanner = step.type === 'conflict'

  return (
    <div className="space-y-4">

      <div>
        <h2 className="text-lg font-semibold text-white">File Storage Architecture</h2>
        <p className="text-sm text-slate-400">
          Trace upload chunking, deduplication, cross-device sync, CDN delivery, and conflict resolution.
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
                <text x={12}  y={20} style={{ fill: '#4c1d95', fontSize: 8, fontFamily: 'monospace', fontWeight: 700, opacity: 0.7 }}>CLIENT</text>
                <text x={162} y={20} style={{ fill: '#312e81', fontSize: 8, fontFamily: 'monospace', fontWeight: 700, opacity: 0.7 }}>API LAYER</text>
                <text x={320} y={20} style={{ fill: '#0c4a6e', fontSize: 8, fontFamily: 'monospace', fontWeight: 700, opacity: 0.7 }}>STORAGE</text>
                <text x={526} y={20} style={{ fill: '#4a044e', fontSize: 8, fontFamily: 'monospace', fontWeight: 700, opacity: 0.7 }}>DELIVERY</text>
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

            <AnimatePresence>
              {showDeltaBanner && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                  className="relative mt-3 flex items-center gap-3 rounded-xl border border-violet-500/40 bg-violet-500/[0.07] px-4 py-3"
                >
                  <span className="text-xl select-none">⚡</span>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-violet-400">Delta Sync Active</p>
                    <p className="text-sm text-white">Only changed chunks are uploaded. Bandwidth is proportional to the edit, not the file size — editing 1 KB of a 500 MB file uploads 1 KB.</p>
                  </div>
                </motion.div>
              )}
              {showConflictBanner && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                  className="relative mt-3 flex items-center gap-3 rounded-xl border border-rose-500/40 bg-rose-500/[0.07] px-4 py-3"
                >
                  <span className="text-xl select-none">⚠️</span>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-rose-400">Conflict Detected</p>
                    <p className="text-sm text-white">Two offline devices created divergent versions. A conflict copy is saved — the user resolves manually. Auto-merge is unsafe for binary files.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-5 mt-3 px-1 flex-wrap">
          {[
            { color: C.request.hex,  glow: C.request.glow,  label: 'upload / request' },
            { color: C.response.hex, glow: C.response.glow, label: 'download / response' },
            { color: C.write.hex,    glow: C.write.glow,    label: 'write / store' },
            { color: C.notify.hex,   glow: C.notify.glow,   label: 'sync notification' },
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
