import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTtsRunner } from '../../../hooks/useTtsRunner'
import StepControls from '../../../components/ui/StepControls'

const STEPS = [
  {
    clientActive: false, adapterActive: false, adapteeActive: false, blocked: false,
    callLabel: null, translateLabel: null,
    message: 'The Adapter Pattern',
    detail: 'Convert the interface of a class into another interface that clients expect. Adapter lets incompatible interfaces work together — like a power plug adapter for different socket standards.',
  },
  {
    clientActive: true, adapterActive: false, adapteeActive: false, blocked: true,
    callLabel: null, translateLabel: null,
    message: 'Client wants to call request() — but the Adaptee has a different interface',
    detail: 'The Client expects a Target with a request() method. The Adaptee already exists and works perfectly — but it exposes specificRequest() instead. Incompatible.',
  },
  {
    clientActive: true, adapterActive: true, adapteeActive: false, blocked: false,
    callLabel: 'request()', translateLabel: null,
    message: 'The Adapter implements the Target interface',
    detail: 'We create an Adapter that wraps the Adaptee and implements the Target interface. The Client now only needs to know about the Adapter — it calls request() as usual.',
  },
  {
    clientActive: true, adapterActive: true, adapteeActive: false, blocked: false,
    callLabel: 'request()', translateLabel: null,
    message: 'Client calls request() on the Adapter',
    detail: 'The Client calls request() on the Adapter as if it were the Target. The Client code did not change. It has no idea an Adapter is involved.',
  },
  {
    clientActive: false, adapterActive: true, adapteeActive: true, blocked: false,
    callLabel: null, translateLabel: 'specificRequest()',
    message: 'Adapter translates and calls specificRequest() on the Adaptee',
    detail: 'Inside request(), the Adapter translates the call to adaptee.specificRequest(). This translation is the entire job of the Adapter. The Adaptee code did not change either.',
  },
  {
    clientActive: true, adapterActive: true, adapteeActive: true, blocked: false,
    callLabel: 'request()', translateLabel: 'specificRequest()',
    message: 'Result flows back — two incompatible interfaces now work together',
    detail: 'The Adaptee returns its result to the Adapter, which adapts it back into the form the Client expects. Neither the Client nor the Adaptee was modified. The Adapter is the only new code.',
  },
]

export default function AdapterAnimation() {
  const steps  = useMemo(() => STEPS, [])
  const runner = useTtsRunner(steps, (s) => `${s.message}. ${s.detail}`)
  const { step } = runner

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 p-4"
        style={{ background: '#060d1a', backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>

        <div className="flex items-center gap-2">
          {/* Client */}
          <motion.div className="rounded-xl border-2 p-3 text-center" style={{ minWidth: 90 }}
            animate={{ borderColor: step.clientActive ? '#3b82f6' : 'rgba(255,255,255,0.07)', backgroundColor: step.clientActive ? 'rgba(59,130,246,0.1)' : 'rgba(10,18,36,1)', boxShadow: step.clientActive ? '0 0 18px -5px rgba(59,130,246,0.5)' : 'none' }}>
            <p className="text-[9px] text-slate-600 font-mono uppercase">client</p>
            <p className="text-xs font-bold text-blue-300 font-mono">App</p>
            <p className="text-[9px] font-mono mt-1" style={{ color: step.clientActive ? '#93c5fd' : '#374151' }}>calls request()</p>
          </motion.div>

          {/* Arrow Client → Adapter */}
          <div className="flex-1 relative flex items-center">
            <motion.div className="flex-1 h-px rounded-full" animate={{ backgroundColor: step.clientActive && !step.blocked ? '#3b82f6' : step.blocked ? '#f43f5e' : 'rgba(255,255,255,0.06)' }} />
            {step.callLabel && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-mono text-blue-400 whitespace-nowrap">
                {step.callLabel}
              </motion.div>
            )}
            {step.blocked && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="absolute left-1/2 -translate-x-1/2 text-lg">
                🚫
              </motion.div>
            )}
            {!step.blocked && <div style={{ borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: `5px solid ${step.clientActive ? '#3b82f6' : 'rgba(255,255,255,0.06)'}` }} />}
          </div>

          {/* Adapter */}
          <motion.div className="rounded-xl border-2 p-3 text-center" style={{ minWidth: 100 }}
            animate={{ borderColor: step.adapterActive ? '#8b5cf6' : 'rgba(255,255,255,0.07)', backgroundColor: step.adapterActive ? 'rgba(139,92,246,0.1)' : 'rgba(10,18,36,1)', boxShadow: step.adapterActive ? '0 0 18px -5px rgba(139,92,246,0.5)' : 'none' }}>
            <p className="text-[9px] text-slate-600 font-mono uppercase">adapter</p>
            <p className="text-xs font-bold text-violet-300 font-mono">PayPalAdapter</p>
            <p className="text-[9px] font-mono mt-1" style={{ color: step.adapterActive ? '#c4b5fd' : '#374151' }}>implements Target</p>
            <p className="text-[9px] font-mono" style={{ color: step.adapterActive ? '#c4b5fd' : '#374151' }}>wraps Adaptee</p>
          </motion.div>

          {/* Arrow Adapter → Adaptee */}
          <div className="flex-1 relative flex items-center">
            <motion.div className="flex-1 h-px rounded-full" animate={{ backgroundColor: step.adapteeActive ? '#10b981' : 'rgba(255,255,255,0.06)' }} />
            {step.translateLabel && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-mono text-emerald-400 whitespace-nowrap">
                {step.translateLabel}
              </motion.div>
            )}
            {step.adapteeActive && <div style={{ borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: '5px solid #10b981' }} />}
          </div>

          {/* Adaptee */}
          <motion.div className="rounded-xl border-2 p-3 text-center" style={{ minWidth: 100 }}
            animate={{ borderColor: step.adapteeActive ? '#10b981' : 'rgba(255,255,255,0.07)', backgroundColor: step.adapteeActive ? 'rgba(16,185,129,0.1)' : 'rgba(10,18,36,1)', boxShadow: step.adapteeActive ? '0 0 18px -5px rgba(16,185,129,0.5)' : 'none' }}>
            <p className="text-[9px] text-slate-600 font-mono uppercase">adaptee</p>
            <p className="text-xs font-bold text-emerald-300 font-mono">PayPalAPI</p>
            <p className="text-[9px] font-mono mt-1" style={{ color: step.adapteeActive ? '#6ee7b7' : '#374151' }}>specificRequest()</p>
            <p className="text-[9px] text-slate-600">incompatible</p>
          </motion.div>
        </div>

        {/* Interface labels */}
        <div className="mt-3 flex justify-between px-1">
          <div className="text-center" style={{ width: 90 }}>
            <p className="text-[9px] text-blue-500/60 font-mono">«Target»</p>
            <p className="text-[9px] text-blue-500/60 font-mono">request()</p>
          </div>
          <div />
          <div className="text-center" style={{ width: 100 }}>
            <p className="text-[9px] text-emerald-500/60 font-mono">existing code</p>
            <p className="text-[9px] text-emerald-500/60 font-mono">unchanged</p>
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
