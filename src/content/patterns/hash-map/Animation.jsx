import { motion, AnimatePresence } from 'framer-motion'
import { usePatternAnimation } from '../../../hooks/usePatternAnimation'
import AnimationControls from '../../../components/ui/AnimationControls'

const ENTRIES = [
  { key: 'cat', val: 5, color: 'sky'    },
  { key: 'dog', val: 3, color: 'amber'  },
  { key: 'fox', val: 8, color: 'violet' },
]

// 0=empty 1=cat in 2=dog in 3=fox in 4=lookup dog 5=found 6=clear
const DURATIONS = [900, 800, 800, 800, 900, 1100, 1200]

const ROW_COLORS = {
  sky:    { text: 'text-sky-300'    },
  amber:  { text: 'text-amber-300'  },
  violet: { text: 'text-blue-300' },
}

const OP_LABELS = [
  <span className="text-slate-600">map = {'{}'}</span>,
  <span className="text-sky-300">{'map.set("cat", 5)'}</span>,
  <span className="text-amber-300">{'map.set("dog", 3)'}</span>,
  <span className="text-blue-300">{'map.set("fox", 8)'}</span>,
  <span className="text-white">{'map.get("dog") → ?'}</span>,
  <span className="text-emerald-300">{'map.get("dog") → '}<span className="font-black">3</span></span>,
  <span className="text-slate-600">Resetting…</span>,
]

export default function HashMapAnimation() {
  const { phase, isPlaying, speed, setSpeed, togglePlay } = usePatternAnimation(DURATIONS)

  const visibleEntries = ENTRIES.slice(0, Math.min(phase, ENTRIES.length))
  const isLookup = phase === 4 || phase === 5

  return (
    <div className="space-y-4 py-2">
      <p className="text-[11px] text-center uppercase tracking-wider text-slate-600">
        Hash Map — O(1) insert &amp; lookup
      </p>

      <motion.div
        key={phase}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-white/8 bg-white/[0.03] px-4 py-2 text-xs font-mono text-center"
      >
        {OP_LABELS[phase]}
      </motion.div>

      <div className="rounded-xl border border-white/10 bg-[#070d1f] overflow-hidden">
        <div className="grid grid-cols-2 border-b border-white/8 px-4 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">Key</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">Value</span>
        </div>

        <div className="min-h-[112px] divide-y divide-white/5">
          <AnimatePresence initial={false}>
            {phase < 6 && visibleEntries.map((entry) => {
              const c = ROW_COLORS[entry.color]
              const highlighted = isLookup && entry.key === 'dog'
              return (
                <motion.div
                  key={entry.key}
                  initial={{ x: -24, opacity: 0 }}
                  animate={{
                    x: 0,
                    opacity: 1,
                    backgroundColor: highlighted ? 'rgba(16,185,129,0.08)' : 'transparent',
                  }}
                  exit={{ x: 24, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                  className={`grid grid-cols-2 px-4 py-2.5 ${highlighted ? 'border-l-2 border-emerald-500/70' : ''}`}
                >
                  <span className={`text-sm font-mono font-bold ${highlighted ? 'text-emerald-300' : c.text}`}>
                    "{entry.key}"
                    {highlighted && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="ml-2 text-[10px] text-emerald-500"
                      >
                        ← found
                      </motion.span>
                    )}
                  </span>
                  <motion.span
                    animate={highlighted && phase === 5 ? { scale: [1, 1.35, 1] } : {}}
                    transition={{ duration: 0.4 }}
                    className={`text-sm font-mono font-bold ${highlighted ? 'text-emerald-300' : 'text-slate-300'}`}
                  >
                    {entry.val}
                  </motion.span>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {(phase === 0 || phase === 6) && (
            <div className="flex items-center justify-center h-24 text-slate-700 text-xs font-mono">
              empty
            </div>
          )}
        </div>
      </div>

      <AnimationControls isPlaying={isPlaying} speed={speed} onToggle={togglePlay} onSpeed={setSpeed} />
    </div>
  )
}
