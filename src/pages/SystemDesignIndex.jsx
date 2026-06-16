import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { SYSTEM_DESIGN } from '../constants/systemDesignRegistry'

// ── Short display labels ───────────────────────────────────────────────────────

const SHORT_LABELS = {
  'computer-architecture':      'Computer Arch.',
  'design-requirements':        'Design Reqs',
  'application-architecture':   'App Architecture',
  'networking-basics':          'Networking',
  'tcp-and-udp':                'TCP & UDP',
  'dns':                        'DNS',
  'http':                       'HTTP',
  'websockets':                 'WebSockets',
  'api-paradigms':              'API Paradigms',
  'api-design':                 'API Design',
  'caching':                    'Caching',
  'cdns':                       'CDNs',
  'proxies-and-load-balancing': 'Proxies & LB',
  'consistent-hashing':         'Consistent Hash',
  'sql':                        'SQL',
  'nosql':                      'NoSQL',
  'database-replication':       'DB Replication',
  'database-sharding':          'DB Sharding',
  'database-indexes':           'DB Indexes',
  'acid-and-base':              'ACID & BASE',
  'object-storage':             'Object Storage',
  'cap-theorem':                'CAP Theorem',
  'consistency-patterns':       'Consistency',
  'availability-patterns':      'Availability',
  'rate-limiting':              'Rate Limiting',
  'message-queues':             'Message Queues',
  'logging-and-monitoring':     'Logging & Mon.',
  'distributed-tracing':        'Dist. Tracing',
  'microservices':              'Microservices',
  'event-driven-architecture':  'Event-Driven',
}

// ── Node colors (by conceptual group) ────────────────────────────────────────

const NODE_COLOR = {
  'computer-architecture':      '#f59e0b',
  'design-requirements':        '#f59e0b',
  'application-architecture':   '#f59e0b',
  'networking-basics':          '#3b82f6',
  'tcp-and-udp':                '#3b82f6',
  'dns':                        '#3b82f6',
  'http':                       '#0ea5e9',
  'websockets':                 '#0ea5e9',
  'api-paradigms':              '#0ea5e9',
  'api-design':                 '#0ea5e9',
  'caching':                    '#f97316',
  'cdns':                       '#f97316',
  'proxies-and-load-balancing': '#f97316',
  'consistent-hashing':         '#f97316',
  'sql':                        '#06b6d4',
  'nosql':                      '#06b6d4',
  'database-replication':       '#06b6d4',
  'database-sharding':          '#06b6d4',
  'database-indexes':           '#06b6d4',
  'acid-and-base':              '#06b6d4',
  'object-storage':             '#06b6d4',
  'cap-theorem':                '#f43f5e',
  'consistency-patterns':       '#f43f5e',
  'availability-patterns':      '#f43f5e',
  'rate-limiting':              '#f43f5e',
  'message-queues':             '#8b5cf6',
  'event-driven-architecture':  '#8b5cf6',
  'microservices':              '#10b981',
  'logging-and-monitoring':     '#10b981',
  'distributed-tracing':        '#10b981',
}

// ── Graph layout (viewBox: 0 0 1280 600) ─────────────────────────────────────
// x, y = center of each node

const NODES = {
  'computer-architecture':      { x: 80,   y: 215 },
  'design-requirements':        { x: 80,   y: 455 },
  'networking-basics':          { x: 245,  y: 120 },
  'application-architecture':   { x: 245,  y: 395 },
  'tcp-and-udp':                { x: 415,  y: 70  },
  'proxies-and-load-balancing': { x: 415,  y: 255 },
  'sql':                        { x: 415,  y: 385 },
  'nosql':                      { x: 415,  y: 500 },
  'dns':                        { x: 580,  y: 45  },
  'http':                       { x: 580,  y: 145 },
  'caching':                    { x: 580,  y: 255 },
  'database-replication':       { x: 580,  y: 365 },
  'database-sharding':          { x: 580,  y: 445 },
  'acid-and-base':              { x: 580,  y: 525 },
  'websockets':                 { x: 745,  y: 45  },
  'api-paradigms':              { x: 745,  y: 130 },
  'api-design':                 { x: 745,  y: 215 },
  'cdns':                       { x: 745,  y: 300 },
  'consistent-hashing':         { x: 745,  y: 385 },
  'cap-theorem':                { x: 745,  y: 465 },
  'object-storage':             { x: 745,  y: 545 },
  'rate-limiting':              { x: 915,  y: 95  },
  'database-indexes':           { x: 915,  y: 200 },
  'consistency-patterns':       { x: 915,  y: 390 },
  'availability-patterns':      { x: 915,  y: 475 },
  'message-queues':             { x: 1085, y: 195 },
  'microservices':              { x: 1085, y: 355 },
  'logging-and-monitoring':     { x: 1085, y: 460 },
  'event-driven-architecture':  { x: 1210, y: 195 },
  'distributed-tracing':        { x: 1210, y: 460 },
}

// Edges: [prerequisite, unlocks]
const EDGES = [
  // Roots fan out
  ['computer-architecture',    'networking-basics'],
  ['computer-architecture',    'application-architecture'],
  ['design-requirements',      'application-architecture'],
  ['design-requirements',      'cap-theorem'],           // long cross-edge

  // Networking chain
  ['networking-basics',        'tcp-and-udp'],
  ['networking-basics',        'proxies-and-load-balancing'],
  ['tcp-and-udp',              'dns'],
  ['tcp-and-udp',              'http'],
  ['dns',                      'http'],

  // APIs
  ['http',                     'websockets'],
  ['http',                     'api-paradigms'],
  ['http',                     'caching'],
  ['api-paradigms',            'api-design'],

  // Caching & delivery
  ['caching',                  'cdns'],
  ['dns',                      'cdns'],                  // cross-edge
  ['caching',                  'consistent-hashing'],
  ['proxies-and-load-balancing', 'consistent-hashing'],
  ['proxies-and-load-balancing', 'rate-limiting'],

  // Storage
  ['application-architecture', 'sql'],
  ['application-architecture', 'nosql'],
  ['sql',                      'database-replication'],
  ['sql',                      'database-sharding'],
  ['sql',                      'database-indexes'],
  ['sql',                      'acid-and-base'],
  ['sql',                      'object-storage'],
  ['nosql',                    'database-replication'],

  // Reliability
  ['database-replication',     'cap-theorem'],
  ['cap-theorem',              'consistency-patterns'],
  ['cap-theorem',              'availability-patterns'],
  ['consistency-patterns',     'message-queues'],
  ['availability-patterns',    'message-queues'],

  // Architecture
  ['application-architecture', 'microservices'],         // long cross-edge
  ['message-queues',           'event-driven-architecture'],
  ['microservices',            'logging-and-monitoring'],
  ['logging-and-monitoring',   'distributed-tracing'],
]

const NODE_W = 108
const NODE_H = 27

// ── SVG sub-components ────────────────────────────────────────────────────────

function EdgePath({ from, to, isActive, hasHover }) {
  const src = NODES[from]
  const tgt = NODES[to]
  const x1 = src.x + NODE_W / 2
  const y1 = src.y
  const x2 = tgt.x - NODE_W / 2
  const y2 = tgt.y
  const cx = (x1 + x2) / 2
  const d = `M ${x1},${y1} C ${cx},${y1} ${cx},${y2} ${x2},${y2}`
  const color = NODE_COLOR[from]

  return (
    <motion.path
      d={d}
      fill="none"
      stroke={color}
      strokeDasharray={isActive ? '6 3' : '0'}
      animate={{
        strokeOpacity: isActive ? 0.88 : hasHover ? 0.07 : 0.18,
        strokeWidth:   isActive ? 1.6  : 0.8,
        strokeDashoffset: isActive ? [0, -18] : [0],
      }}
      transition={{
        strokeOpacity:    { duration: 0.18, ease: 'easeInOut' },
        strokeWidth:      { duration: 0.18, ease: 'easeInOut' },
        strokeDashoffset: isActive
          ? { duration: 0.55, repeat: Infinity, ease: 'linear' }
          : { duration: 0 },
      }}
    />
  )
}

function NodeRect({ id, hovered, onHover, path }) {
  const navigate = useNavigate()
  const { x, y } = NODES[id]
  const color = NODE_COLOR[id]
  const isHovered = hovered === id

  return (
    <g
      transform={`translate(${x - NODE_W / 2}, ${y - NODE_H / 2})`}
      onClick={() => navigate(path)}
      onMouseEnter={() => onHover(id)}
      onMouseLeave={() => onHover(null)}
      style={{ cursor: 'pointer' }}
    >
      {isHovered && (
        <rect
          x="-3" y="-3" width={NODE_W + 6} height={NODE_H + 6} rx="9"
          fill={color} fillOpacity="0.15"
        />
      )}
      <rect
        width={NODE_W} height={NODE_H} rx="7"
        fill={color} fillOpacity={isHovered ? 0.22 : 0.09}
        stroke={color} strokeWidth={isHovered ? 1.6 : 1}
        strokeOpacity={isHovered ? 1 : 0.45}
      />
      <text
        x={NODE_W / 2} y={NODE_H / 2}
        dominantBaseline="middle" textAnchor="middle"
        fill={isHovered ? '#f8fafc' : '#94a3b8'}
        fontSize="9.5" fontFamily="system-ui, 'Segoe UI', sans-serif"
        fontWeight={isHovered ? '700' : '500'}
      >
        {SHORT_LABELS[id]}
      </text>
    </g>
  )
}

function DependencyGraph({ byId }) {
  const [hovered, setHovered] = useState(null)

  const activeEdgeSet = useMemo(() => {
    if (!hovered) return new Set()
    return new Set(
      EDGES.filter(([f, t]) => f === hovered || t === hovered).map(([f, t]) => `${f}→${t}`)
    )
  }, [hovered])

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
      <svg viewBox="0 0 1280 585" className="w-full min-w-[760px]" style={{ display: 'block' }}>
        {/* Edges below nodes */}
        {EDGES.map(([from, to]) => {
          const key = `${from}→${to}`
          return (
            <EdgePath
              key={key}
              from={from}
              to={to}
              isActive={activeEdgeSet.has(key)}
              hasHover={!!hovered}
            />
          )
        })}

        {/* Nodes */}
        {Object.keys(NODES).map((id) => {
          const item = byId[id]
          return item ? (
            <NodeRect
              key={id}
              id={id}
              hovered={hovered}
              onHover={setHovered}
              path={item.path}
            />
          ) : null
        })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 px-5 pb-4 pt-1">
        {[
          { color: '#f59e0b', label: 'Foundations' },
          { color: '#3b82f6', label: 'Networking' },
          { color: '#0ea5e9', label: 'APIs' },
          { color: '#f97316', label: 'Caching & Proxies' },
          { color: '#06b6d4', label: 'Storage' },
          { color: '#f43f5e', label: 'Reliability' },
          { color: '#8b5cf6', label: 'Messaging' },
          { color: '#10b981', label: 'Operations' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: color }} />
            <span className="text-[10px] text-slate-500">{label}</span>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-5 h-px border-t border-dashed border-violet-500/50" />
          <span className="text-[10px] text-slate-600">hover to trace dependencies</span>
        </div>
      </div>
    </div>
  )
}

// ── Designs tier ──────────────────────────────────────────────────────────────

function SvgBlueprint({ c }) {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      {[10, 18, 26, 34].map((x) => <line key={`v${x}`} x1={x} y1="6" x2={x} y2="34" stroke={c} strokeWidth="0.5" opacity="0.2" />)}
      {[10, 18, 26, 34].map((y) => <line key={`h${y}`} x1="6" y1={y} x2="34" y2={y} stroke={c} strokeWidth="0.5" opacity="0.2" />)}
      <rect x="10" y="10" width="16" height="12" rx="1" stroke={c} strokeWidth="1.2" fill={c} fillOpacity="0.1" />
      <rect x="10" y="26" width="8" height="8" rx="1" stroke={c} strokeWidth="1" fill={c} fillOpacity="0.1" />
      <rect x="22" y="26" width="12" height="8" rx="1" stroke={c} strokeWidth="1" fill={c} fillOpacity="0.1" />
      <motion.rect x="6" y="6" width="28" height="2" rx="1" fill={c} opacity="0.5"
        animate={{ y: [6, 34, 6] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }} />
    </svg>
  )
}

const DESIGN_HEX = '#6366f1'

function DesignNode({ item, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: index * 0.06, type: 'spring', stiffness: 260, damping: 22 }}
      whileHover={{ y: -4 }}
    >
      <Link
        to={item.path}
        className="group flex items-center gap-3 rounded-xl border border-indigo-500/25 bg-indigo-500/[0.06] hover:bg-indigo-500/[0.11] hover:border-indigo-500/45 p-3.5 transition-colors h-full"
      >
        <div className="w-10 h-10 rounded-xl border border-indigo-500/30 bg-indigo-500/10 flex items-center justify-center shrink-0">
          <SvgBlueprint c={DESIGN_HEX} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white leading-snug group-hover:text-indigo-200 transition-colors">
            {item.title}
          </p>
          {item.tagline && (
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed line-clamp-1">{item.tagline}</p>
          )}
        </div>
      </Link>
    </motion.div>
  )
}

function DesignsTier({ designs }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl border border-indigo-500/30 px-5 py-5 sm:px-6 sm:py-6"
      style={{ background: `${DESIGN_HEX}08` }}
    >
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-400">System Designs</h2>
        <div className="flex-1 h-px bg-indigo-500/20" />
        <span className="text-[10px] rounded-full px-2 py-0.5 font-medium bg-indigo-500/15 text-indigo-300">
          {designs.length} end-to-end walkthroughs
        </span>
      </div>
      <p className="text-[11px] text-slate-500 leading-relaxed mb-5 max-w-lg">
        Put the concepts together — full system walkthroughs that draw on every node in the graph above.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {designs.map((item, i) => (
          <DesignNode key={item.id} item={item} index={i} />
        ))}
      </div>
    </motion.div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SystemDesignIndex() {
  const byId = useMemo(() => {
    const map = {}
    SYSTEM_DESIGN.forEach((item) => { map[item.id] = item })
    return map
  }, [])

  const designs = useMemo(() => SYSTEM_DESIGN.filter((i) => i.type === 'design'), [])

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">System Design</h1>
        <p className="mt-2 text-slate-400 max-w-2xl">
          30 concepts, each building on what came before. Hover any node to trace its dependencies
          — then click to deep-dive. Master the concepts before tackling the designs below.
        </p>
      </div>

      {/* Dependency graph */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <DependencyGraph byId={byId} />
      </motion.div>

      {/* Designs tier */}
      <DesignsTier designs={designs} />

    </div>
  )
}
