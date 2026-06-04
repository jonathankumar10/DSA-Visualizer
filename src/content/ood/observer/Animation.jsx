import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTtsRunner } from '../../../hooks/useTtsRunner'
import StepControls from '../../../components/ui/StepControls'

const OBSERVERS = [
  { id: 'ui',    label: 'UI Display',    icon: '🖥️', color: '#3b82f6', glow: 'rgba(59,130,246,0.55)' },
  { id: 'email', label: 'Email Alert',   icon: '📧', color: '#10b981', glow: 'rgba(16,185,129,0.55)' },
  { id: 'log',   label: 'Audit Logger',  icon: '📋', color: '#f59e0b', glow: 'rgba(245,158,11,0.55)' },
]

const STEPS = [
  {
    subjectActive: false, notifying: false, subscribedIds: [], updatedIds: [], price: '—',
    message: 'The Observer Pattern',
    detail: 'When one object changes state, all its dependents are notified automatically. One subject, many observers — a one-to-many dependency with no tight coupling between them.',
  },
  {
    subjectActive: true, notifying: false, subscribedIds: ['ui'], updatedIds: [], price: '$100',
    message: 'Observers subscribe to the Subject',
    detail: 'The UI Display calls subject.subscribe(this). The Subject adds it to its internal list. Any time the subject changes, this observer will be notified.',
  },
  {
    subjectActive: true, notifying: false, subscribedIds: ['ui', 'email', 'log'], updatedIds: [], price: '$100',
    message: 'All three observers subscribe',
    detail: 'Email Alert and Audit Logger also subscribe. The subject now maintains a list of three observers. None of them know about each other — they only know the Subject.',
  },
  {
    subjectActive: true, notifying: false, subscribedIds: ['ui', 'email', 'log'], updatedIds: [], price: '$85',
    message: 'Subject state changes — price drops to $85',
    detail: 'The stock price changes. The Subject updates its internal state. Now it calls notify() to inform every subscriber that something changed.',
  },
  {
    subjectActive: true, notifying: true, subscribedIds: ['ui', 'email', 'log'], updatedIds: ['ui', 'email', 'log'], price: '$85',
    message: 'Subject notifies all observers',
    detail: 'notify() iterates through every observer and calls update() on each. The Subject does not care what they do — it just sends the signal.',
  },
  {
    subjectActive: false, notifying: false, subscribedIds: ['ui', 'email', 'log'], updatedIds: ['ui', 'email', 'log'], price: '$85',
    message: 'Each observer reacts independently',
    detail: 'UI Display refreshes the chart. Email Alert sends a notification. Audit Logger writes to the log. Same event, three different reactions — all decoupled from the Subject and from each other.',
  },
]

export default function ObserverAnimation() {
  const steps  = useMemo(() => STEPS, [])
  const runner = useTtsRunner(steps, (s) => `${s.message}. ${s.detail}`)
  const { step } = runner

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 p-4"
        style={{ background: '#060d1a', backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>

        <div className="flex gap-4 items-stretch">
          {/* Subject */}
          <div className="flex-1">
            <motion.div
              className="rounded-2xl border-2 overflow-hidden h-full flex flex-col"
              animate={{
                borderColor:     step.subjectActive ? '#f43f5e' : 'rgba(255,255,255,0.08)',
                backgroundColor: step.subjectActive ? 'rgba(244,63,94,0.07)' : 'rgba(10,18,36,1)',
                boxShadow:       step.subjectActive ? '0 0 24px -6px rgba(244,63,94,0.5)' : 'none',
              }}
            >
              <motion.div className="h-0.5 bg-rose-500" animate={{ opacity: step.subjectActive ? 1 : 0.12 }} />
              <div className="px-4 pt-3 pb-2 border-b border-white/[0.07]">
                <p className="text-[9px] text-slate-600 font-mono uppercase">class</p>
                <p className="text-sm font-bold text-rose-300 font-mono">StockSubject</p>
              </div>
              <div className="px-4 py-2.5 border-b border-white/[0.07] space-y-1.5">
                <div>
                  <p className="text-[9px] text-slate-500 font-mono">state</p>
                  <p className="text-xs font-mono">
                    price = <motion.span className="font-bold text-white" animate={{ color: step.notifying ? '#f43f5e' : '#fff' }}>{step.price}</motion.span>
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-500 font-mono">list</p>
                  <p className="text-xs font-mono text-slate-400">
                    observers[<span className="text-rose-300">{step.subscribedIds.length}</span>]
                  </p>
                </div>
              </div>
              <div className="px-4 py-2.5 flex-1 flex flex-col justify-center gap-1.5">
                <p className="text-xs font-mono text-slate-400"><span className="text-rose-400">+</span> <span className="text-white">subscribe</span><span className="text-slate-500">(o)</span></p>
                <p className="text-xs font-mono text-slate-400"><span className="text-rose-400">+</span> <span className="text-white">unsubscribe</span><span className="text-slate-500">(o)</span></p>
                <motion.p className="text-xs font-mono" animate={{ color: step.notifying ? '#f43f5e' : '#64748b' }}>
                  <span style={{ color: step.notifying ? '#f43f5e' : '#475569' }}>+</span>{' '}
                  <span className="text-white">notify</span><span className="text-slate-500">()</span>
                </motion.p>
              </div>
            </motion.div>
          </div>

          {/* Notification arrows */}
          <div className="flex flex-col justify-around gap-2 py-2" style={{ width: 40 }}>
            {OBSERVERS.map((obs) => {
              const isNotified = step.notifying && step.subscribedIds.includes(obs.id)
              return (
                <div key={obs.id} className="relative flex items-center h-5">
                  <motion.div className="absolute inset-0 h-px top-1/2 -translate-y-1/2 rounded-full"
                    animate={{ backgroundColor: isNotified ? obs.color : 'rgba(255,255,255,0.06)', boxShadow: isNotified ? `0 0 5px 1px ${obs.glow}` : 'none' }} />
                  {isNotified && (
                    <motion.div
                      className="absolute w-2 h-2 rounded-full top-1/2 -translate-y-1/2"
                      style={{ backgroundColor: obs.color, boxShadow: `0 0 6px 2px ${obs.glow}` }}
                      initial={{ left: '0%' }} animate={{ left: '88%' }}
                      transition={{ duration: 0.4, ease: 'linear', repeat: Infinity, repeatDelay: 0.2 }}
                    />
                  )}
                  <div className="absolute right-0" style={{ borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: `5px solid ${isNotified ? obs.color : 'rgba(255,255,255,0.06)'}` }} />
                </div>
              )
            })}
          </div>

          {/* Observers */}
          <div className="flex-1 flex flex-col gap-2.5">
            <p className="text-[9px] text-slate-600 font-mono uppercase tracking-wider px-1">«interface» Observer</p>
            {OBSERVERS.map((obs) => {
              const subscribed = step.subscribedIds.includes(obs.id)
              const updated    = step.updatedIds.includes(obs.id)
              return (
                <motion.div key={obs.id}
                  className="rounded-xl border-2 px-3 py-2.5 flex items-center gap-2.5"
                  animate={{
                    borderColor:     updated ? obs.color : subscribed ? `${obs.color}40` : 'rgba(255,255,255,0.07)',
                    backgroundColor: updated ? `${obs.color}15` : 'rgba(10,18,36,1)',
                    boxShadow:       updated ? `0 0 18px -4px ${obs.glow}` : 'none',
                  }}
                >
                  <span className="text-lg leading-none">{obs.icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white leading-tight">{obs.label}</p>
                    <p className="text-[9px] font-mono" style={{ color: subscribed ? obs.color : '#374151' }}>
                      {updated ? 'update() called ✓' : subscribed ? 'subscribed' : 'not subscribed'}
                    </p>
                  </div>
                </motion.div>
              )
            })}
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
