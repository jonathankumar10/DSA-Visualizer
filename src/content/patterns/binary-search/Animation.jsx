import { motion } from 'framer-motion'
import { usePatternAnimation } from '../../../hooks/usePatternAnimation'
import AnimationControls from '../../../components/ui/AnimationControls'

const NUMS   = [1, 3, 5, 7, 9, 11, 13]
const TARGET = 9

const PHASES = [
  { left: 0, right: 6, mid: -1, type: 'init',     msg: 'Start: left=0, right=6, target=9' },
  { left: 0, right: 6, mid: 3,  type: 'go-right', msg: 'nums[3]=7 < 9 → go right, left=4' },
  { left: 4, right: 6, mid: 5,  type: 'go-left',  msg: 'nums[5]=11 > 9 → go left, right=4' },
  { left: 4, right: 4, mid: 4,  type: 'found',    msg: 'nums[4]=9 == 9 → Found at index 4 ✓' },
  { left: 4, right: 4, mid: 4,  type: 'found',    msg: 'nums[4]=9 == 9 → Found at index 4 ✓' },
]
const DURATIONS = [900, 1200, 1200, 1200, 1500]

const CELL = 42
const GAP  = 6
const STRIDE = CELL + GAP

export default function BinarySearchAnimation() {
  const { phase, isPlaying, speed, setSpeed, togglePlay } = usePatternAnimation(DURATIONS)

  const { left, right, mid, type, msg } = PHASES[phase]

  function cellState(i) {
    if (type === 'init') return 'active'
    if (type === 'found' && i === mid) return 'found'
    if (i < left || i > right) return 'elim'
    if (i === mid) return 'open'
    return 'active'
  }

  const trackW = NUMS.length * STRIDE - GAP

  return (
    <div className="space-y-5 py-2">
      <p className="text-[11px] text-center uppercase tracking-wider text-slate-600">
        Binary Search — O(log n) — target = {TARGET}
      </p>

      <div className="overflow-x-auto">
        <div className="mx-auto px-4" style={{ width: trackW + 48, paddingTop: 34 }}>
          <div className="relative" style={{ height: CELL }}>

            {/* L wall */}
            {type !== 'init' && (
              <motion.div
                animate={{ x: left * STRIDE }}
                transition={{ type: 'spring', stiffness: 200, damping: 24 }}
                className="absolute top-0 pointer-events-none"
                style={{ width: 0 }}
              >
                <div className="text-[9px] font-black text-violet-400 absolute -translate-x-1/2" style={{ top: -22 }}>L</div>
                <div className="w-0.5 rounded bg-violet-500 shadow-[0_0_8px_2px_rgba(139,92,246,0.5)]" style={{ height: CELL }} />
              </motion.div>
            )}

            {/* R wall */}
            {type !== 'init' && (
              <motion.div
                animate={{ x: right * STRIDE + CELL }}
                transition={{ type: 'spring', stiffness: 200, damping: 24 }}
                className="absolute top-0 pointer-events-none"
                style={{ width: 0 }}
              >
                <div className="text-[9px] font-black text-pink-400 absolute -translate-x-full" style={{ top: -22 }}>R</div>
                <div className="w-0.5 rounded bg-pink-500 shadow-[0_0_8px_2px_rgba(236,72,153,0.5)]" style={{ height: CELL }} />
              </motion.div>
            )}

            {/* M probe */}
            {mid >= 0 && type !== 'init' && (
              <motion.div
                key={`m-${mid}`}
                animate={{ x: mid * STRIDE + CELL / 2 }}
                transition={{ type: 'spring', stiffness: 200, damping: 24 }}
                className="absolute pointer-events-none flex flex-col items-center"
                style={{ width: 0, top: -22 }}
              >
                <div className={`text-[9px] font-black -translate-x-1/2 ${type === 'found' ? 'text-emerald-300' : 'text-white'}`}>
                  M
                </div>
                <svg width="8" height="6" viewBox="0 0 8 6" fill={type === 'found' ? '#34d399' : '#94a3b8'} style={{ marginLeft: -4 }}>
                  <polygon points="4,6 0,0 8,0" />
                </svg>
              </motion.div>
            )}

            {/* Cells */}
            <div className="absolute inset-0 flex" style={{ gap: GAP }}>
              {NUMS.map((val, i) => {
                const state = cellState(i)
                return (
                  <motion.div
                    key={i}
                    animate={{
                      backgroundColor:
                        state === 'found'  ? 'rgba(16,185,129,0.22)' :
                        state === 'open'   ? 'rgba(139,92,246,0.16)' :
                        state === 'elim'   ? 'rgba(15,23,42,0.5)'    :
                        'rgba(51,65,85,0.5)',
                      borderColor:
                        state === 'found'  ? 'rgba(52,211,153,0.85)'  :
                        state === 'open'   ? 'rgba(167,139,250,0.85)' :
                        state === 'elim'   ? 'rgba(51,65,85,0.25)'    :
                        'rgba(100,116,139,0.6)',
                      opacity: state === 'elim' ? 0.3 : 1,
                      scale:   state === 'found' ? 1.1 : state === 'open' ? 1.05 : 1,
                    }}
                    transition={{ duration: 0.3 }}
                    style={{ width: CELL, height: CELL }}
                    className="rounded-xl border-2 flex items-center justify-center font-black text-sm font-mono text-white shrink-0"
                  >
                    {val}
                  </motion.div>
                )
              })}
            </div>
          </div>

          <div className="flex mt-2" style={{ gap: GAP }}>
            {NUMS.map((_, i) => (
              <div key={i} style={{ width: CELL }} className="text-center text-[9px] font-mono text-slate-700">
                [{i}]
              </div>
            ))}
          </div>
        </div>
      </div>

      <motion.div
        key={msg}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className={`text-center text-xs font-mono px-4 py-2 rounded-lg ${
          type === 'found'    ? 'text-emerald-300 bg-emerald-500/8' :
          type === 'go-right' ? 'text-amber-300   bg-amber-500/8'   :
          type === 'go-left'  ? 'text-sky-300     bg-sky-500/8'     :
          'text-slate-400 bg-white/[0.03]'
        }`}
      >
        {msg}
      </motion.div>

      <AnimationControls isPlaying={isPlaying} speed={speed} onToggle={togglePlay} onSpeed={setSpeed} />
    </div>
  )
}
