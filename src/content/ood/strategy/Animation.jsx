import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTtsRunner } from '../../../hooks/useTtsRunner'
import StepControls from '../../../components/ui/StepControls'

const STRATEGIES = [
  { id: 'quick',  label: 'QuickSort',   sub: 'O(n log n) avg', color: '#3b82f6', glow: 'rgba(59,130,246,0.55)' },
  { id: 'merge',  label: 'MergeSort',   sub: 'O(n log n) stable', color: '#10b981', glow: 'rgba(16,185,129,0.55)' },
  { id: 'bubble', label: 'BubbleSort',  sub: 'O(n²) simple', color: '#f59e0b', glow: 'rgba(245,158,11,0.55)' },
]

const STEPS = [
  {
    activeStrategy: null, contextActive: false,
    message: 'The Strategy Pattern',
    detail: 'Define a family of algorithms, encapsulate each one, and make them interchangeable. The client picks which algorithm to use at runtime — without changing the code that uses it.',
  },
  {
    activeStrategy: null, contextActive: true,
    message: 'The Context holds a strategy reference',
    detail: 'The Context class has a field that holds a Strategy object. It delegates all algorithm work to whatever is currently in that field. The Context itself has no algorithm logic.',
  },
  {
    activeStrategy: 'quick', contextActive: true,
    message: 'Inject QuickSort — Context uses it',
    detail: 'We set the strategy to QuickSort. When Context.sort() is called, it delegates to QuickSort.execute(). The Context code did not change — only the injected strategy did.',
  },
  {
    activeStrategy: 'merge', contextActive: true,
    message: 'Swap in MergeSort at runtime',
    detail: 'At any point we can replace the strategy with a different one. Calling setStrategy(new MergeSort()) swaps the algorithm. The next sort() call now uses MergeSort — same Context, different behaviour.',
  },
  {
    activeStrategy: 'bubble', contextActive: true,
    message: 'Or BubbleSort — the Context never changes',
    detail: 'The same swap works for BubbleSort or any future algorithm we add. Each strategy is a separate class. Adding a new algorithm means adding one class — nothing else changes.',
  },
  {
    activeStrategy: 'merge', contextActive: true,
    message: 'Strategies are interchangeable — pick the right one for the job',
    detail: 'Small dataset? BubbleSort is fine. Need stability? MergeSort. Need raw speed? QuickSort. The caller decides at runtime. This is the entire point of the Strategy pattern.',
  },
]

function StrategyBox({ strategy, isActive, isSelected }) {
  return (
    <motion.div
      className="rounded-xl border-2 px-3 py-2.5 flex items-center justify-between gap-2"
      animate={{
        borderColor:     isSelected ? strategy.color : isActive ? `${strategy.color}55` : 'rgba(255,255,255,0.07)',
        backgroundColor: isSelected ? `${strategy.color}18` : 'rgba(10,18,36,1)',
        boxShadow:       isSelected ? `0 0 20px -4px ${strategy.glow}` : 'none',
      }}
      transition={{ duration: 0.3 }}
    >
      <div>
        <p className="text-[9px] text-slate-600 font-mono uppercase">ConcreteStrategy</p>
        <p className="text-sm font-bold font-mono" style={{ color: isSelected ? strategy.color : '#94a3b8' }}>{strategy.label}</p>
        <p className="text-[10px] text-slate-600">{strategy.sub}</p>
      </div>
      <motion.div
        className="w-2 h-2 rounded-full shrink-0"
        animate={{ backgroundColor: isSelected ? strategy.color : 'rgba(255,255,255,0.1)', boxShadow: isSelected ? `0 0 8px 2px ${strategy.glow}` : 'none' }}
      />
    </motion.div>
  )
}

export default function StrategyAnimation() {
  const steps  = useMemo(() => STEPS, [])
  const runner = useTtsRunner(steps, (s) => `${s.message}. ${s.detail}`)
  const { step } = runner

  const selected = STRATEGIES.find((s) => s.id === step.activeStrategy)

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 p-4"
        style={{ background: '#060d1a', backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>

        <div className="flex gap-4 items-stretch">
          {/* Context box */}
          <motion.div
            className="flex-1 rounded-2xl border-2 overflow-hidden flex flex-col"
            animate={{
              borderColor:     step.contextActive ? '#8b5cf6' : 'rgba(255,255,255,0.08)',
              backgroundColor: step.contextActive ? 'rgba(139,92,246,0.07)' : 'rgba(10,18,36,1)',
              boxShadow:       step.contextActive ? '0 0 24px -6px rgba(139,92,246,0.5)' : 'none',
            }}
          >
            <motion.div className="h-0.5 bg-violet-500" animate={{ opacity: step.contextActive ? 1 : 0.12 }} />
            <div className="px-4 pt-3 pb-2 border-b border-white/[0.07]">
              <p className="text-[9px] text-slate-600 font-mono uppercase">class</p>
              <p className="text-sm font-bold text-violet-300 font-mono">Context</p>
            </div>
            <div className="px-4 py-2.5 border-b border-white/[0.07]">
              <p className="text-[9px] text-slate-500 font-mono">field</p>
              <p className="text-xs font-mono text-slate-400">
                strategy ={' '}
                <motion.span
                  className="font-semibold"
                  animate={{ color: selected ? selected.color : '#475569' }}
                >
                  {selected ? selected.label : 'null'}
                </motion.span>
              </p>
            </div>
            <div className="px-4 py-2.5 flex-1 flex flex-col justify-center gap-1.5">
              <p className="text-xs font-mono text-slate-400">
                <span className="text-violet-400">+</span> <span className="text-white">setStrategy</span><span className="text-slate-500">(s)</span>
              </p>
              <p className="text-xs font-mono text-slate-400">
                <span className="text-violet-400">+</span> <span className="text-white">sort</span><span className="text-slate-500">(): void</span>
              </p>
            </div>
          </motion.div>

          {/* Arrow */}
          <div className="flex items-center">
            <motion.div className="h-px w-8 rounded-full" animate={{ backgroundColor: selected ? selected.color : 'rgba(255,255,255,0.08)' }} />
            <motion.div style={{ borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: `5px solid ${selected ? selected.color : 'rgba(255,255,255,0.08)'}` }} />
          </div>

          {/* Strategies */}
          <div className="flex-1 flex flex-col gap-2.5">
            <p className="text-[9px] text-slate-600 font-mono uppercase tracking-wider px-1">«interface» Strategy</p>
            {STRATEGIES.map((s) => (
              <StrategyBox
                key={s.id}
                strategy={s}
                isActive={step.contextActive}
                isSelected={step.activeStrategy === s.id}
              />
            ))}
          </div>
        </div>
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
