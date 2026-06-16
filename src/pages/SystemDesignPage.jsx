import React, { Suspense, useState, useEffect } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { SYSTEM_DESIGN, TYPE_COLOR, TYPE_LABEL } from '../constants/systemDesignRegistry'

const DIAGRAMS               = import.meta.glob('../content/system-design/**/Diagram.jsx')
const CONCEPT_ILLUSTRATIONS  = import.meta.glob('../content/system-design/**/ConceptIllustration.jsx')

// Lazy components must be created once, at module scope — not during render.
const LAZY_DIAGRAMS = Object.fromEntries(
  Object.entries(DIAGRAMS).map(([key, loader]) => [key, React.lazy(loader)])
)
const LAZY_CONCEPT_ILLUSTRATIONS = Object.fromEntries(
  Object.entries(CONCEPT_ILLUSTRATIONS).map(([key, loader]) => [key, React.lazy(loader)])
)

// ── Component animations ──────────────────────────────────────────────────────

function DiskAnimation({ color }) {
  return (
    <div className="flex items-center justify-center py-3 bg-[#060e20] rounded-xl mx-4 sm:mx-5 mb-3">
      <svg viewBox="0 0 80 80" width="80" height="80">
        <circle cx="40" cy="40" r="34" fill="#060e20" />
        <motion.g
          style={{ transformOrigin: '40px 40px' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
        >
          {[30, 23, 16].map((r) => (
            <circle key={r} cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="0.5" opacity="0.18" />
          ))}
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <line key={deg}
              x1="40" y1="40"
              x2={40 + 32 * Math.cos((deg * Math.PI) / 180)}
              y2={40 + 32 * Math.sin((deg * Math.PI) / 180)}
              stroke={color} strokeWidth="0.4" opacity="0.1"
            />
          ))}
        </motion.g>
        <circle cx="40" cy="40" r="34" fill="none" stroke={color} strokeWidth="0.8" opacity="0.25" />
        <motion.g
          style={{ transformOrigin: '40px 40px' }}
          animate={{ rotate: [-40, 40, -40] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.15 }}
        >
          <line x1="40" y1="40" x2="40" y2="9" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.85" />
          <circle cx="40" cy="9" r="4" fill={color} opacity="0.9" style={{ filter: `drop-shadow(0 0 5px ${color})` }} />
          <circle cx="40" cy="9" r="1.5" fill="#060e20" />
        </motion.g>
        <circle cx="40" cy="40" r="5.5" fill={color} opacity="0.55" />
        <circle cx="40" cy="40" r="2.5" fill="#060e20" />
      </svg>
    </div>
  )
}

function RamAnimation({ color }) {
  const ROWS = 3
  const COLS = 4
  const cells = ROWS * COLS
  return (
    <div className="flex items-center justify-center py-4 bg-[#060e20] rounded-xl mx-4 sm:mx-5 mb-3">
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
        {Array.from({ length: cells }).map((_, i) => (
          <motion.div
            key={i}
            className="w-7 h-4 rounded"
            style={{ border: `1px solid ${color}22` }}
            animate={{
              backgroundColor: [`${color}00`, `${color}55`, `${color}15`, `${color}00`],
              borderColor:     [`${color}22`, `${color}88`, `${color}44`, `${color}22`],
              boxShadow:       [`0 0 0 0 ${color}00`, `0 0 6px 1px ${color}55`, `0 0 3px 0 ${color}22`, `0 0 0 0 ${color}00`],
            }}
            transition={{
              duration: 1.8,
              delay: i * 0.11,
              repeat: Infinity,
              repeatDelay: 0.6,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </div>
  )
}

function CpuAnimation({ color }) {
  const [active, setActive] = useState(0)
  const stages = [
    { label: 'F', name: 'Fetch' },
    { label: 'D', name: 'Decode' },
    { label: 'E', name: 'Execute' },
    { label: 'W', name: 'Write' },
  ]

  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % stages.length), 520)
    return () => clearInterval(id)
  }, [stages.length])

  return (
    <div className="bg-[#060e20] rounded-xl mx-4 sm:mx-5 mb-3 px-3 py-4 space-y-3">
      <div className="flex items-center justify-between gap-1">
        {stages.map((s, i) => (
          <React.Fragment key={s.label}>
            <motion.div
              className="flex-1 h-9 rounded-lg border flex flex-col items-center justify-center gap-0.5"
              animate={{
                borderColor:     active === i ? color : '#1e293b',
                backgroundColor: active === i ? `${color}20` : 'transparent',
                boxShadow:       active === i ? `0 0 12px -2px ${color}` : 'none',
              }}
              transition={{ duration: 0.18 }}
            >
              <motion.span
                animate={{ color: active === i ? color : '#334155' }}
                transition={{ duration: 0.18 }}
                className="text-[11px] font-black leading-none"
              >
                {s.label}
              </motion.span>
            </motion.div>
            {i < stages.length - 1 && (
              <motion.div
                className="w-3 h-px rounded-full shrink-0"
                animate={{ backgroundColor: active > i ? color : '#1e293b' }}
                transition={{ duration: 0.18 }}
              />
            )}
          </React.Fragment>
        ))}
      </div>
      <motion.p
        key={active}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="text-center text-[10px] font-semibold"
        style={{ color }}
      >
        {stages[active].name}
      </motion.p>
    </div>
  )
}

function CacheAnimation({ color }) {
  return (
    <div className="bg-[#060e20] rounded-xl mx-4 sm:mx-5 mb-3 px-4 py-3 space-y-3">
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color }}>Cache HIT</span>
          <span className="text-[9px] font-mono" style={{ color }}>~1–4 ns ⚡</span>
        </div>
        <div className="relative h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: `${color}12` }}>
          <motion.div
            className="absolute top-0 left-0 h-full w-4 rounded-full"
            style={{ background: color, boxShadow: `0 0 8px 2px ${color}80` }}
            animate={{ x: ['-16px', '200%'] }}
            transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 2, ease: 'easeIn' }}
          />
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wide text-cyan-500">Cache MISS → RAM</span>
          <span className="text-[9px] font-mono text-cyan-500">~60 ns</span>
        </div>
        <div className="relative h-2.5 rounded-full overflow-hidden bg-cyan-500/10">
          <motion.div
            className="absolute top-0 left-0 h-full w-4 rounded-full bg-cyan-500"
            style={{ boxShadow: '0 0 8px 2px rgba(6,182,212,0.6)' }}
            animate={{ x: ['-16px', '200%'] }}
            transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 0.5, ease: 'linear' }}
          />
        </div>
      </div>
    </div>
  )
}

const COMPONENT_ANIMATIONS = {
  disk:  DiskAnimation,
  ram:   RamAnimation,
  cpu:   CpuAnimation,
  cache: CacheAnimation,
}

// ── Component deep-dive card ──────────────────────────────────────────────────

function ComponentCard({ comp, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ type: 'spring', stiffness: 260, damping: 22, delay: index * 0.07 }}
      whileHover={{ y: -4, transition: { type: 'spring', stiffness: 320, damping: 22 } }}
      className="rounded-2xl border overflow-hidden bg-white/[0.02]"
      style={{ borderColor: `${comp.color}28` }}
    >
      <div className="h-1 w-full" style={{ backgroundColor: comp.color }} />

      <div className="px-4 sm:px-5 py-3.5 flex items-center gap-3 border-b border-white/[0.06]">
        <span className="text-2xl select-none leading-none">{comp.icon}</span>
        <h3 className="font-semibold text-white text-sm flex-1">{comp.title}</h3>
        <span
          className="shrink-0 w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: comp.color, boxShadow: `0 0 8px 2px ${comp.color}50` }}
        />
      </div>

      {comp.animationType && (() => {
        const Anim = COMPONENT_ANIMATIONS[comp.animationType]
        return Anim ? <Anim color={comp.color} /> : null
      })()}

      <div className="px-4 sm:px-5 pt-1 pb-2.5">
        <p className="text-sm text-slate-300 leading-relaxed">{comp.summary}</p>
      </div>

      {comp.stats?.length > 0 && (
        <div className="mx-4 sm:mx-5 mb-3 rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <div className="flex divide-x divide-white/[0.06]">
            {comp.stats.map((stat) => (
              <div key={stat.label} className="flex-1 px-3 py-2.5 space-y-0.5 min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-600 truncate">{stat.label}</p>
                <p className="text-xs font-mono font-bold leading-none truncate" style={{ color: comp.color }}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 sm:px-5 pb-4">
        <p className="text-xs text-slate-400 leading-relaxed">{comp.detail}</p>
      </div>
    </motion.div>
  )
}

// ── Requirements section ──────────────────────────────────────────────────────

const REQ_COLUMNS = [
  { key: 'functional',    label: 'Functional',      accent: 'text-violet-400', dot: 'bg-violet-400',  border: 'border-violet-500/20' },
  { key: 'nonFunctional', label: 'Non-Functional',  accent: 'text-sky-400',    dot: 'bg-sky-400',     border: 'border-sky-500/20'    },
  { key: 'scale',         label: 'Scale Estimates', accent: 'text-emerald-400',dot: 'bg-emerald-400', border: 'border-emerald-500/20' },
]

function RequirementsSection({ requirements }) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-1">Requirements</p>
      <div className="grid gap-4 sm:grid-cols-3">
        {REQ_COLUMNS.map(({ key, label, accent, dot, border }) =>
          requirements[key]?.length > 0 && (
            <div key={key} className={`rounded-xl border ${border} bg-white/[0.02] px-5 py-4 space-y-3`}>
              <p className={`text-[11px] font-semibold uppercase tracking-wider ${accent}`}>{label}</p>
              <ul className="space-y-2.5">
                {requirements[key].map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300 leading-relaxed">
                    <span className={`mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full ${dot}`} />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )
        )}
      </div>
    </div>
  )
}

// ── Data model section ────────────────────────────────────────────────────────

function DataModelSection({ dataModel }) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-1">Data Model</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {dataModel.map((entity) => (
          <div key={entity.entity} className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
            <div className="px-5 py-3 border-b border-white/[0.06] flex items-baseline gap-3">
              <span className="font-mono text-sm font-bold text-white">{entity.entity}</span>
              {entity.note && (
                <span className="text-xs text-slate-500 leading-snug">{entity.note}</span>
              )}
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.05]">
                  <th className="px-5 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-600">Field</th>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-600">Type</th>
                  <th className="px-5 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-600 hidden sm:table-cell">Notes</th>
                </tr>
              </thead>
              <tbody>
                {entity.fields.map((field) => (
                  <tr key={field.name} className="border-b border-white/[0.04] last:border-0">
                    <td className="px-5 py-2 font-mono text-xs text-violet-300">{field.name}</td>
                    <td className="px-3 py-2 font-mono text-xs text-slate-400 whitespace-nowrap">{field.type}</td>
                    <td className="px-5 py-2 text-xs text-slate-500 hidden sm:table-cell">{field.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── API design section ────────────────────────────────────────────────────────

const METHOD_COLOR = {
  GET:    'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  POST:   'bg-blue-500/15 text-blue-300 border border-blue-500/30',
  PUT:    'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  PATCH:  'bg-orange-500/15 text-orange-300 border border-orange-500/30',
  DELETE: 'bg-red-500/15 text-red-300 border border-red-500/30',
}

function ApiDesignSection({ apiDesign }) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-1">API Design</p>
      <div className="space-y-2">
        {apiDesign.map((endpoint, i) => (
          <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
            {/* Header row */}
            <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-white/[0.06]">
              <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold font-mono ${METHOD_COLOR[endpoint.method] ?? 'bg-white/5 text-slate-300'}`}>
                {endpoint.method}
              </span>
              <code className="font-mono text-sm text-white">{endpoint.path}</code>
              <span className="text-xs text-slate-500 sm:ml-auto">{endpoint.description}</span>
            </div>

            {/* Body panels */}
            {(endpoint.reqBody || endpoint.resBody) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.06]">
                {/* Request body */}
                <div className="px-4 py-3 space-y-2">
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-600">Request</p>
                  <pre className="font-mono text-[11px] text-slate-400 leading-relaxed whitespace-pre-wrap">
                    {endpoint.reqBody ?? '—'}
                  </pre>
                </div>
                {/* Response body */}
                <div className="px-4 py-3 space-y-2">
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-600">Response</p>
                  <pre className="font-mono text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {endpoint.resBody ?? '—'}
                  </pre>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── High level design section ─────────────────────────────────────────────────

function HldNode({ node }) {
  return (
    <div className="flex flex-col items-center gap-1 shrink-0">
      <div className="rounded-xl border border-white/10 bg-[#07101f] px-3 py-2.5 flex flex-col items-center gap-1 min-w-[80px] max-w-[110px]">
        <span className="text-lg leading-none">{node.icon}</span>
        <p className="text-[11px] font-medium text-white text-center leading-tight">{node.label}</p>
        {node.note && <p className="text-[9px] text-slate-500 text-center leading-tight">{node.note}</p>}
      </div>
    </div>
  )
}

function HldArrow() {
  return (
    <div className="flex items-center shrink-0">
      <div className="w-5 h-px bg-slate-700" />
      <svg width="6" height="10" viewBox="0 0 6 10" fill="#334155" className="shrink-0">
        <polygon points="0,0 0,10 6,5" />
      </svg>
    </div>
  )
}

function LinearFlow({ nodes }) {
  return (
    <div className="flex items-center flex-wrap gap-y-4 overflow-x-auto py-2">
      {nodes.map((node, i) => (
        <React.Fragment key={i}>
          <HldNode node={node} />
          {i < nodes.length - 1 && <HldArrow />}
        </React.Fragment>
      ))}
    </div>
  )
}

function BranchedFlow({ preFlow, branches }) {
  return (
    <div className="flex items-center gap-0 overflow-x-auto py-2">
      {/* Pre-fork nodes */}
      <div className="flex items-center shrink-0">
        {preFlow.map((node, i) => (
          <React.Fragment key={i}>
            <HldNode node={node} />
            <HldArrow />
          </React.Fragment>
        ))}
      </div>

      {/* Fork: vertical bar + branches */}
      <div className="relative flex flex-col gap-4 shrink-0">
        {/* Vertical connector spanning all branches */}
        <div
          className="absolute left-0 w-px bg-slate-700 pointer-events-none"
          style={{ top: '25%', bottom: '25%' }}
        />

        {branches.map((branch, bi) => (
          <div key={bi} className="flex items-center">
            {/* Horizontal stub from vertical bar */}
            <div className="flex items-center shrink-0">
              <div className="w-5 h-px bg-slate-700" />
              <svg width="6" height="10" viewBox="0 0 6 10" fill="#334155" className="shrink-0 mr-1">
                <polygon points="0,0 0,10 6,5" />
              </svg>
            </div>
            {/* Branch label + nodes */}
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-600 mr-1 whitespace-nowrap">
                {branch.label}
              </span>
              {branch.nodes.map((node, ni) => (
                <React.Fragment key={ni}>
                  <HldNode node={node} />
                  {ni < branch.nodes.length - 1 && <HldArrow />}
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function HldSection({ hldFlows }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const flow = hldFlows[activeIdx]

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 px-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">High Level Design</p>
        <div className="flex-1 h-px bg-white/[0.06]" />
        <span className="text-[10px] text-slate-600">{hldFlows.length} flows</span>
      </div>

      {/* Tab switcher */}
      <div className="flex flex-wrap gap-2">
        {hldFlows.map((f, i) => (
          <button
            key={i}
            onClick={() => setActiveIdx(i)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              activeIdx === i
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                : 'bg-white/[0.02] text-slate-400 border border-white/10 hover:bg-white/[0.04]'
            }`}
          >
            {f.title}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeIdx}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
          className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4"
        >
          <p className="text-sm text-slate-300 leading-relaxed">{flow.description}</p>

          <div className="rounded-xl border border-white/[0.06] bg-[#07101f] px-4 py-4 overflow-x-auto">
            {flow.flow && <LinearFlow nodes={flow.flow} />}
            {flow.preFlow && flow.branches && (
              <BranchedFlow preFlow={flow.preFlow} branches={flow.branches} />
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ── Option content renderer ───────────────────────────────────────────────────

const LABEL_COLORS = {
  'Pros':            'text-emerald-400',
  'Cons':            'text-red-400',
  'Best for':        'text-blue-400',
  'Result':          'text-sky-400',
  'Method':          'text-violet-400',
  'Structure':       'text-violet-400',
  'Drawback':        'text-amber-400',
  'Why this wins':   'text-emerald-400',
  'Fix':             'text-amber-400',
  'Scale':           'text-sky-400',
  'Trade-off':       'text-amber-400',
  'Critical':        'text-red-400',
  'Acceptable':      'text-emerald-400',
}

const CODE_TRIGGERS = [
  '  Example:', '  CHARS', '  def ', '  SET ', '  GET ',
  '  INCR ', '  encode(', '  if ', '  out', '  while ', '  return ',
]

function renderOptionContent(raw) {
  const lines = raw.split('\n')
  const blocks = []
  let codeBuf = []
  let inCode = false
  let lastEmpty = false
  let k = 0

  const flushCode = () => {
    if (!codeBuf.length) return
    blocks.push(
      <pre key={k++} className="rounded-lg bg-[#060e20] border border-white/[0.06] px-4 py-3 font-mono text-[11px] text-slate-300 leading-relaxed overflow-x-auto">
        {codeBuf.join('\n')}
      </pre>
    )
    codeBuf = []
    inCode = false
    lastEmpty = false
  }

  for (const line of lines) {
    const trimmed = line.trim()

    // Code block: trigger on known prefixes, continue while indented
    const isCodeTrigger = CODE_TRIGGERS.some((p) => line.startsWith(p))
    const isCodeContinuation = inCode && line.startsWith('  ')

    if (isCodeTrigger || isCodeContinuation) {
      inCode = true
      codeBuf.push(line.replace(/^ {2}/, ''))
      lastEmpty = false
      continue
    }

    // Non-indented line while inCode → flush
    if (inCode) flushCode()

    // Empty line
    if (trimmed === '') {
      if (inCode) flushCode()
      else if (!lastEmpty) { blocks.push(<div key={k++} className="h-1.5" />); lastEmpty = true }
      continue
    }
    lastEmpty = false

    // Bullet point
    if (trimmed.startsWith('•') || trimmed.startsWith('- ')) {
      const text = trimmed.replace(/^[•-]\s*/, '')
      blocks.push(
        <div key={k++} className="flex items-start gap-2.5">
          <span className="mt-[6px] shrink-0 w-1.5 h-1.5 rounded-full bg-violet-400/70" />
          <span className="text-sm text-slate-300 leading-relaxed">{text}</span>
        </div>
      )
      continue
    }

    // Numbered step
    const numMatch = trimmed.match(/^(\d+)\.\s+(.+)/)
    if (numMatch) {
      blocks.push(
        <div key={k++} className="flex items-start gap-2.5">
          <span className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-[9px] text-violet-400 font-bold leading-none">
            {numMatch[1]}
          </span>
          <span className="text-sm text-slate-300 leading-relaxed">{numMatch[2]}</span>
        </div>
      )
      continue
    }

    // Colored label: "Label: rest..."
    const labelMatch = trimmed.match(/^([A-Za-z][A-Za-z\s-]*?):\s+(.+)/)
    if (labelMatch) {
      const color = LABEL_COLORS[labelMatch[1]]
      if (color) {
        blocks.push(
          <p key={k++} className="text-sm leading-relaxed">
            <span className={`font-semibold ${color}`}>{labelMatch[1]}: </span>
            <span className="text-slate-300">{labelMatch[2]}</span>
          </p>
        )
        continue
      }
    }

    // Regular text
    blocks.push(<p key={k++} className="text-sm text-slate-300 leading-relaxed">{trimmed}</p>)
  }
  flushCode()

  return <div className="space-y-2">{blocks}</div>
}

// ── Deep dive section ─────────────────────────────────────────────────────────

const LEVEL_STYLE = {
  mid:    'bg-sky-500/15 text-sky-300 border-sky-500/30',
  senior: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  staff:  'bg-amber-500/15 text-amber-300 border-amber-500/30',
}

const LEVEL_CHEVRON = {
  mid:    'text-sky-400',
  senior: 'text-violet-400',
  staff:  'text-amber-400',
}

const BADGE_CONFIG = {
  'Chosen':         { cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25', card: 'border-emerald-500/25 bg-emerald-950/20', divider: 'border-emerald-500/10' },
  'Decision Guide': { cls: 'text-violet-400 bg-violet-500/10 border-violet-500/25',   card: 'border-violet-500/20 bg-violet-950/10',   divider: 'border-violet-500/10' },
  'Key Insight':    { cls: 'text-amber-400 bg-amber-500/10 border-amber-500/25',       card: 'border-amber-500/20 bg-amber-950/10',     divider: 'border-amber-500/10' },
}

function DeepDiveOption({ opt, isOpen, onToggle }) {
  const badge = opt.badge ? BADGE_CONFIG[opt.badge] : null

  return (
    <div className={`rounded-lg border overflow-hidden transition-colors duration-200 ${badge ? badge.card : 'border-white/[0.06] bg-[#07101f]'}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2.5 px-4 py-3 text-left hover:bg-white/[0.025] transition-colors"
      >
        <motion.svg
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.18 }}
          className={`shrink-0 w-3.5 h-3.5 transition-colors ${isOpen ? 'text-violet-400' : 'text-slate-500'}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </motion.svg>
        <span className={`text-sm font-medium flex-1 ${isOpen ? 'text-slate-100' : 'text-slate-300'}`}>{opt.label}</span>
        {opt.badge && (
          <span className={`shrink-0 text-[9px] font-semibold rounded-full border px-2 py-0.5 tracking-wide ${badge.cls}`}>
            {opt.badge}
          </span>
        )}
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="opt-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className={`px-4 pb-4 pt-3 border-t ${badge ? badge.divider : 'border-white/[0.04]'}`}>
              {renderOptionContent(opt.content)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function DeepDiveItem({ item, isOpen, onToggle }) {
  const [openOptions, setOpenOptions] = useState(new Set())

  const toggleOption = (idx) => {
    setOpenOptions((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  return (
    <div className={`rounded-xl border overflow-hidden transition-all duration-200 ${
      isOpen ? 'border-white/[0.16] bg-white/[0.025]' : 'border-white/10 bg-white/[0.02]'
    }`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
      >
        <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold capitalize ${LEVEL_STYLE[item.level]}`}>
          {item.level}
        </span>
        <span className={`text-sm flex-1 leading-snug transition-colors ${isOpen ? 'text-white font-medium' : 'text-slate-200'}`}>
          {item.question}
        </span>
        {item.options?.length > 0 && (
          <span className="shrink-0 text-[10px] text-slate-600 font-mono mr-1">{item.options.length}</span>
        )}
        <motion.svg
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className={`shrink-0 w-4 h-4 transition-colors ${isOpen ? LEVEL_CHEVRON[item.level] : 'text-slate-500'}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="dd-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-3 border-t border-white/[0.06] space-y-3">
              {(item.description || item.answer) && (
                <div className="rounded-lg border border-white/[0.05] bg-white/[0.015] px-4 py-3">
                  <p className="text-sm text-slate-400 leading-relaxed">{item.description ?? item.answer}</p>
                </div>
              )}
              {item.options?.length > 0 && (
                <div className="space-y-1.5">
                  {item.options.map((opt, i) => (
                    <DeepDiveOption
                      key={i}
                      opt={opt}
                      isOpen={openOptions.has(i)}
                      onToggle={() => toggleOption(i)}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function DeepDiveSection({ items }) {
  const [openIdx, setOpenIdx] = useState(null)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 px-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Deep Dive</p>
        <div className="flex-1 h-px bg-white/[0.06]" />
        <div className="flex items-center gap-1.5">
          {['mid', 'senior', 'staff'].map((level) => (
            <span key={level} className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold ${LEVEL_STYLE[level]}`}>
              {level}
            </span>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <DeepDiveItem
            key={i}
            item={item}
            isOpen={openIdx === i}
            onToggle={() => setOpenIdx(openIdx === i ? null : i)}
          />
        ))}
      </div>
    </div>
  )
}

// ── Level expectations section ────────────────────────────────────────────────

const LEVEL_COLS = [
  { key: 'mid',    label: 'Mid  (L4)',    style: 'text-sky-300 bg-sky-500/10 border-sky-500/30' },
  { key: 'senior', label: 'Senior (L5)', style: 'text-violet-300 bg-violet-500/10 border-violet-500/30' },
  { key: 'staff',  label: 'Staff  (L6)', style: 'text-amber-300 bg-amber-500/10 border-amber-500/30' },
]

function LevelExpectationsSection({ rows }) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-1">Level Expectations</p>
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-4 border-b border-white/[0.06] bg-white/[0.02]">
          <div className="px-4 py-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">Dimension</span>
          </div>
          {LEVEL_COLS.map((col) => (
            <div key={col.key} className="px-4 py-2.5">
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${col.style.split(' ')[0]}`}>
                {col.label}
              </span>
            </div>
          ))}
        </div>
        {/* Rows */}
        {rows.map((row, i) => (
          <div
            key={i}
            className="grid grid-cols-4 border-b border-white/[0.04] last:border-0"
          >
            <div className="px-4 py-3 flex items-start">
              <span className="text-xs font-semibold text-white leading-relaxed">{row.dimension}</span>
            </div>
            {LEVEL_COLS.map((col) => (
              <div key={col.key} className="px-4 py-3 border-l border-white/[0.04]">
                <p className="text-xs text-slate-400 leading-relaxed">{row[col.key]}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SystemDesignPage() {
  const { id }  = useParams()
  const item    = SYSTEM_DESIGN.find((s) => s.id === id)

  const folder = item ? `${item.type}s` : null
  const ConceptIllustrationComponent = folder
    ? LAZY_CONCEPT_ILLUSTRATIONS[`../content/system-design/${folder}/${id}/ConceptIllustration.jsx`] ?? null
    : null
  const DiagramComponent = folder
    ? LAZY_DIAGRAMS[`../content/system-design/${folder}/${id}/Diagram.jsx`] ?? null
    : null

  if (!item) return <Navigate to="/system-design" replace />

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-8"
    >
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500">
        <Link to="/" className="hover:text-slate-300 transition-colors">Home</Link>
        <span>/</span>
        <Link to="/system-design" className="hover:text-slate-300 transition-colors">System Design</Link>
        <span>/</span>
        <span className="text-slate-300">{item.title}</span>
      </nav>

      {/* Title + type badge */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">{item.title}</h1>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${TYPE_COLOR[item.type]}`}>
          {TYPE_LABEL[item.type]}
        </span>
      </div>

      {/* Hero row: Overview + Mental Model */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {item.description && (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] px-5 py-4 space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Overview</p>
            <p className="text-sm text-slate-300 leading-relaxed">{item.description}</p>
          </div>
        )}
        {item.metaphor && (
          <div className="flex gap-3 rounded-xl border border-blue-500/20 bg-blue-500/[0.05] px-5 py-4">
            <div className="mt-0.5 w-0.5 shrink-0 self-stretch rounded-full bg-blue-500/50" />
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-400">Mental model</p>
              <p className="text-sm text-slate-300 leading-relaxed">{item.metaphor}</p>
            </div>
          </div>
        )}
      </div>

      {/* Concept illustration */}
      {ConceptIllustrationComponent && (
        <Suspense fallback={null}>
          <ConceptIllustrationComponent />
        </Suspense>
      )}

      {/* Requirements */}
      {item.requirements && <RequirementsSection requirements={item.requirements} />}

      {/* Data Model */}
      {item.dataModel?.length > 0 && <DataModelSection dataModel={item.dataModel} />}

      {/* API Design */}
      {item.apiDesign?.length > 0 && <ApiDesignSection apiDesign={item.apiDesign} />}

      {/* High Level Design */}
      {item.hldFlows?.length > 0 && <HldSection hldFlows={item.hldFlows} />}

      {/* Diagram */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3 sm:p-5">
        <Suspense fallback={
          <div className="py-20 text-center text-slate-500 text-sm">Loading diagram…</div>
        }>
          {DiagramComponent
            ? <DiagramComponent />
            : (
              <div className="py-16 text-center space-y-2">
                <p className="text-slate-400 font-medium">Interactive diagram coming soon</p>
                <p className="text-xs text-slate-600">The concepts and components below cover everything you need to know.</p>
              </div>
            )
          }
        </Suspense>
      </div>

      {/* How it works */}
      {item.howItWorks?.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] px-5 py-4 space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">How it works</p>
          <ol className="space-y-3">
            {item.howItWorks.map((step, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
                className="flex items-start gap-3 text-sm text-slate-300"
              >
                <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-[10px] text-blue-400 font-bold leading-none">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{step}</span>
              </motion.li>
            ))}
          </ol>
        </div>
      )}

      {/* Deep Dive Q&A */}
      {item.deepDive?.length > 0 && <DeepDiveSection items={item.deepDive} />}

      {/* Level expectations */}
      {item.levelExpectations?.length > 0 && <LevelExpectationsSection rows={item.levelExpectations} />}

      {/* Components */}
      {item.components?.length > 0 && (
        <div className="space-y-5">
          <div className="flex items-center gap-3 px-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Components</p>
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-[10px] text-slate-600">{item.components.length} components</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {item.components.map((comp, i) => (
              <ComponentCard key={comp.id} comp={comp} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Key takeaways */}
      {item.keyPoints?.length > 0 && (
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-1">Key takeaways</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {item.keyPoints.map((point, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 24 }}
                className="flex items-start gap-2.5 rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3"
              >
                <span className="shrink-0 mt-0.5 w-4 h-4 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-[9px] text-blue-400 font-bold">
                  {i + 1}
                </span>
                <p className="text-sm text-slate-300 leading-relaxed">{point}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {item.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-white/5 border border-white/10 px-2.5 py-1 text-xs text-slate-400"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  )
}
