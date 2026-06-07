import { useMemo, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { buildWebsocketsSteps } from './steps'
import { useStepRunner } from '../../../../hooks/useStepRunner'
import StepControls from '../../../../components/ui/StepControls'

const CW = 620
const CH = 290

const NODES = [
  {
    id: 'client', label: 'Client', icon: '🖥️', dir: 'left',
    cx: 80, cy: 145, w: 110, h: 84,
    color: '#8b5cf6', glow: 'rgba(139,92,246,0.65)', lc: '#c4b5fd', strip: 'bg-violet-500',
    sub1: 'WebSocket API', sub2: 'browser / native app',
    desc: 'The WebSocket client. Initiates the HTTP upgrade request. After the upgrade, uses ws.send() to send frames and ws.onmessage to receive them.',
    note: 'ws.onclose triggers on disconnect. Implement exponential backoff reconnection logic here to avoid thundering herds on server restarts.',
  },
  {
    id: 'channel', label: 'WS Channel', icon: '⚡', dir: 'top',
    cx: 310, cy: 145, w: 140, h: 88,
    color: '#f59e0b', glow: 'rgba(245,158,11,0.65)', lc: '#fcd34d', strip: 'bg-amber-500',
    sub1: 'persistent TCP conn', sub2: 'full-duplex frames',
    desc: 'The WebSocket channel reuses the underlying TCP connection established during the HTTP handshake. Frames are lightweight — 2-byte header minimum.',
    note: 'The channel is persistent: no HTTP overhead per message. Binary or text frames. Both sides can write without waiting for the other.',
  },
  {
    id: 'server', label: 'Server', icon: '🖧', dir: 'top',
    cx: 540, cy: 145, w: 110, h: 84,
    color: '#0ea5e9', glow: 'rgba(14,165,233,0.65)', lc: '#7dd3fc', strip: 'bg-sky-500',
    sub1: 'push events', sub2: 'connection registry',
    desc: 'The WebSocket server maintains an in-memory map of open connections. On any event (new message, DB change, timer), it pushes to the relevant connections.',
    note: 'Each connection is stateful memory. Horizontal scaling requires sticky sessions or a shared pub/sub layer (Redis) to route cross-node messages.',
  },
]

const EDGES = {
  'client-channel':  { x1: 135, y1: 145, x2: 240, y2: 145, axis: 'h' },
  'channel-server':  { x1: 380, y1: 145, x2: 485, y2: 145, axis: 'h' },
}

const C = {
  violet:  { hex: '#8b5cf6', glow: 'rgba(139,92,246,0.85)' },
  amber:   { hex: '#f59e0b', glow: 'rgba(245,158,11,0.85)' },
  sky:     { hex: '#0ea5e9', glow: 'rgba(14,165,233,0.85)' },
  emerald: { hex: '#10b981', glow: 'rgba(16,185,129,0.85)' },
  red:     { hex: '#f43f5e', glow: 'rgba(244,63,94,0.85)'  },
}

const DIR_MAP = {
  request:    { fwd: C.violet,  bwd: null       },
  both:       { fwd: C.violet,  bwd: C.emerald  },
  response:   { fwd: C.emerald, bwd: null       },
}

const CONNECTION_COLORS = {
  upgrading:    { color: '#f59e0b', label: 'HTTP 101 Upgrading…'   },
  open:         { color: '#10b981', label: 'Connection Open ●'     },
  reconnecting: { color: '#f43f5e', label: 'Reconnecting…'         },
}

function EdgeConnection({ edgeId, connections, stepKey, connectionState }) {
  const edge = EDGES[edgeId]
  const dir  = connections[edgeId]
  const map  = DIR_MAP[dir]

  const { x1, y1, x2, y2 } = edge
  const fwdC    = map?.fwd ?? null
  const bwdC    = map?.bwd ?? null
  const isActive = !!map

  const isOpen = connectionState === 'open'
  const lineColor = isActive ? (fwdC?.hex ?? '#1e293b')
                  : isOpen   ? '#10b98140'
                  : '#182030'

  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={lineColor}
        strokeWidth={isActive ? 2 : isOpen ? 1.5 : 1}
        strokeDasharray={isActive || isOpen ? 'none' : '5 4'}
        style={{ filter: isActive && fwdC ? `drop-shadow(0 0 5px ${fwdC.glow})` : 'none', transition: 'all 0.3s' }}
      />
      {fwdC && [0, 1, 2].map((p) => (
        <motion.circle key={`${stepKey}-${edgeId}-f${p}`} r={3.5} fill={fwdC.hex}
          style={{ filter: `drop-shadow(0 0 5px ${fwdC.glow})` }}
          animate={{ cx: [x1, x2], cy: y1 }}
          transition={{ duration: 0.5, delay: p * 0.16, ease: 'linear', repeat: Infinity, repeatDelay: 0.1 }}
        />
      ))}
      {bwdC && [0, 1, 2].map((p) => (
        <motion.circle key={`${stepKey}-${edgeId}-b${p}`} r={3.5} fill={bwdC.hex}
          style={{ filter: `drop-shadow(0 0 5px ${bwdC.glow})` }}
          animate={{ cx: [x2, x1], cy: y1 }}
          transition={{ duration: 0.5, delay: p * 0.16, ease: 'linear', repeat: Infinity, repeatDelay: 0.1 }}
        />
      ))}
    </g>
  )
}

function NodeBlock({ node, isActive, wasVisited, isExpanded, onClick, popKey, connectionState, pingState }) {
  const { cx, cy, w, h } = node
  const isPinging = node.id === 'channel' && pingState === 'pinging'

  const borderColor = isActive   ? node.color
                    : isPinging  ? '#10b981'
                    : wasVisited ? `${node.color}38`
                    : 'rgba(255,255,255,0.08)'

  return (
    <div className="absolute" style={{ left: cx - w / 2, top: cy - h / 2, width: w, height: h }}>
      <motion.button
        onClick={onClick}
        className="relative w-full h-full rounded-xl border-2 overflow-hidden flex flex-col items-center justify-center gap-0.5 px-1 cursor-pointer focus:outline-none"
        animate={{
          borderColor,
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

        <AnimatePresence>
          {isPinging && (
            <motion.span
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: [1, 0.5, 1], scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="absolute top-1 right-1 text-[8px] font-bold font-mono text-emerald-400 bg-emerald-400/10 border border-emerald-400/30 rounded px-1"
            >
              PING
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

export default function WebsocketsDiagram({ onStepChange }) {
  const steps  = useMemo(() => buildWebsocketsSteps(), [])
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

  const connInfo = step.connectionState ? CONNECTION_COLORS[step.connectionState] : null

  return (
    <div className="space-y-4">

      <div>
        <h2 className="text-lg font-semibold text-white">WebSockets — Persistent Bidirectional Connections</h2>
        <p className="text-sm text-slate-400">
          Watch the HTTP upgrade handshake, persistent channel, server push, heartbeat, and reconnect flow.
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
        {/* Connection state badge */}
        <AnimatePresence mode="wait">
          {connInfo && (
            <motion.div
              key={step.connectionState}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 mb-3"
            >
              <motion.span
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.4, repeat: Infinity }}
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: connInfo.color }}
              />
              <span className="text-[10px] font-mono font-semibold" style={{ color: connInfo.color }}>
                {connInfo.label}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="overflow-x-auto pb-2">
          <div className="relative mx-auto" style={{ width: CW, height: CH }}>

            <svg className="absolute inset-0 pointer-events-none overflow-visible"
              viewBox={`0 0 ${CW} ${CH}`} width={CW} height={CH}>
              {Object.keys(EDGES).map((edgeId) => (
                <EdgeConnection
                  key={edgeId}
                  edgeId={edgeId}
                  connections={step.connections}
                  stepKey={index}
                  connectionState={step.connectionState}
                />
              ))}
              <text x={148} y={132} style={{ fill: '#8b5cf685', fontSize: 9, fontFamily: 'ui-monospace,monospace', fontWeight: 600 }}>
                WS frames
              </text>
              <text x={392} y={132} style={{ fill: '#0ea5e985', fontSize: 9, fontFamily: 'ui-monospace,monospace', fontWeight: 600 }}>
                WS frames
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
                popKey={popKeys[node.id] ?? null}
                connectionState={step.connectionState}
                pingState={step.pingState}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-5 mt-1 px-1 flex-wrap">
          {[
            { color: C.violet.hex,  glow: C.violet.glow,  label: 'client → server frame' },
            { color: C.emerald.hex, glow: C.emerald.glow, label: 'server → client push'  },
            { color: C.amber.hex,   glow: C.amber.glow,   label: 'persistent channel'    },
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
