import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { buildVideoStreamingSteps } from './steps'
import { useStepRunner } from '../../../../hooks/useStepRunner'
import StepControls from '../../../../components/ui/StepControls'

// ── Layout ─────────────────────────────────────────────────────────────────────
// Upload pipeline (top lane): uploader → uploadsvc → transcoder → storage
// Playback path (bottom lane): player ← cdn ← storage
// storage bridges both lanes (center-right)

const CW = 750
const CH = 345

const NODES = [
  {
    id: 'uploader', label: 'Uploader', icon: '📤', dir: 'left',
    cx: 62, cy: 112, w: 100, h: 76,
    color: '#94a3b8', glow: 'rgba(148,163,184,0.65)', lc: '#cbd5e1', strip: 'bg-slate-400',
    sub1: 'raw video', sub2: 'multipart upload',
    desc: 'The content creator uploading a raw video file. Uses a presigned S3 URL for direct upload to object storage.',
    note: 'Resumable uploads (TUS / S3 multipart) mean a broken connection does not restart from zero — critical for large files over mobile.',
  },
  {
    id: 'uploadsvc', label: 'Upload Service', icon: '⚙️', dir: 'top',
    cx: 208, cy: 112, w: 116, h: 80,
    color: '#8b5cf6', glow: 'rgba(139,92,246,0.65)', lc: '#c4b5fd', strip: 'bg-violet-500',
    sub1: 'presigned URL', sub2: 'enqueue transcode',
    desc: 'Generates a presigned S3 URL for direct upload, writes metadata to DB, and enqueues a transcoding job via message queue.',
    note: 'Application servers never handle video bytes during upload — they only generate the URL and track state.',
  },
  {
    id: 'transcoder', label: 'Transcoding Workers', icon: '🎬', dir: 'top',
    cx: 384, cy: 112, w: 126, h: 80,
    color: '#7c3aed', glow: 'rgba(124,58,237,0.65)', lc: '#ddd6fe', strip: 'bg-violet-700',
    sub1: '240p / 720p / 1080p', sub2: 'HLS segments',
    desc: 'Horizontally scalable workers (FFmpeg / AWS MediaConvert) convert raw video to multiple resolutions and HLS/DASH segments.',
    note: 'Transcoding on spot instances cut costs 70%+ vs. on-demand — a single 1-hour video generates ~GB of segmented output across all quality levels.',
  },
  {
    id: 'storage', label: 'Object Storage', icon: '🪣', dir: 'right',
    cx: 555, cy: 200, w: 116, h: 80,
    color: '#f59e0b', glow: 'rgba(245,158,11,0.65)', lc: '#fcd34d', strip: 'bg-amber-500',
    sub1: 'S3 — durable origin', sub2: 'raw + segments',
    desc: 'S3 stores raw uploads (raw/ prefix) and transcoded HLS segments + manifests (processed/ prefix). The durable origin that CDN caches from.',
    note: 'Popular videos are 100% edge-served by CDN — S3 origin receives only cache-miss traffic, which is a tiny fraction of total views.',
  },
  {
    id: 'cdn', label: 'CDN Edge', icon: '🌐', dir: 'right',
    cx: 676, cy: 112, w: 108, h: 78,
    color: '#0ea5e9', glow: 'rgba(14,165,233,0.65)', lc: '#7dd3fc', strip: 'bg-sky-500',
    sub1: 'global PoPs', sub2: '< 10ms latency',
    desc: 'CDN edge nodes cache HLS segments and manifests regionally. GeoDNS routes players to the nearest PoP.',
    note: 'First viewer in a region triggers a cache fill from S3. Every subsequent viewer is served from edge cache — CDN cache hit rate is the primary cost driver.',
  },
  {
    id: 'player', label: 'Video Player', icon: '▶️', dir: 'bottom',
    cx: 676, cy: 280, w: 108, h: 78,
    color: '#10b981', glow: 'rgba(16,185,129,0.65)', lc: '#6ee7b7', strip: 'bg-emerald-500',
    sub1: 'HLS.js / native', sub2: 'adaptive bitrate',
    desc: 'The client-side video player fetches the manifest, selects the appropriate quality playlist, and requests segments from the nearest CDN edge.',
    note: 'ABR switching is the reason streaming works on mobile — the player silently downgrades quality when bandwidth drops and upgrades when conditions improve.',
  },
]

const EDGES = {
  'uploader-uploadsvc':   { x1: 112, y1: 112, x2: 150, y2: 112, axis: 'h' },
  'uploadsvc-storage':    { x1: 266, y1: 120, x2: 497, y2: 168, axis: 'd' },
  'uploadsvc-transcoder': { x1: 266, y1: 112, x2: 321, y2: 112, axis: 'h' },
  'transcoder-storage':   { x1: 447, y1: 120, x2: 497, y2: 164, axis: 'd' },
  'storage-cdn':          { x1: 611, y1: 175, x2: 622, y2: 150, axis: 'd' },
  'player-cdn':           { x1: 676, y1: 241, x2: 676, y2: 190, axis: 'v' },
}

const C = {
  violet:  { hex: '#8b5cf6', glow: 'rgba(139,92,246,0.85)'  },
  emerald: { hex: '#10b981', glow: 'rgba(16,185,129,0.85)'  },
  sky:     { hex: '#0ea5e9', glow: 'rgba(14,165,233,0.85)'  },
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

// ── Quality levels badge (transcoding step) ───────────────────────────────────

const QUALITIES = ['240p · 300kbps', '480p · 800kbps', '720p · 2.5Mbps', '1080p · 5Mbps']

function QualityBadge({ visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 24 }}
          className="mt-3 rounded-xl border border-violet-500/30 bg-violet-500/[0.07] px-4 py-3"
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-violet-400 mb-2">
            HLS Output — 4 Quality Levels
          </p>
          <div className="flex flex-wrap gap-2">
            {QUALITIES.map((q, i) => (
              <motion.span
                key={q}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, type: 'spring', stiffness: 360, damping: 22 }}
                className="text-[11px] font-mono text-violet-200 bg-violet-500/15 border border-violet-500/25 rounded px-2 py-0.5"
              >
                {q}
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── ABR status badge ──────────────────────────────────────────────────────────

function AbrBadge({ visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 24 }}
          className="relative mt-3 flex items-center gap-3 rounded-xl border border-sky-500/40 bg-sky-500/[0.07] px-4 py-3 overflow-hidden"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={`abr-${i}`}
              className="absolute inset-0 rounded-xl border border-sky-400/18 pointer-events-none"
              initial={{ scale: 0.95, opacity: 0.65 }}
              animate={{ scale: 1.5 + i * 0.3, opacity: 0 }}
              transition={{ duration: 1.1, delay: i * 0.2, ease: 'easeOut' }}
            />
          ))}
          <span className="text-xl relative z-10 select-none">📶</span>
          <div className="relative z-10">
            <p className="text-[11px] font-bold uppercase tracking-wider text-sky-400">Adaptive Bitrate Active</p>
            <p className="text-sm text-white">Buffer health: 8s ahead · Current: 720p · Bandwidth: 4.2 Mbps</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function VideoStreamingDiagram() {
  const steps  = useMemo(() => buildVideoStreamingSteps(), [])
  const runner = useStepRunner(steps)
  const { step, index } = runner

  const [expandedNode, setExpandedNode] = useState(null)

  const visitedNodes = useMemo(() => {
    const s = new Set()
    for (let i = 0; i <= index; i++) steps[i].activeNodes.forEach((id) => s.add(id))
    return s
  }, [steps, index])

  const showQualityBadge = step.type === 'multi-resolution' || step.type === 'segments-to-storage'
  const showAbrBadge     = step.type === 'adaptive-bitrate' || step.type === 'manifest-fetch'

  return (
    <div className="space-y-4">

      <div>
        <h2 className="text-lg font-semibold text-white">Video Streaming — Upload to Playback</h2>
        <p className="text-sm text-slate-400">
          Trace raw video from upload through transcoding and object storage, then follow the CDN-powered playback path with adaptive bitrate switching.
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

                {/* Lane labels */}
                <text x={60} y={56} style={{ fill: '#8b5cf6', fontSize: 9, fontFamily: 'ui-monospace, monospace', fontWeight: 600, opacity: 0.55 }}>
                  UPLOAD + TRANSCODE PIPELINE
                </text>
                <text x={570} y={248} style={{ fill: '#10b981', fontSize: 9, fontFamily: 'ui-monospace, monospace', fontWeight: 600, opacity: 0.55 }}>
                  PLAYBACK PATH
                </text>
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

            <QualityBadge visible={showQualityBadge} />
            <AbrBadge     visible={showAbrBadge}     />
          </div>
        </div>

        <div className="flex items-center gap-5 mt-3 px-1 flex-wrap">
          {[
            { color: C.violet.hex,  glow: C.violet.glow,  label: 'upload / transcode' },
            { color: C.emerald.hex, glow: C.emerald.glow, label: 'playback / data'    },
            { color: C.sky.hex,     glow: C.sky.glow,     label: 'CDN cache fill'     },
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
