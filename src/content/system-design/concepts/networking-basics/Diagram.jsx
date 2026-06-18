import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { buildNetworkingBasicsSteps } from './steps'
import { useTtsRunner } from '../../../../hooks/useTtsRunner'
import StepControls from '../../../../components/ui/StepControls'

// ── Color palette ─────────────────────────────────────────────────────────────

const COLORS = {
  client:   { hex: '#0ea5e9', glow: 'rgba(14,165,233,0.6)',  strip: 'bg-sky-500',     label: '#38bdf8' },
  'router-a': { hex: '#8b5cf6', glow: 'rgba(139,92,246,0.6)', strip: 'bg-violet-500',  label: '#c4b5fd' },
  'router-b': { hex: '#f59e0b', glow: 'rgba(245,158,11,0.6)', strip: 'bg-amber-500',   label: '#fcd34d' },
  server:   { hex: '#10b981', glow: 'rgba(16,185,129,0.6)', strip: 'bg-emerald-500', label: '#6ee7b7' },
}

const DIR = {
  forward:  { hex: '#6366f1', glow: 'rgba(99,102,241,0.75)' },
  backward: { hex: '#10b981', glow: 'rgba(16,185,129,0.75)' },
}

// ── Nodes ─────────────────────────────────────────────────────────────────────

const NODES = [
  {
    id:      'client',
    label:   'Your Machine',
    icon:    '💻',
    sub:     '10.0.0.1',
    desc:    'Originates the request. Assigns source IP, ephemeral source port, and builds the packet header with TTL=64.',
    example: 'Port 51234 (ephemeral)',
  },
  {
    id:      'router-a',
    label:   'Default Gateway',
    icon:    '📡',
    sub:     'ISP Edge Router',
    desc:    'Your home router or ISP\'s first hop. Consults routing table, decrements TTL, and forwards to the next hop toward the destination.',
    example: 'traceroute hop 1',
  },
  {
    id:      'router-b',
    label:   'Backbone Router',
    icon:    '🌐',
    sub:     'BGP peer',
    desc:    'High-capacity backbone infrastructure. Uses BGP-learned routes to forward packets across autonomous systems at line rate.',
    example: 'traceroute hop 2',
  },
  {
    id:      'server',
    label:   'Server',
    icon:    '🖥️',
    sub:     '142.250.80.46',
    desc:    'Destination host. OS inspects destination port and delivers the packet to the correct listening process (HTTPS on 443).',
    example: 'Port 443 (HTTPS)',
  },
]

// ── Edge arrow ────────────────────────────────────────────────────────────────

const EDGE_W = 56

function EdgeArrow({ edgeIndex, activeEdges, edgeDirection, stepKey }) {
  const isActive  = activeEdges.includes(edgeIndex)
  const segOrder  = isActive ? activeEdges.indexOf(edgeIndex) : 0
  const dir       = isActive && edgeDirection ? DIR[edgeDirection] : null
  const isForward = edgeDirection === 'forward'

  return (
    <div className="relative flex items-center shrink-0 h-20" style={{ width: EDGE_W }}>
      <motion.div
        className="absolute top-1/2 -translate-y-1/2 left-0 right-0 rounded-full"
        animate={{
          height:          isActive ? '2px' : '1px',
          backgroundColor: dir ? dir.hex : '#1e293b',
          boxShadow:       dir ? `0 0 10px 3px ${dir.glow}` : 'none',
        }}
        transition={{ duration: 0.3 }}
      />

      <motion.svg
        className="absolute right-0 top-1/2 -translate-y-1/2"
        width="8" height="14" viewBox="0 0 8 14"
        animate={{ opacity: isActive ? 1 : 0.2 }}
        transition={{ duration: 0.3 }}
      >
        <polygon points="0,0 8,7 0,14" fill={dir ? dir.hex : '#334155'} />
      </motion.svg>

      {isActive && dir && [0, 1, 2].map((p) => (
        <motion.div
          key={`${stepKey}-${edgeIndex}-p${p}`}
          className="absolute top-1/2 -translate-y-1/2 rounded-full pointer-events-none"
          style={{ width: 6, height: 6, left: 0, background: dir.hex, boxShadow: `0 0 8px 3px ${dir.glow}` }}
          animate={{ x: isForward ? [0, EDGE_W - 10] : [EDGE_W - 10, 0] }}
          transition={{
            duration:    0.65,
            delay:       segOrder * 0.2 + p * 0.17,
            ease:        'easeInOut',
            repeat:      Infinity,
            repeatDelay: 0.25,
          }}
        />
      ))}
    </div>
  )
}

// ── Node card ─────────────────────────────────────────────────────────────────

function NodeCard({ node, isActive, wasVisited, isExpanded, onClick, popKey }) {
  const c = COLORS[node.id]
  return (
    <div className="relative flex flex-col items-center">
      <motion.button
        onClick={onClick}
        animate={{
          borderColor:     isActive ? c.hex : wasVisited ? `${c.hex}45` : 'rgba(255,255,255,0.08)',
          backgroundColor: isActive ? `${c.hex}18` : wasVisited ? `${c.hex}08` : 'rgb(15,23,42)',
          boxShadow:       isActive ? `0 0 32px -4px ${c.glow}` : 'none',
        }}
        transition={{ duration: 0.28 }}
        className="relative flex flex-col items-center gap-1.5 rounded-2xl border-2 overflow-hidden px-2.5 py-3 w-24 sm:w-28 cursor-pointer focus:outline-none"
      >
        <motion.div
          className={`absolute top-0 left-0 right-0 h-1 ${c.strip}`}
          animate={{ opacity: isActive ? 1 : wasVisited ? 0.5 : 0.18 }}
          transition={{ duration: 0.3 }}
        />

        {[0, 1, 2].map((i) => (
          <motion.div
            key={`${popKey ?? 'init'}-ripple-${i}`}
            className="absolute inset-0 rounded-xl border-2 pointer-events-none"
            style={{ borderColor: c.hex }}
            initial={{ scale: 1, opacity: popKey != null ? 0.75 : 0 }}
            animate={{ scale: 2.4 + i * 0.45, opacity: 0 }}
            transition={{ duration: 0.75, delay: i * 0.14, ease: 'easeOut' }}
          />
        ))}

        <motion.span
          key={`icon-${popKey ?? 'init'}`}
          animate={popKey != null ? { scale: [1, 1.35, 0.85, 1.1, 1] } : { scale: 1 }}
          transition={{ type: 'spring', stiffness: 430, damping: 13 }}
          className="text-2xl leading-none mt-0.5 select-none"
        >
          {node.icon}
        </motion.span>

        <motion.span
          animate={{ color: isActive ? c.label : wasVisited ? '#94a3b8' : '#475569' }}
          transition={{ duration: 0.3 }}
          className="text-[10px] sm:text-[11px] font-semibold text-center leading-tight"
        >
          {node.label}
        </motion.span>

        <motion.span
          animate={{ color: isActive ? c.hex : '#1e293b' }}
          className="text-[9px] font-mono text-center leading-tight"
        >
          {node.sub}
        </motion.span>

        <span className="text-[8px] text-slate-700">tap for info</span>
      </motion.button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            className="absolute top-full mt-2 w-52 z-30 rounded-xl border bg-slate-900/95 backdrop-blur shadow-2xl p-3 space-y-1.5"
            style={{ borderColor: `${c.hex}45` }}
          >
            <p className="text-[11px] font-bold" style={{ color: c.label }}>{node.label}</p>
            <p className="text-[10px] text-slate-400 leading-relaxed">{node.desc}</p>
            <p className="text-[10px] font-mono" style={{ color: c.hex }}>{node.example}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Packet header display ─────────────────────────────────────────────────────

function RttMeter({ elapsedMs, color }) {
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={elapsedMs}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.2 }}
        className="text-[10px] font-mono font-bold"
        style={{ color }}
      >
        ⏱ {elapsedMs} ms
      </motion.span>
    </AnimatePresence>
  )
}

function PacketHeader({ packet, direction, elapsedMs }) {
  const [prevTtl, setPrevTtl] = useState(null)
  const ttlChanged = packet && prevTtl !== null && prevTtl !== packet.ttl
  if (packet && prevTtl !== packet.ttl) setPrevTtl(packet.ttl)

  if (!packet) {
    return (
      <div className="flex items-center justify-center h-16 rounded-xl border border-white/[0.06] bg-white/[0.02]">
        <p className="text-[10px] text-slate-600 font-mono">packet will appear here</p>
      </div>
    )
  }

  const dirClr = direction ? DIR[direction] : { hex: '#334155', glow: 'none' }

  return (
    <motion.div
      layout
      className="rounded-xl border px-4 py-3 font-mono"
      animate={{
        borderColor:     `${dirClr.hex}50`,
        backgroundColor: `${dirClr.hex}08`,
      }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <motion.div
            className="w-2 h-2 rounded-full"
            animate={{ backgroundColor: dirClr.hex, boxShadow: `0 0 6px 1px ${dirClr.glow}` }}
          />
          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: dirClr.hex }}>
            {direction === 'backward' ? 'Response Packet' : 'Request Packet'} — IP header
          </span>
        </div>
        {elapsedMs != null && <RttMeter elapsedMs={elapsedMs} color={dirClr.hex} />}
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-1">
        <Field label="SRC IP"   value={packet.srcIp}               color={dirClr.hex} />
        <Field label="DST IP"   value={packet.dstIp}               color={dirClr.hex} />
        <Field label="SRC PORT" value={String(packet.srcPort)}     color={dirClr.hex} />
        <Field label="DST PORT" value={String(packet.dstPort)}     color={dirClr.hex} />
        <TtlField ttl={packet.ttl} color={dirClr.hex} flash={ttlChanged} />
        <Field label="PROTOCOL" value="TCP"                         color={dirClr.hex} />
      </div>
    </motion.div>
  )
}

function Field({ label, value, color }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[8px] text-slate-600 uppercase tracking-wider shrink-0">{label}</span>
      <span className="text-[10px] font-semibold truncate" style={{ color }}>{value}</span>
    </div>
  )
}

function TtlField({ ttl, color, flash }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[8px] text-slate-600 uppercase tracking-wider shrink-0">TTL</span>
      <AnimatePresence mode="wait">
        <motion.span
          key={ttl}
          initial={flash ? { scale: 1.6, color: '#f43f5e' } : { scale: 1 }}
          animate={{ scale: 1, color }}
          transition={{ type: 'spring', stiffness: 400, damping: 16 }}
          className="text-[10px] font-bold"
        >
          {ttl}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function NetworkingBasicsDiagram() {
  const steps  = useMemo(() => buildNetworkingBasicsSteps(), [])
  const runner = useTtsRunner(steps, (s) => `${s.message}. ${s.detail}`)
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
        <h2 className="text-lg font-semibold text-white">Packet Routing</h2>
        <p className="text-sm text-slate-400">
          Trace a request from your machine through two routers to a server, then watch the response return.
        </p>
      </div>

      <div
        className="rounded-2xl border border-white/10 p-4 sm:p-6 space-y-5"
        style={{
          background:      '#070d1f',
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.065) 1px, transparent 1px)',
          backgroundSize:  '22px 22px',
        }}
      >
        {/* Packet header */}
        <PacketHeader packet={step.packet} direction={step.edgeDirection} elapsedMs={step.elapsedMs} />

        {/* Node chain */}
        <div className="overflow-x-auto pb-2">
          <div className="flex items-center gap-0 min-w-max mx-auto">
            {NODES.map((node, i) => (
              <div key={node.id} className="flex items-center">
                <NodeCard
                  node={node}
                  isActive={step.activeNodes.includes(node.id)}
                  wasVisited={visitedNodes.has(node.id) && !step.activeNodes.includes(node.id)}
                  isExpanded={expandedNode === node.id}
                  onClick={() => setExpandedNode((p) => p === node.id ? null : node.id)}
                  popKey={step.activeNodes.includes(node.id) ? index : null}
                />
                {i < NODES.length - 1 && (
                  <EdgeArrow
                    edgeIndex={i}
                    activeEdges={step.activeEdges}
                    edgeDirection={step.edgeDirection}
                    stepKey={index}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 px-1 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-8 h-px rounded-full" style={{ background: DIR.forward.hex, boxShadow: `0 0 5px 1px ${DIR.forward.glow}` }} />
          <span className="text-[10px] text-slate-500">Request (forward)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-px rounded-full" style={{ background: DIR.backward.hex, boxShadow: `0 0 5px 1px ${DIR.backward.glow}` }} />
          <span className="text-[10px] text-slate-500">Response (backward)</span>
        </div>
        <span className="text-[10px] text-slate-600 ml-auto hidden sm:inline">tap any node for details</span>
      </div>

      {/* Step message */}
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

      {/* Total RTT, shown once the response arrives */}
      {index === steps.length - 1 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] px-5 py-3 flex items-center justify-between"
        >
          <span className="text-xs font-semibold text-emerald-300">Total round-trip time (latency)</span>
          <span className="text-sm font-mono font-bold text-emerald-300">{step.elapsedMs} ms</span>
        </motion.div>
      )}

      <StepControls runner={runner} />
    </div>
  )
}
