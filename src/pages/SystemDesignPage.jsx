import React, { Suspense, useMemo, useState, useEffect } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { SYSTEM_DESIGN, TYPE_COLOR, TYPE_LABEL } from '../constants/systemDesignRegistry'

const DIAGRAMS = import.meta.glob('../content/system-design/**/Diagram.jsx')

// ── Component animations ──────────────────────────────────────────────────────

function DiskAnimation({ color }) {
  return (
    <div className="flex items-center justify-center py-3 bg-[#060e20] rounded-xl mx-4 sm:mx-5 mb-3">
      <svg viewBox="0 0 80 80" width="80" height="80">
        {/* Platter background */}
        <circle cx="40" cy="40" r="34" fill="#060e20" />
        {/* Spinning platter: tracks + sectors */}
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
        {/* Outer edge */}
        <circle cx="40" cy="40" r="34" fill="none" stroke={color} strokeWidth="0.8" opacity="0.25" />
        {/* Read/write arm — sweeps ±40° around center */}
        <motion.g
          style={{ transformOrigin: '40px 40px' }}
          animate={{ rotate: [-40, 40, -40] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.15 }}
        >
          <line x1="40" y1="40" x2="40" y2="9" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.85" />
          <circle cx="40" cy="9" r="4" fill={color} opacity="0.9" style={{ filter: `drop-shadow(0 0 5px ${color})` }} />
          <circle cx="40" cy="9" r="1.5" fill="#060e20" />
        </motion.g>
        {/* Hub */}
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
      {/* Stage boxes */}
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
      {/* Stage name label */}
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
      {/* Cache path — fast */}
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
      {/* RAM path — slow */}
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
      {/* Colored top strip */}
      <div className="h-1 w-full" style={{ backgroundColor: comp.color }} />

      {/* Header */}
      <div className="px-4 sm:px-5 py-3.5 flex items-center gap-3 border-b border-white/[0.06]">
        <span className="text-2xl select-none leading-none">{comp.icon}</span>
        <h3 className="font-semibold text-white text-sm flex-1">{comp.title}</h3>
        <span
          className="shrink-0 w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: comp.color, boxShadow: `0 0 8px 2px ${comp.color}50` }}
        />
      </div>

      {/* Component animation */}
      {comp.animationType && (() => {
        const Anim = COMPONENT_ANIMATIONS[comp.animationType]
        return Anim ? <Anim color={comp.color} /> : null
      })()}

      {/* Summary */}
      <div className="px-4 sm:px-5 pt-1 pb-2.5">
        <p className="text-sm text-slate-300 leading-relaxed">{comp.summary}</p>
      </div>

      {/* Stats */}
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

      {/* Detail */}
      <div className="px-4 sm:px-5 pb-4">
        <p className="text-xs text-slate-400 leading-relaxed">{comp.detail}</p>
      </div>
    </motion.div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SystemDesignPage() {
  const { id }  = useParams()
  const item    = SYSTEM_DESIGN.find((s) => s.id === id)

  const DiagramComponent = useMemo(() => {
    if (!item) return null
    const folder = `${item.type}s`
    const loader = DIAGRAMS[`../content/system-design/${folder}/${id}/Diagram.jsx`]
    return loader ? React.lazy(loader) : null
  }, [id, item])

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
