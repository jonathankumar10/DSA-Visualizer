import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTtsRunner } from '../../../hooks/useTtsRunner'
import StepControls from '../../../components/ui/StepControls'

const STEPS = [
  {
    layers: 0, cost: 2.0, callChain: [],
    message: 'The Decorator Pattern',
    detail: 'Attach new behaviours to objects by wrapping them in decorator objects that share the same interface. Stack as many decorators as you like — each adds a thin layer of responsibility.',
  },
  {
    layers: 1, cost: 2.0, callChain: ['SimpleCoffee'],
    message: 'Start with the base component — SimpleCoffee at $2.00',
    detail: 'SimpleCoffee is the ConcreteComponent. It implements the Coffee interface with cost() → 2.00 and getDescription() → "Simple coffee". This is the object we will decorate.',
  },
  {
    layers: 2, cost: 2.50, callChain: ['SimpleCoffee', 'MilkDecorator'],
    message: 'Wrap it in MilkDecorator — adds $0.50',
    detail: 'MilkDecorator wraps SimpleCoffee and implements the same Coffee interface. Its cost() calls wrapped.cost() + 0.50. The caller cannot tell the difference — it still just calls cost().',
  },
  {
    layers: 3, cost: 3.25, callChain: ['SimpleCoffee', 'MilkDecorator', 'SugarDecorator'],
    message: 'Wrap again with SugarDecorator — adds $0.75',
    detail: 'SugarDecorator wraps the already-decorated object. Its cost() calls wrapped.cost() + 0.75. The chain is now: SugarDecorator → MilkDecorator → SimpleCoffee. Each delegates down.',
  },
  {
    layers: 4, cost: 4.25, callChain: ['SimpleCoffee', 'MilkDecorator', 'SugarDecorator', 'VanillaDecorator'],
    message: 'One more — VanillaDecorator adds $1.00',
    detail: 'A third decorator wraps the chain. When you call cost() on VanillaDecorator, it calls down through each layer all the way to SimpleCoffee and sums the results: 2.00 + 0.50 + 0.75 + 1.00 = $4.25.',
  },
  {
    layers: 1, cost: 2.0, callChain: ['SimpleCoffee'],
    message: 'Each combination is a different object — no subclass explosion',
    detail: 'Without Decorator, you would need a subclass for every combination: MilkCoffee, SugarCoffee, VanillaMilkCoffee, VanillaSugarCoffee… With Decorator, 3 classes cover all combinations. Each wraps the next at runtime.',
  },
]

const DECORATOR_COLORS = [
  { label: 'SimpleCoffee',     sub: 'base',    color: '#64748b', glow: 'rgba(100,116,139,0.5)',  icon: '☕' },
  { label: 'MilkDecorator',    sub: '+$0.50',  color: '#06b6d4', glow: 'rgba(6,182,212,0.55)',   icon: '🥛' },
  { label: 'SugarDecorator',   sub: '+$0.75',  color: '#f59e0b', glow: 'rgba(245,158,11,0.55)',  icon: '🍬' },
  { label: 'VanillaDecorator', sub: '+$1.00',  color: '#8b5cf6', glow: 'rgba(139,92,246,0.55)',  icon: '🌿' },
]

export default function DecoratorAnimation() {
  const steps  = useMemo(() => STEPS, [])
  const runner = useTtsRunner(steps, (s) => `${s.message}. ${s.detail}`)
  const { step } = runner

  const visibleLayers = DECORATOR_COLORS.slice(0, step.layers)

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 p-4"
        style={{ background: '#060d1a', backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>

        {/* Stacked decorator layers */}
        <div className="flex flex-col-reverse gap-1.5 mb-3" style={{ minHeight: 160 }}>
          <AnimatePresence>
            {visibleLayers.map((layer, i) => (
              <motion.div
                key={layer.label}
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22, delay: 0 }}
                className="rounded-xl border-2 px-4 py-2.5 flex items-center justify-between"
                style={{
                  borderColor:     layer.color,
                  backgroundColor: `${layer.color}12`,
                  boxShadow:       i === visibleLayers.length - 1 ? `0 0 20px -5px ${layer.glow}` : 'none',
                  marginLeft:      i * 0,
                }}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{layer.icon}</span>
                  <div>
                    <p className="text-[9px] font-mono text-slate-500 uppercase">{i === 0 ? 'component' : 'decorator'}</p>
                    <p className="text-xs font-bold font-mono" style={{ color: layer.color }}>{layer.label}</p>
                  </div>
                </div>
                <p className="text-[10px] font-mono text-slate-500">{layer.sub}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Cost total */}
        <motion.div
          className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 flex items-center justify-between"
          animate={{ borderColor: step.layers > 0 ? visibleLayers[visibleLayers.length - 1]?.color ?? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.1)' }}
        >
          <div>
            <p className="text-[9px] font-mono text-slate-500 uppercase">call chain</p>
            <p className="text-[10px] font-mono text-slate-400">
              {step.callChain.join(' → ')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-mono text-slate-500 uppercase">cost()</p>
            <motion.p
              key={step.cost}
              initial={{ scale: 1.3, color: '#fff' }}
              animate={{ scale: 1, color: '#a5b4fc' }}
              className="text-lg font-bold font-mono"
            >
              ${step.cost.toFixed(2)}
            </motion.p>
          </div>
        </motion.div>
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
