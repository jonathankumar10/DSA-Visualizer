import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTtsRunner } from '../../../hooks/useTtsRunner'
import StepControls from '../../../components/ui/StepControls'

// ── Colours ───────────────────────────────────────────────────────────────────
const C = {
  violet:  '#8b5cf6',
  violetGlow: 'rgba(139,92,246,0.55)',
  emerald: '#10b981',
  emeraldGlow: 'rgba(16,185,129,0.55)',
  red:     '#f43f5e',
  redGlow: 'rgba(244,63,94,0.55)',
  blue:    '#3b82f6',
  blueGlow: 'rgba(59,130,246,0.55)',
  dim:     'rgba(255,255,255,0.07)',
}

// ── Steps ─────────────────────────────────────────────────────────────────────
const STEPS = [
  {
    activeClients: [],
    requestArrows: [],
    singletonActive: false,
    constructorBlocked: false,
    instanceState: 'hidden',
    clientRefs: [],
    message: 'The Singleton Pattern',
    detail: 'One class. One instance. No matter how many callers exist, they all share the exact same object — nothing can create a second one.',
  },
  {
    activeClients: [],
    requestArrows: [],
    singletonActive: true,
    constructorBlocked: true,
    instanceState: 'null',
    clientRefs: [],
    message: 'Private constructor — no one can call new',
    detail: 'The constructor is marked private. Code outside the class simply cannot call new Singleton(). This is the lock that makes the pattern work.',
  },
  {
    activeClients: ['a'],
    requestArrows: ['a'],
    singletonActive: true,
    constructorBlocked: false,
    instanceState: 'null',
    clientRefs: [],
    message: 'Client A calls getInstance() for the first time',
    detail: 'The only legal entry point is the static getInstance() method. Client A calls it. The method checks: is the instance field null?',
  },
  {
    activeClients: [],
    requestArrows: [],
    singletonActive: true,
    constructorBlocked: false,
    instanceState: 'created',
    clientRefs: [],
    message: 'Instance is null — Singleton creates it now',
    detail: 'Yes, it is null. So getInstance() runs the constructor exactly once and stores the result. This is the one and only time the object is ever created.',
  },
  {
    activeClients: ['a'],
    requestArrows: [],
    singletonActive: false,
    constructorBlocked: false,
    instanceState: 'created',
    clientRefs: ['a'],
    message: 'Client A receives a reference to the instance',
    detail: 'getInstance() returns the newly created object. Client A now holds a reference to the single instance.',
  },
  {
    activeClients: ['b'],
    requestArrows: ['b'],
    singletonActive: true,
    constructorBlocked: false,
    instanceState: 'created',
    clientRefs: ['a'],
    message: 'Client B calls getInstance()',
    detail: 'A completely separate caller also wants the object. It calls getInstance() — but this time the instance field is not null.',
  },
  {
    activeClients: ['b'],
    requestArrows: [],
    singletonActive: false,
    constructorBlocked: false,
    instanceState: 'created',
    clientRefs: ['a', 'b'],
    message: 'Same instance returned — zero new objects created',
    detail: 'getInstance() checks the field: not null. It simply returns the existing object. Client B gets the exact same reference as Client A. No second object is ever made.',
  },
  {
    activeClients: ['a', 'b', 'c'],
    requestArrows: ['c'],
    singletonActive: true,
    constructorBlocked: false,
    instanceState: 'created',
    clientRefs: ['a', 'b', 'c'],
    message: 'All callers share the exact same instance',
    detail: 'No matter how many clients call getInstance(), they all receive the same object. The private constructor makes it impossible for anyone to create a duplicate.',
  },
]

// ── Sub-components ────────────────────────────────────────────────────────────

function ClientBox({ label, isActive, hasRef }) {
  return (
    <motion.div
      className="rounded-xl border-2 p-3 flex items-center justify-between gap-2 relative overflow-hidden"
      animate={{
        borderColor:     isActive ? C.violet : 'rgba(255,255,255,0.08)',
        backgroundColor: isActive ? 'rgba(139,92,246,0.1)' : 'rgba(10,18,36,1)',
        boxShadow:       isActive ? `0 0 18px -4px ${C.violetGlow}` : 'none',
      }}
      transition={{ duration: 0.28 }}
    >
      <motion.div
        className="absolute top-0 left-0 right-0 h-0.5 bg-violet-500"
        animate={{ opacity: isActive ? 1 : 0.1 }}
      />
      <div>
        <p className="text-[9px] text-slate-600 font-mono uppercase tracking-wide">caller</p>
        <p className="text-sm font-bold text-white leading-tight">{label}</p>
      </div>
      {/* Reference indicator dot */}
      <motion.div
        className="w-3.5 h-3.5 rounded-full border-2 shrink-0"
        animate={{
          borderColor:     hasRef ? C.emerald : 'rgba(255,255,255,0.15)',
          backgroundColor: hasRef ? C.emerald : 'transparent',
          boxShadow:       hasRef ? `0 0 8px 2px ${C.emeraldGlow}` : 'none',
        }}
        transition={{ duration: 0.3 }}
        title={hasRef ? 'holds a reference' : 'no reference yet'}
      />
    </motion.div>
  )
}

function Arrow({ active }) {
  return (
    <div className="relative flex items-center h-6">
      <motion.div
        className="absolute inset-0 h-px top-1/2 -translate-y-1/2 rounded-full"
        animate={{
          backgroundColor: active ? C.blue : 'rgba(255,255,255,0.06)',
          boxShadow:       active ? `0 0 6px 1px ${C.blueGlow}` : 'none',
        }}
        transition={{ duration: 0.25 }}
      />
      {/* Travelling dot */}
      {active && (
        <motion.div
          className="absolute w-2.5 h-2.5 rounded-full top-1/2 -translate-y-1/2"
          style={{ backgroundColor: C.blue, boxShadow: `0 0 8px 3px ${C.blueGlow}` }}
          initial={{ left: '0%' }}
          animate={{ left: '90%' }}
          transition={{ duration: 0.45, ease: 'linear', repeat: Infinity, repeatDelay: 0.2 }}
        />
      )}
      {/* Arrowhead */}
      <motion.div
        className="absolute right-0 w-0 h-0"
        style={{
          borderTop:    '5px solid transparent',
          borderBottom: '5px solid transparent',
          borderLeft:   `6px solid ${active ? C.blue : 'rgba(255,255,255,0.06)'}`,
        }}
      />
    </div>
  )
}

function SingletonBox({ isActive, constructorBlocked, instanceState }) {
  const instanceCreated = instanceState === 'created'

  return (
    <motion.div
      className="rounded-2xl border-2 overflow-hidden h-full flex flex-col"
      animate={{
        borderColor:     isActive ? C.violet : 'rgba(255,255,255,0.1)',
        backgroundColor: isActive ? 'rgba(139,92,246,0.07)' : 'rgba(10,18,36,1)',
        boxShadow:       isActive ? `0 0 32px -6px ${C.violetGlow}` : 'none',
      }}
      transition={{ duration: 0.3 }}
    >
      {/* Top strip */}
      <motion.div
        className="h-0.5 w-full bg-violet-500"
        animate={{ opacity: isActive ? 1 : 0.15 }}
      />

      {/* Class header */}
      <div className="px-4 pt-3 pb-2 border-b border-white/[0.07]">
        <p className="text-[9px] text-slate-600 font-mono uppercase tracking-wider">class</p>
        <p className="text-base font-bold text-violet-300 font-mono">Singleton</p>
      </div>

      {/* Private constructor row */}
      <motion.div
        className="px-4 py-2.5 border-b border-white/[0.07] flex items-center gap-2"
        animate={{
          backgroundColor: constructorBlocked ? 'rgba(244,63,94,0.1)' : 'transparent',
        }}
        transition={{ duration: 0.3 }}
      >
        <motion.span
          className="text-sm"
          animate={{ scale: constructorBlocked ? [1, 1.3, 1] : 1 }}
          transition={{ duration: 0.4 }}
        >
          🔒
        </motion.span>
        <div>
          <p className="text-[9px] text-slate-500 uppercase tracking-wide font-mono">access modifier</p>
          <motion.p
            className="text-xs font-mono font-semibold"
            animate={{ color: constructorBlocked ? C.red : '#64748b' }}
          >
            private Singleton()
          </motion.p>
        </div>
        <AnimatePresence>
          {constructorBlocked && (
            <motion.span
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="ml-auto text-[9px] font-bold text-rose-400 border border-rose-500/40 rounded px-1.5 py-0.5 bg-rose-500/10"
            >
              BLOCKED
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Instance field row */}
      <div className="px-4 py-2.5 border-b border-white/[0.07] flex items-center gap-3">
        <div className="min-w-0">
          <p className="text-[9px] text-slate-500 uppercase tracking-wide font-mono">field</p>
          <p className="text-xs font-mono text-slate-400">
            instance ={' '}
            <motion.span
              animate={{ color: instanceCreated ? C.emerald : '#475569' }}
              className="font-semibold"
            >
              {instanceCreated ? 'ref' : 'null'}
            </motion.span>
          </p>
        </div>
        {/* Instance indicator */}
        <motion.div
          className="shrink-0 w-4 h-4 rounded-full border-2 ml-auto"
          animate={{
            borderColor:     instanceCreated ? C.emerald : 'rgba(255,255,255,0.12)',
            backgroundColor: instanceCreated ? C.emerald : 'transparent',
            boxShadow:       instanceCreated ? `0 0 10px 2px ${C.emeraldGlow}` : 'none',
            scale:           instanceCreated ? [1, 1.4, 1] : 1,
          }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* getInstance method */}
      <div className="px-4 py-2.5 flex-1 flex items-center">
        <p className="text-xs font-mono text-slate-400">
          <span className="text-violet-400">+</span>{' '}
          <span className="text-white">getInstance</span>
          <span className="text-slate-500">(): Singleton</span>
        </p>
      </div>
    </motion.div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SingletonAnimation() {
  const steps  = useMemo(() => STEPS, [])
  const runner = useTtsRunner(steps, (s) => `${s.message}. ${s.detail}`)
  const { step } = runner

  const clients = [
    { id: 'a', label: 'Client A' },
    { id: 'b', label: 'Client B' },
    { id: 'c', label: 'Client C' },
  ]

  return (
    <div className="space-y-4">
      {/* Diagram */}
      <div
        className="rounded-2xl border border-white/10 p-3"
        style={{
          background: '#060d1a',
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      >
        <div className="flex items-stretch gap-3" style={{ minHeight: 220 }}>
          {/* Left: Clients */}
          <div className="flex flex-col gap-3 justify-between flex-1" style={{ maxWidth: 148 }}>
            {clients.map((cl) => (
              <ClientBox
                key={cl.id}
                label={cl.label}
                isActive={step.activeClients.includes(cl.id)}
                hasRef={step.clientRefs.includes(cl.id)}
              />
            ))}
          </div>

          {/* Arrows */}
          <div className="flex flex-col gap-3 justify-between py-4" style={{ width: 48 }}>
            {clients.map((cl) => (
              <Arrow key={cl.id} active={step.requestArrows.includes(cl.id)} />
            ))}
          </div>

          {/* Right: Singleton class */}
          <div className="flex-1">
            <SingletonBox
              isActive={step.singletonActive}
              constructorBlocked={step.constructorBlocked}
              instanceState={step.instanceState}
            />
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 px-1 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-500" style={{ boxShadow: '0 0 6px 1px rgba(16,185,129,0.6)' }} />
            <span className="text-[10px] text-slate-500">holds reference</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-px rounded-full bg-blue-500" style={{ boxShadow: '0 0 4px rgba(59,130,246,0.8)' }} />
            <span className="text-[10px] text-slate-500">calls getInstance()</span>
          </div>
        </div>
      </div>

      {/* Step message */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step.message}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 space-y-1"
        >
          <p className="text-sm font-semibold text-white">{step.message}</p>
          <p className="text-xs text-slate-400 leading-relaxed">{step.detail}</p>
        </motion.div>
      </AnimatePresence>

      <StepControls runner={runner} />
    </div>
  )
}
