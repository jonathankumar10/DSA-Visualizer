import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTtsRunner } from '../../../hooks/useTtsRunner'
import StepControls from '../../../components/ui/StepControls'

const SUBSYSTEMS = [
  { id: 'projector', label: 'Projector',    icon: '📽️', color: '#3b82f6', method: 'turnOn()' },
  { id: 'lights',    label: 'SmartLights',  icon: '💡', color: '#f59e0b', method: 'dim(10%)' },
  { id: 'speakers',  label: 'Surround Sound',icon: '🔊', color: '#10b981', method: 'setVolume(80)' },
  { id: 'player',    label: 'BluRay Player', icon: '💿', color: '#8b5cf6', method: 'play(movie)' },
  { id: 'blinds',    label: 'Blinds',        icon: '🪟', color: '#06b6d4', method: 'close()' },
]

const STEPS = [
  {
    facadeActive: false, activeSubsystems: [], clientDirect: false,
    message: 'The Facade Pattern',
    detail: 'Provide a simplified interface to a complex subsystem. The Facade knows how to coordinate the subsystem classes so the client does not have to.',
  },
  {
    facadeActive: false, activeSubsystems: ['projector', 'lights', 'speakers', 'player', 'blinds'], clientDirect: true,
    message: 'Without Facade — client must call every subsystem directly',
    detail: 'To watch a movie the client would need to call: Projector.turnOn(), SmartLights.dim(10%), SurroundSound.setVolume(80), BluRay.play(), Blinds.close(). Five calls, five dependencies, easy to get wrong.',
  },
  {
    facadeActive: true, activeSubsystems: [], clientDirect: false,
    message: 'Enter the Facade — one method hides the complexity',
    detail: 'HomeTheatreFacade exposes a single watchMovie() method. The client calls that one method and the facade takes care of everything. The subsystems still exist — they are just hidden behind the Facade.',
  },
  {
    facadeActive: true, activeSubsystems: ['projector'], clientDirect: false,
    message: 'watchMovie() — projector turns on first',
    detail: 'The Facade calls Projector.turnOn(). The client did not ask for this — the Facade knows the correct order and handles it automatically.',
  },
  {
    facadeActive: true, activeSubsystems: ['projector', 'lights', 'blinds'], clientDirect: false,
    message: 'Lights dim, blinds close',
    detail: 'The Facade continues orchestrating: lights dim to 10% and blinds close. The client is still waiting on the single watchMovie() call.',
  },
  {
    facadeActive: true, activeSubsystems: ['projector', 'lights', 'speakers', 'player', 'blinds'], clientDirect: false,
    message: 'Speakers and player start — movie begins',
    detail: 'Finally speakers and BluRay player start. All five subsystems are now configured in the right order. The client made one call. The Facade made five.',
  },
  {
    facadeActive: true, activeSubsystems: [], clientDirect: false,
    message: 'Subsystems are still accessible for advanced use',
    detail: 'The Facade does not lock you out of the subsystems. Power users can still call them directly. Facade adds a simple layer on top — it does not restrict access.',
  },
]

export default function FacadeAnimation() {
  const steps  = useMemo(() => STEPS, [])
  const runner = useTtsRunner(steps, (s) => `${s.message}. ${s.detail}`)
  const { step } = runner

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 p-4"
        style={{ background: '#060d1a', backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>

        <div className="flex gap-3">
          {/* Client + Facade (left) */}
          <div className="flex flex-col gap-2.5" style={{ width: 130 }}>
            {/* Client */}
            <motion.div className="rounded-xl border-2 p-2.5"
              animate={{ borderColor: step.facadeActive || step.clientDirect ? '#64748b' : 'rgba(255,255,255,0.07)', backgroundColor: 'rgba(10,18,36,1)' }}>
              <p className="text-[9px] text-slate-600 font-mono uppercase">client</p>
              <p className="text-xs font-bold text-slate-300 font-mono">App</p>
              <motion.p className="text-[9px] font-mono mt-1"
                animate={{ color: step.facadeActive ? '#a78bfa' : step.clientDirect ? '#f43f5e' : '#374151' }}>
                {step.facadeActive ? 'watchMovie()' : step.clientDirect ? '5 direct calls' : '...'}
              </motion.p>
            </motion.div>

            {/* Facade */}
            <motion.div className="flex-1 rounded-xl border-2 p-2.5 flex flex-col"
              animate={{ borderColor: step.facadeActive ? '#8b5cf6' : 'rgba(255,255,255,0.07)', backgroundColor: step.facadeActive ? 'rgba(139,92,246,0.1)' : 'rgba(10,18,36,1)', boxShadow: step.facadeActive ? '0 0 20px -5px rgba(139,92,246,0.5)' : 'none' }}>
              <p className="text-[9px] text-slate-600 font-mono uppercase">facade</p>
              <p className="text-xs font-bold text-violet-300 font-mono">HomeTheatre</p>
              <motion.p className="text-[10px] font-mono mt-1.5"
                animate={{ color: step.facadeActive ? '#c4b5fd' : '#374151' }}>
                + watchMovie()
              </motion.p>
              <motion.p className="text-[10px] font-mono"
                animate={{ color: step.facadeActive ? '#c4b5fd' : '#374151' }}>
                + endMovie()
              </motion.p>
            </motion.div>
          </div>

          {/* Arrows */}
          <div className="flex flex-col justify-around gap-1.5 py-2" style={{ width: 24 }}>
            {SUBSYSTEMS.map((sys) => {
              const active = step.activeSubsystems.includes(sys.id)
              return (
                <div key={sys.id} className="relative flex items-center h-4">
                  <motion.div className="absolute inset-0 h-px top-1/2 -translate-y-1/2 rounded-full"
                    animate={{ backgroundColor: active ? sys.color : 'rgba(255,255,255,0.06)' }} />
                  <div className="absolute right-0" style={{ borderTop: '3px solid transparent', borderBottom: '3px solid transparent', borderLeft: `4px solid ${active ? sys.color : 'rgba(255,255,255,0.06)'}` }} />
                </div>
              )
            })}
          </div>

          {/* Subsystems (right) */}
          <div className="flex-1 flex flex-col gap-1.5">
            {SUBSYSTEMS.map((sys) => {
              const active = step.activeSubsystems.includes(sys.id)
              const direct = step.clientDirect
              return (
                <motion.div key={sys.id}
                  className="rounded-lg border px-2.5 py-1.5 flex items-center gap-2"
                  animate={{
                    borderColor:     active ? sys.color : direct ? `${sys.color}44` : 'rgba(255,255,255,0.07)',
                    backgroundColor: active ? `${sys.color}15` : 'rgba(10,18,36,1)',
                    boxShadow:       active ? `0 0 14px -4px ${sys.color}99` : 'none',
                  }}
                >
                  <span className="text-base leading-none">{sys.icon}</span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-white">{sys.label}</p>
                    <motion.p className="text-[9px] font-mono truncate"
                      animate={{ color: active ? sys.color : '#374151' }}>{sys.method}</motion.p>
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
