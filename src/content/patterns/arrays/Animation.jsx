import { motion } from 'framer-motion'
import { usePatternAnimation } from '../../../hooks/usePatternAnimation'
import AnimationControls from '../../../components/ui/AnimationControls'

const ARRAY = [3, 7, 1, 9, 4, 2]
// phase 0=idle, 1-6=scan index 0-5, 7=done
const DURATIONS = [700, 700, 700, 700, 700, 700, 700, 1400]

export default function ArraysAnimation() {
  const { phase, isPlaying, speed, setSpeed, togglePlay } = usePatternAnimation(DURATIONS)

  const activeIdx = (phase === 0 || phase === 7) ? -1 : phase - 1

  function cellState(i) {
    if (phase === 7) return 'done'
    if (i === activeIdx) return 'active'
    if (i < activeIdx) return 'visited'
    return 'idle'
  }

  const progress = phase === 0 ? 0 : phase === 7 ? 100 : ((activeIdx + 1) / ARRAY.length) * 100

  return (
    <div className="space-y-5 py-2">
      <p className="text-[11px] text-center uppercase tracking-wider text-slate-600">
        Array Traversal — O(n)
      </p>

      <div className="flex justify-center gap-2">
        {ARRAY.map((val, i) => {
          const state = cellState(i)
          return (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <motion.div
                animate={{ opacity: state === 'active' ? 1 : 0, y: state === 'active' ? 0 : -4 }}
                transition={{ duration: 0.2 }}
                className="text-sky-300 text-xs font-black h-3"
              >
                ↓
              </motion.div>

              <motion.div
                animate={{
                  backgroundColor:
                    state === 'active'  ? 'rgba(14,165,233,0.18)' :
                    state === 'visited' ? 'rgba(16,185,129,0.10)' :
                    state === 'done'    ? 'rgba(16,185,129,0.13)' :
                    'rgba(255,255,255,0.03)',
                  borderColor:
                    state === 'active'  ? 'rgba(56,189,248,0.85)' :
                    state === 'visited' ? 'rgba(52,211,153,0.45)' :
                    state === 'done'    ? 'rgba(52,211,153,0.55)' :
                    'rgba(255,255,255,0.10)',
                  scale: state === 'active' ? 1.12 : 1,
                  boxShadow: state === 'active' ? '0 0 18px 4px rgba(14,165,233,0.30)' : '0 0 0px 0px transparent',
                }}
                transition={{ duration: 0.3 }}
                className="w-11 h-11 rounded-xl border-2 flex items-center justify-center font-black text-base font-mono"
                style={{
                  color: state === 'active' ? '#7dd3fc' :
                         (state === 'visited' || state === 'done') ? '#6ee7b7' : '#475569',
                }}
              >
                {val}
              </motion.div>

              <span className="text-[10px] font-mono text-slate-700">[{i}]</span>
            </div>
          )
        })}
      </div>

      <motion.div
        key={phase}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center text-xs font-mono min-h-[20px]"
      >
        {phase === 0 && <span className="text-slate-600">Starting scan…</span>}
        {phase >= 1 && phase <= 6 && (
          <span className="text-slate-400">
            index <span className="text-sky-300 font-bold">{activeIdx}</span>
            {' → '}value <span className="text-sky-300 font-bold">{ARRAY[activeIdx]}</span>
          </span>
        )}
        {phase === 7 && <span className="text-emerald-400">All {ARRAY.length} elements visited ✓</span>}
      </motion.div>

      <div className="h-1 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }}
          className="h-full bg-gradient-to-r from-sky-500 to-sky-300 rounded-full"
        />
      </div>

      <AnimationControls isPlaying={isPlaying} speed={speed} onToggle={togglePlay} onSpeed={setSpeed} />
    </div>
  )
}
