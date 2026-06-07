import { useMemo, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { buildTcpAndUdpSteps } from './steps'
import { useStepRunner } from '../../../../hooks/useStepRunner'
import StepControls from '../../../../components/ui/StepControls'

const CW = 620
const CH = 290

const NODES = [
  {
    id: 'sender', label: 'Sender', icon: '🖥️', dir: 'left',
    cx: 80, cy: 145, w: 110, h: 82,
    color: '#8b5cf6', glow: 'rgba(139,92,246,0.65)', lc: '#c4b5fd', strip: 'bg-violet-500',
    sub1: 'initiates connection', sub2: 'client / source',
    desc: 'The initiating side of the connection. In TCP, it sends the first SYN. In UDP, it fires datagrams immediately with no setup.',
    note: 'In TCP, the sender tracks unacknowledged segments and retransmits on timeout. In UDP, lost packets are simply gone.',
  },
  {
    id: 'network', label: 'Network', icon: '☁️', dir: 'top',
    cx: 310, cy: 145, w: 140, h: 88,
    color: '#64748b', glow: 'rgba(100,116,139,0.65)', lc: '#94a3b8', strip: 'bg-slate-500',
    sub1: 'IP routing', sub2: 'best-effort delivery',
    desc: 'The IP layer routes packets independently. Packets can arrive out of order, be duplicated, or be dropped. TCP fixes this; UDP accepts it.',
    note: 'IP provides no delivery guarantees — it is a best-effort service. All reliability must be implemented at the transport layer (TCP) or application layer (QUIC).',
  },
  {
    id: 'receiver', label: 'Receiver', icon: '📻', dir: 'top',
    cx: 540, cy: 145, w: 110, h: 82,
    color: '#0ea5e9', glow: 'rgba(14,165,233,0.65)', lc: '#7dd3fc', strip: 'bg-sky-500',
    sub1: 'accepts connections', sub2: 'server / destination',
    desc: 'The receiving side. In TCP, it sends SYN-ACK during the handshake and buffers out-of-order segments for ordered delivery.',
    note: 'TCP receive window advertises how much buffer space the receiver has — this is how flow control prevents the sender from overwhelming a slow receiver.',
  },
]

const EDGES = {
  'sender-network':  { x1: 135, y1: 145, x2: 240, y2: 145, axis: 'h' },
  'network-receiver':{ x1: 380, y1: 145, x2: 485, y2: 145, axis: 'h' },
}

const C = {
  violet:  { hex: '#8b5cf6', glow: 'rgba(139,92,246,0.85)' },
  sky:     { hex: '#0ea5e9', glow: 'rgba(14,165,233,0.85)' },
  emerald: { hex: '#10b981', glow: 'rgba(16,185,129,0.85)' },
  amber:   { hex: '#f59e0b', glow: 'rgba(245,158,11,0.85)' },
  red:     { hex: '#f43f5e', glow: 'rgba(244,63,94,0.85)'  },
  slate:   { hex: '#64748b', glow: 'rgba(100,116,139,0.85)' },
}

const DIR_MAP = {
  request:  { fwd: C.violet,  bwd: null       },
  both:     { fwd: C.violet,  bwd: C.emerald  },
  response: { fwd: C.emerald, bwd: null       },
}

const HANDSHAKE_LABELS = {
  syn:         { color: '#f59e0b', text: 'SYN →',            sub: 'seq=0' },
  'syn-ack':   { color: '#0ea5e9', text: '← SYN-ACK',        sub: 'ack=1 seq=0' },
  established: { color: '#10b981', text: 'ACK → ESTABLISHED', sub: '3-way complete' },
  closing:     { color: '#f43f5e', text: 'FIN → teardown',    sub: '4-way close' },
}

function EdgeConnection({ edgeId, connections, stepKey }) {
  const edge = EDGES[edgeId]
  const dir  = connections[edgeId]
  const map  = DIR_MAP[dir]

  const { x1, y1, x2, y2 } = edge
  const fwdC    = map?.fwd ?? null
  const bwdC    = map?.bwd ?? null
  const isActive = !!map

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

function NodeBlock({ node, isActive, wasVisited, isExpanded, onClick, popKey, protocolMode }) {
  const { cx, cy, w, h } = node
  const isUdpMode = protocolMode === 'udp'

  const borderColor = isActive   ? node.color
                    : isUdpMode && node.id === 'network' ? '#f59e0b'
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

export default function TcpAndUdpDiagram({ onStepChange }) {
  const steps  = useMemo(() => buildTcpAndUdpSteps(), [])
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

  const hs = step.handshakeState ? HANDSHAKE_LABELS[step.handshakeState] : null
  const isUdp = step.protocolMode === 'udp'

  return (
    <div className="space-y-4">

      <div>
        <h2 className="text-lg font-semibold text-white">TCP and UDP — Transport Layer Protocols</h2>
        <p className="text-sm text-slate-400">
          Watch the TCP 3-way handshake, flow control, and teardown. Then compare with UDP's zero-overhead fire-and-forget model.
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
        {/* Protocol mode badge */}
        <div className="flex items-center gap-2 mb-3">
          <motion.span
            animate={{
              color:       isUdp ? '#f59e0b' : '#8b5cf6',
              borderColor: isUdp ? 'rgba(245,158,11,0.4)' : 'rgba(139,92,246,0.4)',
              background:  isUdp ? 'rgba(245,158,11,0.08)' : 'rgba(139,92,246,0.08)',
            }}
            transition={{ duration: 0.3 }}
            className="rounded-full border px-3 py-0.5 text-[10px] font-bold font-mono"
          >
            {isUdp ? 'UDP MODE' : 'TCP MODE'}
          </motion.span>
          {hs && (
            <motion.span
              key={hs.text}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-[10px] font-mono"
              style={{ color: hs.color }}
            >
              {hs.text} <span className="opacity-60">{hs.sub}</span>
            </motion.span>
          )}
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="relative mx-auto" style={{ width: CW, height: CH }}>

            <svg className="absolute inset-0 pointer-events-none overflow-visible"
              viewBox={`0 0 ${CW} ${CH}`} width={CW} height={CH}>
              {Object.keys(EDGES).map((edgeId) => (
                <EdgeConnection key={edgeId} edgeId={edgeId} connections={step.connections} stepKey={index} />
              ))}
              <text x={148} y={132} style={{ fill: '#8b5cf685', fontSize: 9, fontFamily: 'ui-monospace,monospace', fontWeight: 600 }}>
                {isUdp ? 'datagram (no ack)' : 'segments + ACK'}
              </text>
              <text x={390} y={132} style={{ fill: '#0ea5e985', fontSize: 9, fontFamily: 'ui-monospace,monospace', fontWeight: 600 }}>
                {isUdp ? 'datagram (no ack)' : 'ordered delivery'}
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
                protocolMode={step.protocolMode}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-5 mt-1 px-1 flex-wrap">
          {[
            { color: C.violet.hex,  glow: C.violet.glow,  label: isUdp ? 'datagram (no setup)' : 'TCP segment / SYN' },
            { color: C.emerald.hex, glow: C.emerald.glow, label: isUdp ? 'received (no ACK)'   : 'ACK / response'    },
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
