import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTtsRunner } from '../../../hooks/useTtsRunner'
import StepControls from '../../../components/ui/StepControls'

const BUILD_STEPS = ['Foundation', 'Walls', 'Roof', 'Windows', 'Interior']

const STEPS = [
  {
    directorActive: false, builderActive: false, builtParts: [], builderType: null,
    message: 'The Builder Pattern',
    detail: 'Separate the construction of a complex object from its representation. The same step-by-step process can produce different results depending on which Builder is used.',
  },
  {
    directorActive: true, builderActive: false, builtParts: [], builderType: null,
    message: 'The Director knows the construction steps',
    detail: 'The Director class knows exactly what to build and in what order — foundation first, then walls, then roof. It does not know how each step is done. That is the Builder\'s job.',
  },
  {
    directorActive: true, builderActive: true, builtParts: [], builderType: 'wooden',
    message: 'Director receives a WoodenHouseBuilder',
    detail: 'We hand the Director a WoodenHouseBuilder. Now when the Director calls each step, the Builder implements them using wood. The Director code never changes — we just swap the Builder.',
  },
  {
    directorActive: true, builderActive: true, builtParts: ['Foundation', 'Walls'], builderType: 'wooden',
    message: 'Director calls buildFoundation() and buildWalls()',
    detail: 'The Director calls the first two steps. WoodenHouseBuilder lays a wooden foundation and builds wooden walls. The product is taking shape — but it is not retrievable yet.',
  },
  {
    directorActive: true, builderActive: true, builtParts: ['Foundation', 'Walls', 'Roof', 'Windows', 'Interior'], builderType: 'wooden',
    message: 'All steps complete — product is ready',
    detail: 'After all five steps the Director calls getResult(). WoodenHouseBuilder returns the completed wooden house. The Director never touched the house object directly.',
  },
  {
    directorActive: true, builderActive: true, builtParts: ['Foundation', 'Walls', 'Roof', 'Windows', 'Interior'], builderType: 'stone',
    message: 'Swap to StoneHouseBuilder — same Director, different product',
    detail: 'Replace the Builder with StoneHouseBuilder. The Director runs the same sequence of steps. This time each step produces stone components. Same construction logic, completely different house.',
  },
  {
    directorActive: false, builderActive: false, builtParts: [], builderType: null,
    message: 'Builder eliminates telescoping constructors',
    detail: 'Without Builder, a complex object might need a constructor with 10+ parameters. With Builder, you chain readable method calls and call getResult() at the end. The Director makes it reproducible.',
  },
]

const BUILDER_COLORS = {
  wooden: { color: '#f59e0b', glow: 'rgba(245,158,11,0.55)', label: 'WoodenHouseBuilder', icon: '🪵' },
  stone:  { color: '#94a3b8', glow: 'rgba(148,163,184,0.5)',  label: 'StoneHouseBuilder',  icon: '🪨' },
}

export default function BuilderAnimation() {
  const steps  = useMemo(() => STEPS, [])
  const runner = useTtsRunner(steps, (s) => `${s.message}. ${s.detail}`)
  const { step } = runner

  const builder = step.builderType ? BUILDER_COLORS[step.builderType] : null

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 p-4"
        style={{ background: '#060d1a', backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>

        <div className="flex gap-3 items-start">
          {/* Director */}
          <motion.div
            className="rounded-xl border-2 p-3 flex-shrink-0"
            style={{ width: 128 }}
            animate={{ borderColor: step.directorActive ? '#6366f1' : 'rgba(255,255,255,0.08)', backgroundColor: step.directorActive ? 'rgba(99,102,241,0.1)' : 'rgba(10,18,36,1)', boxShadow: step.directorActive ? '0 0 18px -5px rgba(99,102,241,0.5)' : 'none' }}
          >
            <p className="text-[9px] text-slate-600 font-mono uppercase">director</p>
            <p className="text-xs font-bold text-indigo-300 font-mono mb-2">Director</p>
            {BUILD_STEPS.slice(0, 3).map((s) => (
              <p key={s} className="text-[9px] font-mono text-slate-500">build{s}()</p>
            ))}
            <p className="text-[9px] font-mono text-slate-600">…</p>
          </motion.div>

          {/* Arrow */}
          <div className="flex items-center mt-8">
            <motion.div className="h-px w-5 rounded-full" animate={{ backgroundColor: builder ? builder.color : 'rgba(255,255,255,0.06)' }} />
            <div style={{ borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: `5px solid ${builder ? builder.color : 'rgba(255,255,255,0.06)'}` }} />
          </div>

          {/* Builder */}
          <motion.div
            className="flex-1 rounded-xl border-2 p-3"
            animate={{
              borderColor:     builder ? builder.color : 'rgba(255,255,255,0.07)',
              backgroundColor: builder ? `${builder.color}12` : 'rgba(10,18,36,1)',
              boxShadow:       builder ? `0 0 18px -5px ${builder.glow}` : 'none',
            }}
          >
            <p className="text-[9px] text-slate-600 font-mono uppercase">«interface» Builder</p>
            <AnimatePresence mode="wait">
              {builder ? (
                <motion.div key={builder.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <p className="text-xs font-bold font-mono mt-0.5 flex items-center gap-1.5" style={{ color: builder.color }}>
                    <span>{builder.icon}</span> {builder.label}
                  </p>
                </motion.div>
              ) : (
                <p className="text-xs text-slate-600 font-mono mt-0.5 italic">no builder set</p>
              )}
            </AnimatePresence>

            {/* Build progress */}
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {BUILD_STEPS.map((part) => {
                const done = step.builtParts.includes(part)
                return (
                  <motion.div key={part}
                    className="rounded border px-2 py-0.5 text-[9px] font-mono"
                    animate={{
                      borderColor:     done ? (builder?.color ?? '#10b981') : 'rgba(255,255,255,0.1)',
                      backgroundColor: done ? `${builder?.color ?? '#10b981'}20` : 'transparent',
                      color:           done ? (builder?.color ?? '#10b981') : '#374151',
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    {done ? '✓ ' : ''}{part}
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        </div>

        {/* Product preview */}
        <AnimatePresence>
          {step.builtParts.length === BUILD_STEPS.length && builder && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-3 rounded-xl border-2 p-3 flex items-center gap-3"
              style={{ borderColor: builder.color, backgroundColor: `${builder.color}10` }}
            >
              <span className="text-2xl">{step.builderType === 'wooden' ? '🏡' : '🏰'}</span>
              <div>
                <p className="text-[9px] text-slate-500 font-mono uppercase">Product (getResult())</p>
                <p className="text-sm font-bold" style={{ color: builder.color }}>
                  {step.builderType === 'wooden' ? 'Wooden House' : 'Stone House'}
                </p>
                <p className="text-[10px] text-slate-500">{BUILD_STEPS.length} parts assembled</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step.message} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 space-y-1">
          <p className="text-sm font-semibold text-white">{step.message}</p>
          <p className="text-xs text-slate-400 leading-relaxed">{step.detail}</p>
        </motion.div>
      </AnimatePresence>
      <StepControls runner={runner} />
    </div>
  )
}
