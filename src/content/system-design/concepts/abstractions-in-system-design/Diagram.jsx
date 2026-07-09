import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { buildAbstractionSteps } from './steps'
import { useStepRunner } from '../../../../hooks/useStepRunner'
import StepControls from '../../../../components/ui/StepControls'

// ── Part definitions ──────────────────────────────────────────────────────────
// Two views share one canvas: the exterior (car + interface controls) and the
// engine bay (revealed once the hood is "open"). Only one view's parts render
// at a time; AnimatePresence crossfades between them.

const INTERFACE_PARTS = [
  { id: 'wheel',     icon: '🎡', label: 'Steering Wheel', desc: 'Turn it, the car turns. You never need to know why.' },
  { id: 'pedals',    icon: '🦶', label: 'Pedals',          desc: 'Press the accelerator, the car speeds up. Press the brake, it slows.' },
  { id: 'dashboard', icon: '📊', label: 'Dashboard',       desc: 'Speed, fuel, warnings — the readout of the interface, not the implementation.' },
]

const ENGINE_PARTS = [
  { id: 'pistons',     icon: '🔧', label: 'Pistons',      desc: 'Convert combustion pressure into motion — one of dozens of precisely machined parts.' },
  { id: 'crankshaft',  icon: '⚙️', label: 'Crankshaft',   desc: 'Converts the pistons\' linear motion into rotation.' },
  { id: 'timingBelt',  icon: '🔗', label: 'Timing Belt',  desc: 'Keeps valves and pistons synchronized to the millisecond.' },
  { id: 'sparkPlugs',  icon: '🔥', label: 'Spark Plugs',  desc: 'Ignite the fuel-air mixture at precisely the right instant.' },
  { id: 'alternator',  icon: '🔋', label: 'Alternator',   desc: 'Charges the battery and powers electronics while the engine runs.' },
]

const PISTON_SPEC = { part: 'Part #4471-B', tolerance: 'Tolerance ±0.02 mm', material: 'Forged aluminum alloy' }

// ── Sports car silhouette ──────────────────────────────────────────────────────
// A generic low-slung supercar profile — sharp rake, rear wing, alloy wheels,
// racing stripe — the "flashy" version of "just a car."

function SportsCar({ hooded }) {
  return (
    <svg viewBox="0 0 220 92" width="220" height="92" className="overflow-visible select-none">
      <defs>
        <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#c4b5fd" />
          <stop offset="45%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#5b21b6" />
        </linearGradient>
        <linearGradient id="glassGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#38bdf8" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#0c4a6e" stopOpacity="0.85" />
        </linearGradient>
      </defs>

      {/* Shine sweep */}
      <motion.rect
        x="-40" y="10" width="30" height="70" fill="#ffffff" opacity="0.16"
        transform="skewX(-20)"
        animate={{ x: [-40, 230] }}
        transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 1.4, ease: 'easeInOut' }}
      />

      {/* Rear wing */}
      <rect x="172" y="26" width="4" height="14" fill="#4c1d95" />
      <rect x="188" y="26" width="4" height="14" fill="#4c1d95" />
      <rect x="168" y="20" width="28" height="6" rx="1.5" fill="url(#bodyGrad)" stroke="#4c1d95" strokeWidth="0.75" />

      {/* Body */}
      <path
        d="M12,68 C8,68 6,63 8,57 C12,46 26,40 40,39 L52,39 C62,26 80,20 100,19 L138,19 C152,20 162,27 170,36 L184,38 C198,39 206,46 208,55 C210,62 206,68 198,68 Z"
        fill="url(#bodyGrad)"
        stroke="#4c1d95"
        strokeWidth="1.2"
      />

      {/* Racing stripe */}
      <path d="M58,39 L96,19.4 L104,19.4 L70,39 Z" fill="#fbbf24" opacity="0.9" />

      {/* Glass cabin */}
      <path d="M58,38 C68,27 82,22 99,21 L128,21 C138,22 148,28 155,36 Z" fill="url(#glassGrad)" />

      {/* Front headlight */}
      <motion.ellipse
        cx="10" cy="58" rx="3.4" ry="2.4" fill="#fef3c7"
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Rear light */}
      <rect x="203" y="52" width="4" height="6" rx="1" fill="#f43f5e" />

      {/* Exhaust pipes */}
      <circle cx="198" cy="68" r="2.6" fill="#1e1b3a" stroke="#a78bfa" strokeWidth="0.6" />
      <circle cx="190" cy="68" r="2.6" fill="#1e1b3a" stroke="#a78bfa" strokeWidth="0.6" />

      {/* Wheels */}
      {[{ cx: 46 }, { cx: 168 }].map(({ cx }) => (
        <g key={cx}>
          <circle cx={cx} cy="68" r="15" fill="#0b0f19" stroke="#1e293b" strokeWidth="1.5" />
          <circle cx={cx} cy="68" r="8.5" fill="#334155" stroke="#94a3b8" strokeWidth="1" />
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <line
              key={deg}
              x1={cx} y1="68"
              x2={cx + 7 * Math.cos((deg * Math.PI) / 180)}
              y2={68 + 7 * Math.sin((deg * Math.PI) / 180)}
              stroke="#cbd5e1" strokeWidth="1"
            />
          ))}
          <circle cx={cx} cy="68" r="2.2" fill="#e2e8f0" />
        </g>
      ))}

      {/* Hood pop indicator */}
      <AnimatePresence>
        {hooded && (
          <motion.g
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
          >
            <path d="M52,39 L100,17 L146,20" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="3 2" />
          </motion.g>
        )}
      </AnimatePresence>
    </svg>
  )
}

// ── Part node ─────────────────────────────────────────────────────────────────

function PartNode({ part, isActive, isZoomed }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.85, y: 10 }}
      animate={{
        opacity: 1,
        scale: isZoomed ? 1.18 : 1,
        y: 0,
        borderColor: isActive ? '#8b5cf6' : 'rgba(255,255,255,0.1)',
        backgroundColor: isActive ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.02)',
      }}
      exit={{ opacity: 0, scale: 0.85, y: -10 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      className="relative flex flex-col items-center justify-center gap-1 rounded-xl border-2 px-3 py-3 w-[104px] sm:w-[118px]"
      style={{ boxShadow: isActive ? '0 0 24px -6px rgba(139,92,246,0.65)' : 'none', zIndex: isZoomed ? 10 : 1 }}
    >
      <span className="text-2xl leading-none select-none">{part.icon}</span>
      <span className={`text-[10px] font-bold text-center leading-tight ${isActive ? 'text-violet-200' : 'text-slate-500'}`}>
        {part.label}
      </span>

      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 340, damping: 24 }}
            className="absolute top-[105%] z-20 w-48 rounded-xl border border-violet-500/40 bg-slate-900/97 backdrop-blur shadow-2xl p-3 space-y-1"
          >
            <p className="text-[10px] font-mono text-violet-300">{PISTON_SPEC.part}</p>
            <p className="text-[10px] font-mono text-violet-300">{PISTON_SPEC.tolerance}</p>
            <p className="text-[10px] font-mono text-violet-300">{PISTON_SPEC.material}</p>
            <p className="text-[9px] text-slate-500 pt-1 border-t border-white/10">
              Precise — and no longer "a car."
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AbstractionDiagram() {
  const steps  = useMemo(() => buildAbstractionSteps(), [])
  const runner = useStepRunner(steps)
  const { step } = runner

  return (
    <div className="space-y-4">

      <div>
        <h2 className="text-lg font-semibold text-white">A Car — Interface vs. Internals</h2>
        <p className="text-sm text-slate-400">
          Step through popping the hood. Watch the exact moment "a car" turns into one specific engine.
        </p>
      </div>

      <div
        className="rounded-2xl border border-white/10 p-4 sm:p-6"
        style={{
          background: '#060d1a',
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      >
        <div className="flex flex-col items-center gap-5 min-h-[220px] justify-center">

          <AnimatePresence mode="wait">
            {step.view === 'exterior' ? (
              <motion.div
                key="exterior"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center gap-6"
              >
                <div className="flex flex-col items-center gap-2">
                  <motion.div
                    animate={{ scale: step.activeParts.length ? 1 : 1.1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                  >
                    <SportsCar hooded={false} />
                  </motion.div>
                  <span className={`text-xs font-bold uppercase tracking-wider ${step.activeParts.length ? 'text-slate-600' : 'text-violet-300'}`}>
                    "A Car"
                  </span>
                </div>

                <motion.div
                  variants={{ show: { transition: { staggerChildren: 0.08 } } }}
                  initial="hidden"
                  animate="show"
                  className="flex flex-wrap justify-center gap-3"
                >
                  {INTERFACE_PARTS.map((part) => (
                    <PartNode key={part.id} part={part} isActive={step.activeParts.includes(part.id)} isZoomed={false} />
                  ))}
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="hood-open"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center gap-5"
              >
                <div className="flex flex-col items-center gap-1 scale-90">
                  <SportsCar hooded />
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-300">Hood Open</span>
                </div>

                <motion.div
                  variants={{ show: { transition: { staggerChildren: 0.08 } } }}
                  initial="hidden"
                  animate="show"
                  className="flex flex-wrap justify-center gap-3 sm:gap-4"
                >
                  {ENGINE_PARTS.map((part) => (
                    <PartNode
                      key={part.id}
                      part={part}
                      isActive={step.activeParts.includes(part.id)}
                      isZoomed={step.zoomPart === part.id}
                    />
                  ))}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

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
