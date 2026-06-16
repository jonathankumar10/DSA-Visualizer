import { useMemo, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { buildDesignRequirementsSteps } from './steps'
import { useTtsRunner } from '../../../../hooks/useTtsRunner'
import StepControls from '../../../../components/ui/StepControls'

// ── Three pillars ─────────────────────────────────────────────────────────────

const PILLARS = [
  {
    id:      'move',
    label:   'Move Data',
    icon:    '🔀',
    color:   '#3b82f6',
    glow:    'rgba(59,130,246,0.55)',
    example: 'CDN · Load balancer · Message queue',
    note:    '~100 ms across the network vs ~60 ns in RAM',
  },
  {
    id:      'store',
    label:   'Store Data',
    icon:    '🗄️',
    color:   '#8b5cf6',
    glow:    'rgba(139,92,246,0.55)',
    example: 'SQL · NoSQL · Blob store · Distributed FS',
    note:    'Access pattern determines the right choice',
  },
  {
    id:       'transform',
    label:    'Transform Data',
    icon:     '⚙️',
    color:    '#10b981',
    glow:     'rgba(16,185,129,0.55)',
    example:  'Stream processor · Batch job · Aggregator',
    note:     'Logs → metrics · Records → fraud scores',
  },
]

function PillarCard({ pillar, active }) {
  return (
    <motion.div
      className="rounded-xl border overflow-hidden flex-1"
      animate={{
        borderColor:     active ? `${pillar.color}55` : 'rgba(255,255,255,0.07)',
        backgroundColor: active ? `${pillar.color}0d` : 'rgba(4,11,24,0.9)',
        boxShadow:       active ? `0 0 20px -6px ${pillar.glow}` : 'none',
      }}
      transition={{ duration: 0.3 }}
    >
      {/* Strip */}
      <motion.div
        className="h-0.5 w-full"
        animate={{ backgroundColor: active ? pillar.color : '#1e293b' }}
        transition={{ duration: 0.3 }}
      />
      <div className="p-3 space-y-2">
        {/* Icon + label */}
        <div className="flex items-center gap-2">
          <motion.span
            className="text-lg leading-none select-none"
            animate={active ? { scale: [1, 1.25, 0.95, 1.05, 1] } : { scale: 1 }}
            transition={{ type: 'spring', stiffness: 380, damping: 12 }}
          >
            {pillar.icon}
          </motion.span>
          <motion.p
            className="text-[11px] font-bold"
            animate={{ color: active ? '#f8fafc' : '#475569' }}
            transition={{ duration: 0.3 }}
          >
            {pillar.label}
          </motion.p>
        </div>
        {/* Example */}
        <motion.p
          className="text-[9px] font-mono leading-snug"
          animate={{ color: active ? pillar.color : '#1e293b' }}
          transition={{ duration: 0.3 }}
        >
          {pillar.example}
        </motion.p>
        {/* Note */}
        <motion.p
          className="text-[9px] text-slate-700 leading-snug"
          animate={{ opacity: active ? 1 : 0.3 }}
          transition={{ duration: 0.3 }}
        >
          {pillar.note}
        </motion.p>
      </div>
    </motion.div>
  )
}

// ── NFR metric cards ──────────────────────────────────────────────────────────

function ThroughputViz({ active }) {
  const [qps, setQps] = useState(0)
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setQps(() => Math.floor(Math.random() * 4200 + 600)), 110)
    return () => clearInterval(id)
  }, [active])

  const tiers = ['1K', '10K', '100K', '1M+']
  return (
    <div className="space-y-2 p-2.5 rounded-xl bg-[#040b18]">
      <div className="flex items-baseline justify-between">
        <span className="text-[9px] font-bold uppercase tracking-wide text-blue-400">QPS</span>
        <motion.span
          className="text-sm font-black font-mono tabular-nums"
          animate={{ color: active ? '#3b82f6' : '#1e293b' }}
          style={{ textShadow: active ? '0 0 14px rgba(59,130,246,0.55)' : 'none' }}
          transition={{ duration: 0.3 }}
        >
          {active ? qps.toLocaleString() : '—'}
        </motion.span>
      </div>
      <div className="flex items-end gap-0.5 h-6">
        {tiers.map((_, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-t"
            animate={{
              height: active ? `${28 + i * 22}%` : '8%',
              backgroundColor: active ? '#3b82f6' : '#1e293b',
              opacity: active ? 0.35 + i * 0.2 : 0.2,
            }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
          />
        ))}
      </div>
      <div className="flex justify-between text-[8px] font-mono text-slate-700">
        {tiers.map((t) => <span key={t}>{t}</span>)}
      </div>
      <p className="text-[8px] text-slate-700 text-center">vertical → horizontal scaling</p>
    </div>
  )
}

function LatencyViz({ active }) {
  const rows = [
    { label: 'p50', display: '28 ms',  pct: 14, color: '#10b981' },
    { label: 'p99', display: '320 ms', pct: 64, color: '#f59e0b' },
  ]
  return (
    <div className="space-y-2 p-2.5 rounded-xl bg-[#040b18]">
      <span className="text-[9px] font-bold uppercase tracking-wide text-emerald-400">Latency</span>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.label} className="space-y-0.5">
            <div className="flex justify-between">
              <span className="text-[9px] font-mono text-slate-500">{r.label}</span>
              <motion.span
                className="text-[9px] font-mono font-bold"
                animate={{ color: active ? r.color : '#1e293b' }}
                transition={{ duration: 0.3 }}
              >
                {active ? r.display : '—'}
              </motion.span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden bg-white/[0.04]">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: r.color }}
                animate={{ width: active ? `${r.pct}%` : '0%' }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="text-[8px] italic text-slate-700">p99 &gt; p50×10 → investigate tails</p>
    </div>
  )
}

const NINES = [
  { label: '99%',     downtime: '3.65 d/yr', color: '#ef4444' },
  { label: '99.9%',   downtime: '8.7 h/yr',  color: '#f59e0b' },
  { label: '99.99%',  downtime: '52 min/yr', color: '#10b981' },
  { label: '99.999%', downtime: '5 min/yr',  color: '#3b82f6' },
]

function AvailabilityViz({ active }) {
  return (
    <div className="space-y-1.5 p-2.5 rounded-xl bg-[#040b18]">
      <span className="text-[9px] font-bold uppercase tracking-wide text-rose-400">Availability</span>
      {NINES.map((row, i) => (
        <motion.div
          key={row.label}
          className="flex items-center justify-between rounded px-1.5 py-0.5"
          animate={{
            backgroundColor: active ? `${row.color}14` : 'transparent',
            opacity:         active ? 1 : 0.22,
          }}
          transition={{ duration: 0.3, delay: active ? i * 0.07 : 0 }}
        >
          <span className="text-[9px] font-mono font-bold" style={{ color: active ? row.color : '#334155' }}>
            {row.label}
          </span>
          <span className="text-[8px] text-slate-600">{row.downtime}</span>
        </motion.div>
      ))}
    </div>
  )
}

// ── Reliability & redundancy ──────────────────────────────────────────────────

function ServerNode({ label, live, color, dim }) {
  return (
    <motion.div
      className="flex flex-col items-center gap-1 rounded-lg border px-3 py-2"
      animate={{
        borderColor:     live ? `${color}55` : 'rgba(255,255,255,0.06)',
        backgroundColor: live ? `${color}10` : 'rgba(4,11,24,0.9)',
        boxShadow:       live ? `0 0 14px -4px ${color}60` : 'none',
        opacity:         dim ? 0.35 : 1,
      }}
      transition={{ duration: 0.35 }}
    >
      <motion.span
        className="text-base leading-none select-none"
        animate={live ? { scale: [1, 1.15, 0.95, 1.05, 1] } : { scale: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 12 }}
      >
        🖥️
      </motion.span>
      <motion.p
        className="text-[8px] font-bold font-mono"
        animate={{ color: live ? color : '#334155' }}
        transition={{ duration: 0.3 }}
      >
        {label}
      </motion.p>
    </motion.div>
  )
}

function RedundancyViz({ active }) {
  return (
    <div className="p-2.5 rounded-xl bg-[#040b18] space-y-2">
      <span className="text-[9px] font-bold uppercase tracking-wide text-violet-400">Redundancy</span>
      <div className="grid grid-cols-2 gap-3">

        {/* Active-passive */}
        <div className="space-y-1.5">
          <p className="text-[8px] font-semibold text-slate-600 text-center">Active-Passive</p>
          <div className="flex flex-col items-center gap-1.5">
            <ServerNode label="Primary" live={active} color="#8b5cf6" />
            <motion.div
              className="w-px h-3 rounded-full"
              animate={{ backgroundColor: active ? '#8b5cf660' : '#1e293b' }}
              transition={{ duration: 0.3 }}
            />
            <ServerNode label="Standby" live={false} color="#8b5cf6" dim={!active} />
          </div>
          <p className="text-[8px] text-slate-700 text-center">failover on failure</p>
        </div>

        {/* Active-active */}
        <div className="space-y-1.5">
          <p className="text-[8px] font-semibold text-emerald-900 text-center">Active-Active</p>
          <div className="flex gap-2 justify-center">
            <ServerNode label="Node A" live={active} color="#10b981" />
            <ServerNode label="Node B" live={active} color="#10b981" />
          </div>
          <p className="text-[8px] text-emerald-900 text-center">both serve live traffic</p>
        </div>
      </div>
    </div>
  )
}

// ── Card wrapper ──────────────────────────────────────────────────────────────

function SectionCard({ label, sublabel, active, color = '#3b82f6', children, className = '' }) {
  return (
    <motion.div
      className={`rounded-xl border overflow-hidden ${className}`}
      animate={{
        borderColor:     active ? `${color}55` : 'rgba(255,255,255,0.07)',
        backgroundColor: active ? `${color}0a` : 'rgba(4,11,24,0.9)',
        boxShadow:       active ? `0 0 22px -6px ${color}55` : 'none',
      }}
      transition={{ duration: 0.3 }}
    >
      <div className="px-3 py-2 border-b border-white/[0.05] flex items-center gap-2">
        <motion.div
          className="w-1.5 h-1.5 rounded-full shrink-0"
          animate={{
            backgroundColor: active ? color : '#1e293b',
            boxShadow: active ? `0 0 6px ${color}` : 'none',
          }}
          transition={{ duration: 0.3 }}
        />
        <p className="text-[10px] font-bold text-white">{label}</p>
        {sublabel && <p className="text-[9px] text-slate-600 ml-auto">{sublabel}</p>}
      </div>
      <div className="p-2">{children}</div>
    </motion.div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DesignRequirementsDiagram() {
  const steps  = useMemo(() => buildDesignRequirementsSteps(), [])
  const runner = useTtsRunner(steps, (s) => `${s.message}. ${s.detail}`)
  const { step } = runner

  const sec      = step.activeSection
  const allActive = sec === 'all'

  const moveActive  = sec === 'move'         || allActive
  const storeActive = sec === 'store'        || allActive
  const xformActive = sec === 'transform'    || allActive
  const tputActive  = sec === 'throughput'   || allActive
  const latActive   = sec === 'latency'      || allActive
  const availActive = sec === 'availability' || allActive
  const relActive   = sec === 'reliability'  || allActive
  const nfrActive   = tputActive || latActive || availActive || relActive

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-white">Requirements Framework</h2>
        <p className="text-sm text-slate-400">
          From the three primitives of distributed systems to the quality metrics every architecture must satisfy.
        </p>
      </div>

      {/* Diagram */}
      <div
        className="rounded-2xl border border-white/10 p-3 sm:p-4 space-y-3"
        style={{
          background: '#060d1a',
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      >

        {/* Row 1 — Three pillars */}
        <div className="space-y-1.5">
          <motion.p
            className="text-[9px] font-bold uppercase tracking-widest px-0.5"
            animate={{ color: (moveActive || storeActive || xformActive) ? '#94a3b8' : '#1e293b' }}
            transition={{ duration: 0.3 }}
          >
            Three Primitives of System Design
          </motion.p>
          <div className="flex gap-2">
            {PILLARS.map((p) => (
              <PillarCard
                key={p.id}
                pillar={p}
                active={
                  (p.id === 'move'      && moveActive)  ||
                  (p.id === 'store'     && storeActive) ||
                  (p.id === 'transform' && xformActive)
                }
              />
            ))}
          </div>
        </div>

        {/* Row 2 — NFR metrics */}
        <div className="space-y-1.5">
          <motion.div
            className="flex items-center gap-2"
            animate={{ opacity: nfrActive ? 1 : 0.25 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"
              animate={{ boxShadow: nfrActive ? '0 0 6px #3b82f6' : 'none' }}
            />
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Non-Functional Requirements</p>
          </motion.div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { active: tputActive,  color: '#3b82f6', node: <ThroughputViz   active={tputActive}  /> },
              { active: latActive,   color: '#10b981', node: <LatencyViz      active={latActive}   /> },
              { active: availActive, color: '#ef4444', node: <AvailabilityViz active={availActive} /> },
            ].map(({ active, color, node }, i) => (
              <motion.div
                key={i}
                className="rounded-xl border"
                animate={{
                  borderColor: active ? `${color}55` : 'rgba(255,255,255,0.06)',
                  boxShadow:   active ? `0 0 16px -5px ${color}50` : 'none',
                }}
                transition={{ duration: 0.3 }}
              >
                {node}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Row 3 — Reliability */}
        <SectionCard label="Reliability & Redundancy" sublabel="design for failure" active={relActive} color="#8b5cf6">
          <RedundancyViz active={relActive} />
        </SectionCard>

        {/* All-active banner */}
        <AnimatePresence>
          {allActive && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0,  scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 24 }}
              className="relative flex items-center gap-3 rounded-xl border border-blue-500/30 bg-blue-500/[0.07] px-4 py-3 overflow-hidden"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-xl border border-blue-400/15 pointer-events-none"
                  initial={{ scale: 0.95, opacity: 0.6 }}
                  animate={{ scale: 1.4 + i * 0.25, opacity: 0 }}
                  transition={{ duration: 1.1, delay: i * 0.2, ease: 'easeOut' }}
                />
              ))}
              <span className="text-xl relative z-10 select-none">⚖️</span>
              <div className="relative z-10">
                <p className="text-[11px] font-bold uppercase tracking-wider text-blue-400">Trade-offs are unavoidable</p>
                <p className="text-sm text-white">More redundancy → better availability, higher cost. More caching → lower latency, risk of stale data.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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

      <StepControls runner={runner} />
    </div>
  )
}
