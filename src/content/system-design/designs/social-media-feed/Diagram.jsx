import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { buildSocialMediaFeedSteps } from './steps'
import { useStepRunner } from '../../../../hooks/useStepRunner'
import StepControls from '../../../../components/ui/StepControls'

// ── Layout ─────────────────────────────────────────────────────────────────────
// user (left) → feedservice (center-left, read path)
// user (left) → fanout (center, write path)
// feedservice ↔ feedcache (center-right)
// feedservice ↔ postsdb (right-top)
// fanout ↔ followgraph (right-bottom)
// fanout → feedcache (write into follower feeds)

const CW = 740
const CH = 360

const NODES = [
  {
    id: 'user', label: 'User', icon: '👤', dir: 'left',
    cx: 60, cy: 188, w: 96, h: 78,
    color: '#94a3b8', glow: 'rgba(148,163,184,0.65)', lc: '#cbd5e1', strip: 'bg-slate-400',
    sub1: 'read + write', sub2: 'follower',
    desc: 'Both a content producer (posts) and consumer (reads feed). Both paths go through this single entry point.',
    note: '"Read your own writes" must be guaranteed — the author must see their own post immediately on their own profile.',
  },
  {
    id: 'feedservice', label: 'Feed Service', icon: '📰', dir: 'top',
    cx: 212, cy: 118, w: 116, h: 80,
    color: '#8b5cf6', glow: 'rgba(139,92,246,0.65)', lc: '#c4b5fd', strip: 'bg-violet-500',
    sub1: 'read path', sub2: 'hydrate + rank',
    desc: 'Handles feed reads: fetches post IDs from Redis ZSET, hydrates content from Posts DB, returns ranked paginated feed.',
    note: 'Cursor-based pagination — uses the score of the last-seen item, not an offset. Offsets break when new posts are inserted.',
  },
  {
    id: 'fanout', label: 'Fan-out Service', icon: '📡', dir: 'bottom',
    cx: 212, cy: 276, w: 116, h: 80,
    color: '#ec4899', glow: 'rgba(236,72,153,0.65)', lc: '#f9a8d4', strip: 'bg-pink-500',
    sub1: 'write path', sub2: 'push to follower feeds',
    desc: 'Receives post events asynchronously and writes the post ID into each follower\'s feed cache in Redis.',
    note: 'Skips celebrities (> 1M followers) — their followers use fan-out on read instead, merging at load time to avoid 10M writes per tweet.',
  },
  {
    id: 'feedcache', label: 'Feed Cache', icon: '⚡', dir: 'top',
    cx: 420, cy: 188, w: 116, h: 80,
    color: '#10b981', glow: 'rgba(16,185,129,0.65)', lc: '#6ee7b7', strip: 'bg-emerald-500',
    sub1: 'Redis ZSET', sub2: 'feed:{userId}',
    desc: 'Each user\'s feed is a Redis sorted set of post IDs scored by rank. ZADD inserts; ZRANGE pages. TTL evicts old posts.',
    note: 'Stores only post IDs, not content — the feed cache never needs to be updated when a post is edited or deleted.',
  },
  {
    id: 'postsdb', label: 'Posts DB', icon: '🗄️', dir: 'right',
    cx: 612, cy: 112, w: 112, h: 78,
    color: '#f59e0b', glow: 'rgba(245,158,11,0.65)', lc: '#fcd34d', strip: 'bg-amber-500',
    sub1: 'content store', sub2: 'batched reads',
    desc: 'Stores post content: text, media URLs, author ID, timestamp, engagement counts. Only hit on cache miss or hydration.',
    note: 'View counts use Redis INCR with batch flush to DB — avoids hot-row contention from millions of concurrent increments on viral posts.',
  },
  {
    id: 'followgraph', label: 'Follow Graph', icon: '🔗', dir: 'right',
    cx: 612, cy: 278, w: 112, h: 78,
    color: '#0ea5e9', glow: 'rgba(14,165,233,0.65)', lc: '#7dd3fc', strip: 'bg-sky-500',
    sub1: 'adjacency list', sub2: 'follower lookup',
    desc: 'Stores the follower/following relationships. Fan-out service queries this to get the full follower list for a user.',
    note: 'Graph stored as adjacency lists in Redis sets (O(1) member checks) or a graph DB for complex traversals like mutual-follow suggestions.',
  },
]

const EDGES = {
  'user-feedservice':      { x1: 108, y1: 160, x2: 154, y2: 138, axis: 'd' },
  'user-fanout':           { x1: 108, y1: 214, x2: 154, y2: 256, axis: 'd' },
  'feedservice-feedcache': { x1: 270, y1: 128, x2: 362, y2: 168, axis: 'd' },
  'feedservice-postsdb':   { x1: 270, y1: 112, x2: 556, y2: 112, axis: 'h' },
  'fanout-feedcache':      { x1: 270, y1: 262, x2: 362, y2: 210, axis: 'd' },
  'fanout-followgraph':    { x1: 270, y1: 278, x2: 556, y2: 278, axis: 'h' },
}

const C = {
  violet:  { hex: '#8b5cf6', glow: 'rgba(139,92,246,0.85)'  },
  emerald: { hex: '#10b981', glow: 'rgba(16,185,129,0.85)'  },
  pink:    { hex: '#ec4899', glow: 'rgba(236,72,153,0.85)'  },
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

// ── Celebrity banner ──────────────────────────────────────────────────────────

function CelebrityBanner({ visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 24 }}
          className="relative mt-3 flex items-center gap-3 rounded-xl border border-pink-500/40 bg-pink-500/[0.07] px-4 py-3 overflow-hidden"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={`cel-${i}`}
              className="absolute inset-0 rounded-xl border border-pink-400/18 pointer-events-none"
              initial={{ scale: 0.95, opacity: 0.65 }}
              animate={{ scale: 1.5 + i * 0.3, opacity: 0 }}
              transition={{ duration: 1.1, delay: i * 0.2, ease: 'easeOut' }}
            />
          ))}
          <span className="text-xl relative z-10 select-none">⭐</span>
          <div className="relative z-10">
            <p className="text-[11px] font-bold uppercase tracking-wider text-pink-400">Hybrid Model Active</p>
            <p className="text-sm text-white">Regular users: fan-out on write. Celebrities (&gt; 1M followers): fan-out on read at load time.</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SocialMediaFeedDiagram() {
  const steps  = useMemo(() => buildSocialMediaFeedSteps(), [])
  const runner = useStepRunner(steps)
  const { step, index } = runner

  const [expandedNode, setExpandedNode] = useState(null)

  const visitedNodes = useMemo(() => {
    const s = new Set()
    for (let i = 0; i <= index; i++) steps[i].activeNodes.forEach((id) => s.add(id))
    return s
  }, [steps, index])

  const showCelebBanner = step.type === 'celebrity-problem'

  return (
    <div className="space-y-4">

      <div>
        <h2 className="text-lg font-semibold text-white">Social Media Feed — Fan-out Architecture</h2>
        <p className="text-sm text-slate-400">
          Trace the write path (post → fan-out → feed cache) and read path (feed load → hydrate), then see how the hybrid model handles celebrity accounts.
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
                <text x={130} y={58} style={{ fill: '#8b5cf6', fontSize: 9, fontFamily: 'ui-monospace, monospace', fontWeight: 600, opacity: 0.55 }}>
                  READ PATH
                </text>
                <text x={130} y={330} style={{ fill: '#ec4899', fontSize: 9, fontFamily: 'ui-monospace, monospace', fontWeight: 600, opacity: 0.55 }}>
                  WRITE PATH (fan-out)
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

            <CelebrityBanner visible={showCelebBanner} />
          </div>
        </div>

        <div className="flex items-center gap-5 mt-3 px-1 flex-wrap">
          {[
            { color: C.violet.hex,  glow: C.violet.glow,  label: 'read / request'  },
            { color: C.emerald.hex, glow: C.emerald.glow, label: 'response / data' },
            { color: C.pink.hex,    glow: C.pink.glow,    label: 'fan-out write'   },
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
