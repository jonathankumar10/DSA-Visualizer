import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTtsRunner } from '../../../hooks/useTtsRunner'
import StepControls from '../../../components/ui/StepControls'

const STATES = [
  { id: 'idle',       label: 'IdleState',       icon: '⏸️', sub: 'waiting for coin',   color: '#64748b', glow: 'rgba(100,116,139,0.5)' },
  { id: 'hasMoney',   label: 'HasMoneyState',   icon: '💰', sub: 'coin inserted',      color: '#f59e0b', glow: 'rgba(245,158,11,0.55)' },
  { id: 'dispensing', label: 'DispensingState', icon: '🥤', sub: 'dispensing product', color: '#10b981', glow: 'rgba(16,185,129,0.55)' },
  { id: 'outOfStock', label: 'OutOfStockState', icon: '❌', sub: 'no products left',   color: '#f43f5e', glow: 'rgba(244,63,94,0.55)' },
]

const STEPS = [
  {
    activeState: 'idle', transition: null,
    message: 'The State Pattern',
    detail: 'An object changes its behaviour when its internal state changes. Instead of giant if/else chains, each state is a separate class that handles requests its own way.',
  },
  {
    activeState: 'idle', transition: null,
    message: 'Context starts in IdleState',
    detail: 'The vending machine starts idle. In this state: insertCoin() is the only valid action. pressButton() and cancel() do nothing — or show an error. The state object handles all of this.',
  },
  {
    activeState: 'hasMoney', transition: { from: 'idle', to: 'hasMoney', label: 'insertCoin()' },
    message: 'User inserts a coin — transition to HasMoneyState',
    detail: 'IdleState.insertCoin() records the coin amount and tells the Context to switch state to HasMoneyState. From now on, the same method calls behave completely differently.',
  },
  {
    activeState: 'dispensing', transition: { from: 'hasMoney', to: 'dispensing', label: 'pressButton()' },
    message: 'User selects a product — transition to DispensingState',
    detail: 'HasMoneyState.pressButton() validates the selection, deducts the price, and transitions to DispensingState. The product is dispensed and change is returned.',
  },
  {
    activeState: 'idle', transition: { from: 'dispensing', to: 'idle', label: 'dispenseDone()' },
    message: 'Dispensing complete — back to IdleState',
    detail: 'DispensingState.dispenseDone() transitions the machine back to IdleState, ready for the next customer. Each transition is clean and predictable.',
  },
  {
    activeState: 'outOfStock', transition: { from: 'idle', to: 'outOfStock', label: 'restock empty' },
    message: 'Stock runs out — OutOfStockState blocks purchases',
    detail: 'If products run out, the machine enters OutOfStockState. Now pressButton() does nothing and displays "out of stock". The same method, completely different behaviour — no conditionals needed.',
  },
  {
    activeState: 'idle', transition: { from: 'outOfStock', to: 'idle', label: 'restock()' },
    message: 'Restock — the pattern eliminates if/else chains',
    detail: 'After restocking, the machine returns to IdleState. Without the State pattern, all of this logic would be one massive switch statement inside the Context class. State makes each mode explicit and manageable.',
  },
]

export default function StateAnimation() {
  const steps  = useMemo(() => STEPS, [])
  const runner = useTtsRunner(steps, (s) => `${s.message}. ${s.detail}`)
  const { step } = runner

  const activeStateData = STATES.find((s) => s.id === step.activeState)

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 p-4"
        style={{ background: '#060d1a', backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>

        <div className="flex gap-4 items-start">
          {/* Context */}
          <motion.div
            className="rounded-2xl border-2 overflow-hidden flex flex-col"
            style={{ width: 148 }}
            animate={{
              borderColor:     activeStateData ? activeStateData.color : 'rgba(255,255,255,0.08)',
              backgroundColor: activeStateData ? `${activeStateData.color.replace(')', ',0.07)')}` : 'rgba(10,18,36,1)',
              boxShadow:       activeStateData ? `0 0 20px -5px ${activeStateData.glow}` : 'none',
            }}
          >
            <motion.div className="h-0.5" style={{ backgroundColor: activeStateData?.color ?? '#475569' }} animate={{ opacity: 0.8 }} />
            <div className="px-3 pt-3 pb-2 border-b border-white/[0.07]">
              <p className="text-[9px] text-slate-600 font-mono uppercase">context</p>
              <p className="text-sm font-bold text-cyan-300 font-mono">VendingMachine</p>
            </div>
            <div className="px-3 py-2.5 border-b border-white/[0.07]">
              <p className="text-[9px] text-slate-500 font-mono">current state</p>
              <motion.p className="text-xs font-mono font-semibold mt-0.5" animate={{ color: activeStateData ? activeStateData.color : '#475569' }}>
                {activeStateData?.label ?? '—'}
              </motion.p>
            </div>
            <div className="px-3 py-2.5 space-y-1">
              {['insertCoin()', 'pressButton()', 'cancel()'].map((m) => (
                <p key={m} className="text-[10px] font-mono text-slate-500">
                  <span className="text-cyan-500">+</span> {m}
                </p>
              ))}
            </div>
          </motion.div>

          {/* States grid */}
          <div className="flex-1 grid grid-cols-2 gap-2">
            {STATES.map((s) => {
              const isActive = step.activeState === s.id
              const isFrom   = step.transition?.from === s.id
              const isTo     = step.transition?.to   === s.id
              return (
                <motion.div key={s.id}
                  className="rounded-xl border-2 p-2.5 relative"
                  animate={{
                    borderColor:     isActive ? s.color : 'rgba(255,255,255,0.07)',
                    backgroundColor: isActive ? `${s.color}15` : 'rgba(10,18,36,1)',
                    boxShadow:       isActive ? `0 0 16px -4px ${s.glow}` : 'none',
                    scale:           isActive ? 1.02 : 1,
                  }}
                  transition={{ duration: 0.28 }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-base leading-none">{s.icon}</span>
                    <p className="text-[10px] font-bold font-mono" style={{ color: isActive ? s.color : '#64748b' }}>{s.label}</p>
                  </div>
                  <p className="text-[9px] text-slate-600">{s.sub}</p>
                  {(isFrom || isTo) && step.transition && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute -top-2 -right-2 rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold"
                      style={{ backgroundColor: isTo ? s.color : '#334155', color: isTo ? '#fff' : '#64748b' }}
                    >
                      {isTo ? '→' : '←'}
                    </motion.div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>

        {step.transition && (
          <motion.div
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 flex items-center gap-2"
          >
            <span className="text-[10px] text-slate-500 font-mono">transition:</span>
            <span className="text-[10px] font-mono text-slate-300">{step.transition.from}</span>
            <span className="text-[10px] text-blue-400">→</span>
            <span className="text-[10px] font-mono text-slate-300">{step.transition.to}</span>
            <span className="text-[10px] text-slate-600 ml-auto">via {step.transition.label}</span>
          </motion.div>
        )}
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
