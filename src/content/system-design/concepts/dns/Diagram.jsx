import { useMemo, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { buildDnsSteps } from './steps'
import { useStepRunner } from '../../../../hooks/useStepRunner'
import StepControls from '../../../../components/ui/StepControls'

// ── Color palette per node ────────────────────────────────────────────────────

const COLORS = {
  browser:  { hex: '#0ea5e9', glow: 'rgba(14,165,233,0.6)',   strip: 'bg-sky-500',      label: '#38bdf8' },
  resolver: { hex: '#8b5cf6', glow: 'rgba(139,92,246,0.6)',   strip: 'bg-violet-500',   label: '#a78bfa' },
  root:     { hex: '#f59e0b', glow: 'rgba(245,158,11,0.6)',   strip: 'bg-amber-500',    label: '#fbbf24' },
  tld:      { hex: '#f43f5e', glow: 'rgba(244,63,94,0.6)',    strip: 'bg-rose-500',     label: '#fb7185' },
  auth:     { hex: '#10b981', glow: 'rgba(16,185,129,0.6)',   strip: 'bg-emerald-500',  label: '#34d399' },
}

// Query = violet (forward), Response = emerald (backward)
const DIR = {
  forward:  { hex: '#8b5cf6', glow: 'rgba(139,92,246,0.75)' },
  backward: { hex: '#10b981', glow: 'rgba(16,185,129,0.75)' },
}

// ── Node definitions ──────────────────────────────────────────────────────────

const NODES = [
  {
    id:      'browser',
    label:   'Browser',
    icon:    '🌐',
    desc:    'Your browser (Chrome, Firefox…) initiates the DNS query. It checks its own short-lived in-memory cache first before asking the OS.',
    example: 'Cache TTL: ~60 s',
  },
  {
    id:      'resolver',
    label:   'Recursive Resolver',
    icon:    '🔄',
    desc:    "Your ISP's DNS server, or a public resolver like 8.8.8.8 (Google) or 1.1.1.1 (Cloudflare). It does all the recursive work on your behalf.",
    example: '8.8.8.8 (Google DNS)',
  },
  {
    id:      'root',
    label:   'Root Nameserver',
    icon:    '🌳',
    desc:    '13 sets of root servers (A–M) distributed globally via anycast. They know the address of every TLD nameserver but not individual domain records.',
    example: 'a.root-servers.net',
  },
  {
    id:      'tld',
    label:   '.com TLD NS',
    icon:    '📋',
    desc:    'Top-Level Domain nameservers manage all domains under .com, .org, .net… They know which authoritative nameservers each registrant has configured.',
    example: 'a.gtld-servers.net',
  },
  {
    id:      'auth',
    label:   'Auth. Nameserver',
    icon:    '🏠',
    desc:    'The final authority for a domain. Holds the actual DNS records (A, AAAA, CNAME, MX…). For google.com these are ns1–ns4.google.com.',
    example: 'ns1.google.com',
  },
]

// ── Edge arrow ────────────────────────────────────────────────────────────────

const EDGE_W = 52  // px — matches w-[52px] below

function EdgeArrow({ edgeIndex, activeEdges, edgeDirection, stepKey }) {
  const isActive  = activeEdges.includes(edgeIndex)
  const segOrder  = isActive ? activeEdges.indexOf(edgeIndex) : 0
  const dir       = isActive && edgeDirection ? DIR[edgeDirection] : null
  const isForward = edgeDirection === 'forward'

  return (
    <div className="relative flex items-center shrink-0 h-20" style={{ width: EDGE_W }}>

      {/* Glowing line */}
      <motion.div
        className="absolute top-1/2 -translate-y-1/2 left-0 right-0 rounded-full"
        animate={{
          height:          isActive ? '2px' : '1px',
          backgroundColor: dir ? dir.hex : '#1e293b',
          boxShadow:       dir ? `0 0 10px 3px ${dir.glow}` : 'none',
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Arrow head (always points right — direction shown by particle travel) */}
      <motion.svg
        className="absolute right-0 top-1/2 -translate-y-1/2"
        width="8" height="14" viewBox="0 0 8 14"
        animate={{ opacity: isActive ? 1 : 0.2 }}
        transition={{ duration: 0.3 }}
      >
        <polygon points="0,0 8,7 0,14" fill={dir ? dir.hex : '#334155'} />
      </motion.svg>

      {/* 3 staggered streaming particles */}
      {isActive && dir && [0, 1, 2].map((p) => (
        <motion.div
          key={`${stepKey}-${edgeIndex}-p${p}`}
          className="absolute top-1/2 -translate-y-1/2 rounded-full pointer-events-none"
          style={{
            width: 6,
            height: 6,
            left: 0,
            background: dir.hex,
            boxShadow: `0 0 8px 3px ${dir.glow}`,
          }}
          animate={{ x: isForward ? [0, EDGE_W - 10] : [EDGE_W - 10, 0] }}
          transition={{
            duration: 0.65,
            delay: segOrder * 0.2 + p * 0.17,
            ease: 'easeInOut',
            repeat: Infinity,
            repeatDelay: 0.25,
          }}
        />
      ))}
    </div>
  )
}

// ── Node card ─────────────────────────────────────────────────────────────────

function NodeCard({ node, isActive, wasVisited, isExpanded, onClick, revealedIp, popKey, stampText }) {
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
        {/* Top colour strip */}
        <motion.div
          className={`absolute top-0 left-0 right-0 h-1 ${c.strip}`}
          animate={{ opacity: isActive ? 1 : wasVisited ? 0.5 : 0.18 }}
          transition={{ duration: 0.3 }}
        />

        {/* Ripple burst — fires on each activation */}
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

        {/* Icon — bounces on each activation */}
        <motion.span
          key={`icon-${popKey ?? 'init'}`}
          animate={popKey != null ? { scale: [1, 1.35, 0.85, 1.1, 1] } : { scale: 1 }}
          transition={{ type: 'spring', stiffness: 430, damping: 13 }}
          className="text-2xl leading-none mt-0.5 select-none"
        >
          {node.icon}
        </motion.span>

        {/* Label */}
        <motion.span
          animate={{ color: isActive ? c.label : wasVisited ? '#94a3b8' : '#475569' }}
          transition={{ duration: 0.3 }}
          className="text-[10px] sm:text-[11px] font-semibold text-center leading-tight"
        >
          {node.label}
        </motion.span>

        {/* IP badge on browser */}
        <AnimatePresence>
          {revealedIp && (
            <motion.span
              initial={{ scale: 0.3, opacity: 0, y: 4 }}
              animate={{ scale: [0.3, 1.45, 0.9, 1.05, 1], opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 380, damping: 15 }}
              className="text-[8px] font-mono font-bold text-emerald-300 bg-emerald-400/10 border border-emerald-400/35 rounded-md px-1.5 py-0.5 leading-none"
            >
              {revealedIp}
            </motion.span>
          )}
        </AnimatePresence>

        <span className="text-[9px] text-slate-600 mt-0.5">tap for info</span>

        {/* Stamp overlay (FOUND / CONNECTED) */}
        <AnimatePresence>
          {stampText && (
            <motion.div
              key={stampText}
              initial={{ scale: 0.25, opacity: 0, rotate: -20 }}
              animate={{
                scale:   [0.25, 1.25, 0.95, 1.08, 1],
                opacity: [0,    1,    1,    1,    0],
                rotate:  -12,
              }}
              transition={{ duration: 1.1, times: [0, 0.18, 0.5, 0.7, 1] }}
              className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
            >
              <span
                className="border-[2px] font-black text-[9px] tracking-widest px-1.5 py-0.5 rounded-md uppercase -rotate-12 shadow-xl"
                style={{
                  borderColor: c.hex,
                  color: c.label,
                  background: 'rgba(7,13,31,0.92)',
                }}
              >
                {stampText}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Expanded info card */}
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

// ── Main component ────────────────────────────────────────────────────────────

export default function DnsDiagram({ onStepChange }) {
  const steps  = useMemo(() => buildDnsSteps(), [])
  const runner = useStepRunner(steps)
  const { step, index } = runner

  useEffect(() => { onStepChange?.(step) }, [step, onStepChange])

  const [expandedNode, setExpandedNode] = useState(null)

  // popKeys — increments each time a node becomes active, used to re-trigger animations
  const [popKeys, setPopKeys] = useState({})
  useEffect(() => {
    if (!step.activeNodes.length) return
    setPopKeys((prev) => {
      const next = { ...prev }
      step.activeNodes.forEach((id) => { next[id] = (prev[id] ?? -1) + 1 })
      return next
    })
  }, [step])

  // visitedNodes — the set of all nodes that have been active at some point
  const visitedNodes = useMemo(() => {
    const visited = new Set()
    for (let i = 0; i <= index; i++) steps[i].activeNodes.forEach((id) => visited.add(id))
    return visited
  }, [steps, index])

  function getStampText(nodeId) {
    if (nodeId === 'auth' && step.type === 'auth-response') return 'FOUND ✓'
    if (nodeId === 'browser' && step.type === 'done')        return 'CONNECTED ✓'
    return null
  }

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-white">DNS Resolution</h2>
        <p className="text-sm text-slate-400">
          Trace a query for{' '}
          <span className="font-mono text-violet-300">google.com</span>{' '}
          from browser to authoritative nameserver and back.
        </p>
      </div>

      {/* Chain diagram */}
      <div
        className="rounded-2xl border border-white/10 p-4 sm:p-6"
        style={{
          background: '#070d1f',
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.065) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      >
        {/* Scrollable chain */}
        <div className="overflow-x-auto pb-3">
          <div className="flex items-center gap-0 min-w-max mx-auto">
            {NODES.map((node, i) => (
              <div key={node.id} className="flex items-center">
                <NodeCard
                  node={node}
                  isActive={step.activeNodes.includes(node.id)}
                  wasVisited={visitedNodes.has(node.id) && !step.activeNodes.includes(node.id)}
                  isExpanded={expandedNode === node.id}
                  onClick={() => setExpandedNode((p) => p === node.id ? null : node.id)}
                  revealedIp={node.id === 'browser' ? step.revealedIp : null}
                  popKey={popKeys[node.id] ?? null}
                  stampText={getStampText(node.id)}
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

        {/* IP resolved banner */}
        <AnimatePresence>
          {step.revealedIp && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              className="relative mt-4 overflow-hidden flex items-center gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/[0.08] px-4 py-3"
            >
              {/* Ripples on first reveal */}
              {step.type === 'auth-response' && [0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-xl border border-emerald-400/35 pointer-events-none"
                  initial={{ scale: 0.95, opacity: 0.8 }}
                  animate={{ scale: 1.6 + i * 0.35, opacity: 0 }}
                  transition={{ duration: 1.1, delay: i * 0.2, ease: 'easeOut' }}
                />
              ))}
              <motion.span
                initial={{ scale: 0.2, rotate: -30 }}
                animate={{ scale: [0.2, 1.5, 0.9, 1.1, 1], rotate: 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 15 }}
                className="text-emerald-400 text-xl relative z-10 select-none"
              >
                ✓
              </motion.span>
              <div className="relative z-10">
                <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">IP Resolved</p>
                <p className="text-sm font-mono text-white">
                  google.com{' '}→{' '}
                  <motion.span
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-emerald-300 font-bold"
                  >
                    {step.revealedIp}
                  </motion.span>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 px-1">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-px rounded-full"
            style={{ background: DIR.forward.hex, boxShadow: `0 0 5px 1px ${DIR.forward.glow}` }}
          />
          <span className="text-[10px] text-slate-500">Query (forward)</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-px rounded-full"
            style={{ background: DIR.backward.hex, boxShadow: `0 0 5px 1px ${DIR.backward.glow}` }}
          />
          <span className="text-[10px] text-slate-500">Response (backward)</span>
        </div>
      </div>

      {/* Step message + detail */}
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
