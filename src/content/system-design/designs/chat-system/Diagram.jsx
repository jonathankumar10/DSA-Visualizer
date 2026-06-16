import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { buildChatSystemSteps } from './steps'
import { useStepRunner } from '../../../../hooks/useStepRunner'
import StepControls from '../../../../components/ui/StepControls'

// ── Layout ────────────────────────────────────────────────────────────────────
// Left column:  userA
// Center-left:  gateway (API Gateway)
// Center:       chatSvc (Chat Service), sequencer (ID Gen), presence (Presence)
// Center-right: mq (Message Queue), cassandra (Cassandra DB)
// Right:        userB, pushSvc

const CW = 740
const CH = 360

const NODES = [
  {
    id: 'userA', label: 'User A', icon: '👤', dir: 'left',
    cx: 56, cy: 130, w: 92, h: 72,
    color: '#8b5cf6', glow: 'rgba(139,92,246,0.65)', lc: '#c4b5fd', strip: 'bg-violet-500',
    sub1: 'WebSocket', sub2: 'online',
    desc: 'The message sender. Holds a persistent WebSocket connection to a Chat Server via the API Gateway.',
    note: 'WebSocket lets the server push to this client without polling.',
  },
  {
    id: 'gateway', label: 'API Gateway', icon: '🔀', dir: 'top',
    cx: 190, cy: 130, w: 106, h: 72,
    color: '#6366f1', glow: 'rgba(99,102,241,0.65)', lc: '#a5b4fc', strip: 'bg-indigo-500',
    sub1: 'WS + REST', sub2: 'auth / routing',
    desc: 'Handles WebSocket upgrades, authenticates connections, and routes to the correct Chat Server.',
    note: 'Sticky sessions or a connection map ensures each user lands on one server.',
  },
  {
    id: 'chatSvc', label: 'Chat Service', icon: '💬', dir: 'top',
    cx: 340, cy: 100, w: 112, h: 76,
    color: '#8b5cf6', glow: 'rgba(139,92,246,0.65)', lc: '#c4b5fd', strip: 'bg-violet-500',
    sub1: 'stateless', sub2: 'fan-out logic',
    desc: 'Core message handler. Receives messages, assigns IDs, persists to Cassandra, and fans out to recipients.',
    note: 'Stateless — any server can handle any message because state lives in Redis/Cassandra.',
  },
  {
    id: 'sequencer', label: 'ID Generator', icon: '🔢', dir: 'top',
    cx: 340, cy: 210, w: 112, h: 68,
    color: '#a855f7', glow: 'rgba(168,85,247,0.65)', lc: '#d8b4fe', strip: 'bg-purple-500',
    sub1: 'Snowflake', sub2: 'monotonic 64-bit',
    desc: 'Generates globally ordered 64-bit IDs encoding timestamp + machine ID + sequence number.',
    note: 'Never use wall-clock timestamps for message ordering — clocks drift and skew across servers.',
  },
  {
    id: 'presence', label: 'Presence', icon: '📡', dir: 'bottom',
    cx: 340, cy: 310, w: 104, h: 66,
    color: '#7c3aed', glow: 'rgba(124,58,237,0.65)', lc: '#c4b5fd', strip: 'bg-violet-700',
    sub1: 'Redis TTL', sub2: 'heartbeat 5s',
    desc: 'Tracks online/offline status. Maps user_id → {server_id, last_seen} with short TTL.',
    note: 'Presence fan-out for large groups is expensive — cap group sizes or use coarse presence.',
  },
  {
    id: 'cassandra', label: 'Cassandra', icon: '🗄️', dir: 'top',
    cx: 510, cy: 130, w: 112, h: 72,
    color: '#0ea5e9', glow: 'rgba(14,165,233,0.65)', lc: '#7dd3fc', strip: 'bg-sky-500',
    sub1: 'conv_id + msg_id', sub2: 'append-only',
    desc: 'Message store. Partition key = conversation_id, clustering key = message_id (desc). Range scans for history pagination.',
    note: 'Relational DBs cannot handle the write throughput of millions of concurrent conversations.',
  },
  {
    id: 'mq', label: 'Message Queue', icon: '📨', dir: 'top',
    cx: 510, cy: 240, w: 112, h: 68,
    color: '#06b6d4', glow: 'rgba(6,182,212,0.65)', lc: '#67e8f9', strip: 'bg-cyan-500',
    sub1: 'Kafka / Redis', sub2: 'pub-sub',
    desc: 'Decouples the sender\'s Chat Server from the recipient\'s. Each server subscribes to its own channel.',
    note: 'Pub/Sub prevents direct server-to-server calls — the sender does not need to know where the recipient is connected.',
  },
  {
    id: 'pushSvc', label: 'Push Service', icon: '🔔', dir: 'right',
    cx: 672, cy: 230, w: 104, h: 68,
    color: '#f59e0b', glow: 'rgba(245,158,11,0.65)', lc: '#fcd34d', strip: 'bg-amber-500',
    sub1: 'APNs / FCM', sub2: 'offline only',
    desc: 'Delivers push notifications to offline users via Apple APNs (iOS) or Google FCM (Android).',
    note: 'Push carries only a "you have a message" alert — full content is fetched on reconnect to avoid storing sensitive data on provider servers.',
  },
  {
    id: 'userB', label: 'User B', icon: '👥', dir: 'right',
    cx: 672, cy: 115, w: 92, h: 72,
    color: '#10b981', glow: 'rgba(16,185,129,0.65)', lc: '#6ee7b7', strip: 'bg-emerald-500',
    sub1: 'recipient', sub2: 'online / offline',
    desc: 'The message recipient. May be online (WebSocket delivery) or offline (push notification fallback).',
    note: 'On reconnect, the client requests all messages after its last known sequence ID — a full replay, not a summary.',
  },
]

const EDGES = {
  'userA-gateway':      { x1: 102,  y1: 130, x2: 137,  y2: 130, axis: 'h' },
  'gateway-chatSvc':    { x1: 243,  y1: 120, x2: 284,  y2: 108, axis: 'd' },
  'chatSvc-sequencer':  { x1: 340,  y1: 138, x2: 340,  y2: 176, axis: 'v' },
  'chatSvc-cassandra':  { x1: 396,  y1: 115, x2: 454,  y2: 127, axis: 'd' },
  'chatSvc-presence':   { x1: 340,  y1: 138, x2: 340,  y2: 277, axis: 'v' },
  'chatSvc-mq':         { x1: 396,  y1: 128, x2: 454,  y2: 228, axis: 'd' },
  'mq-chatSvc':         { x1: 454,  y1: 244, x2: 396,  y2: 130, axis: 'd' },
  'chatSvc-userB':      { x1: 396,  y1: 100, x2: 626,  y2: 113, axis: 'd' },
  'chatSvc-pushSvc':    { x1: 396,  y1: 120, x2: 620,  y2: 218, axis: 'd' },
  'pushSvc-userB':      { x1: 672,  y1: 196, x2: 672,  y2: 151, axis: 'v' },
  'userB-gateway':      { x1: 626,  y1: 120, x2: 243,  y2: 125, axis: 'd' },
}

const C = {
  request:  { hex: '#8b5cf6', glow: 'rgba(139,92,246,0.85)' },
  response: { hex: '#10b981', glow: 'rgba(16,185,129,0.85)' },
  push:     { hex: '#f59e0b', glow: 'rgba(245,158,11,0.85)' },
  sync:     { hex: '#06b6d4', glow: 'rgba(6,182,212,0.85)' },
}

const DIR_MAP = {
  request:  { fwd: C.request,  bwd: null },
  response: { fwd: C.response, bwd: null },
  both:     { fwd: C.request,  bwd: C.response },
  push:     { fwd: C.push,     bwd: null },
  sync:     { fwd: C.sync,     bwd: null },
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

export default function ChatSystemDiagram() {
  const steps  = useMemo(() => buildChatSystemSteps(), [])
  const runner = useStepRunner(steps)
  const { step, index } = runner

  const [expandedNode, setExpandedNode] = useState(null)

  const visitedNodes = useMemo(() => {
    const s = new Set()
    for (let i = 0; i <= index; i++) steps[i].activeNodes.forEach((id) => s.add(id))
    return s
  }, [steps, index])

  const showOfflineBanner = step.type === 'offline-push'
  const showGroupBanner   = step.type === 'group-fanout'

  return (
    <div className="space-y-4">

      <div>
        <h2 className="text-lg font-semibold text-white">Chat System Architecture</h2>
        <p className="text-sm text-slate-400">
          From WebSocket connection to message delivery — trace every hop including offline fallback and group fan-out.
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
                {/* Section labels */}
                <text x={14} y={20} style={{ fill: '#4c1d95', fontSize: 8, fontFamily: 'monospace', fontWeight: 700, opacity: 0.7 }}>CLIENTS</text>
                <text x={148} y={20} style={{ fill: '#3730a3', fontSize: 8, fontFamily: 'monospace', fontWeight: 700, opacity: 0.7 }}>GATEWAY</text>
                <text x={292} y={20} style={{ fill: '#6d28d9', fontSize: 8, fontFamily: 'monospace', fontWeight: 700, opacity: 0.7 }}>CHAT SERVICES</text>
                <text x={456} y={20} style={{ fill: '#0c4a6e', fontSize: 8, fontFamily: 'monospace', fontWeight: 700, opacity: 0.7 }}>STORAGE / QUEUE</text>
                <text x={634} y={20} style={{ fill: '#064e3b', fontSize: 8, fontFamily: 'monospace', fontWeight: 700, opacity: 0.7 }}>DELIVERY</text>
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
              {showOfflineBanner && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                  className="relative mt-3 flex items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-500/[0.07] px-4 py-3"
                >
                  <span className="text-xl select-none">🔔</span>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Offline Fallback Active</p>
                    <p className="text-sm text-white">User B has no WebSocket connection — push notification dispatched to APNs/FCM. Full message delivered on reconnect.</p>
                  </div>
                </motion.div>
              )}
              {showGroupBanner && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                  className="relative mt-3 flex items-center gap-3 rounded-xl border border-violet-500/40 bg-violet-500/[0.07] px-4 py-3"
                >
                  <span className="text-xl select-none">👥</span>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-violet-400">Group Fan-Out</p>
                    <p className="text-sm text-white">One message → N presence lookups → N queue writes. Fan-out cost grows linearly with group size — this is why large groups have member caps.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-5 mt-3 px-1 flex-wrap">
          {[
            { color: C.request.hex,  glow: C.request.glow,  label: 'request / send' },
            { color: C.response.hex, glow: C.response.glow, label: 'delivery / response' },
            { color: C.push.hex,     glow: C.push.glow,     label: 'push notification' },
            { color: C.sync.hex,     glow: C.sync.glow,     label: 'sync / queue' },
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
