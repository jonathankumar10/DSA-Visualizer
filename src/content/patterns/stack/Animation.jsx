import { motion, AnimatePresence } from 'framer-motion'
import { usePatternAnimation } from '../../../hooks/usePatternAnimation'
import AnimationControls from '../../../components/ui/AnimationControls'

const ITEMS = [
  { id: 'a', label: 'A', color: '#3b82f6' },
  { id: 'b', label: 'B', color: '#ec4899' },
  { id: 'c', label: 'C', color: '#f59e0b' },
]

// 0=empty 1=pushA 2=pushB 3=pushC 4=pause 5=popC 6=popB 7=popA 8=empty
const DURATIONS = [600, 750, 750, 750, 1000, 750, 750, 750, 1200]
const OPS = ['', 'push(A)', 'push(B)', 'push(C)', '—', 'pop() → C', 'pop() → B', 'pop() → A', '']

export default function StackAnimation() {
  const { phase, isPlaying, speed, setSpeed, togglePlay } = usePatternAnimation(DURATIONS)

  const stackCount = phase <= 4 ? Math.min(phase, 3) : Math.max(0, 3 - (phase - 4))
  const stack = ITEMS.slice(0, stackCount)
  const op    = OPS[phase]

  return (
    <div className="space-y-5 py-2">
      <p className="text-[11px] text-center uppercase tracking-wider text-slate-600">
        Stack — Last In, First Out (LIFO)
      </p>

      <motion.div
        key={op}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center font-mono text-sm h-8 flex items-center justify-center"
      >
        {op && op !== '—' ? (
          <span className={`px-3 py-1 rounded-lg font-bold ${
            op.startsWith('push') ? 'text-blue-300 bg-blue-500/10 border border-blue-500/20' :
                                    'text-amber-300  bg-amber-500/10  border border-amber-500/20'
          }`}>
            {op}
          </span>
        ) : (
          <span className="text-slate-600 text-xs">
            {(phase === 0 || phase === 8) ? 'Stack is empty' : 'Full — ready to pop'}
          </span>
        )}
      </motion.div>

      <div className="flex justify-center">
        <div className="relative w-28">
          <div className="rounded-xl border-2 border-white/10 bg-[#070d1f] min-h-[160px] flex flex-col-reverse p-2 gap-2">
            <AnimatePresence>
              {stack.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ y: -56, opacity: 0, scale: 0.8 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: -56, opacity: 0, scale: 0.75, transition: { duration: 0.32 } }}
                  transition={{ type: 'spring', stiffness: 340, damping: 26 }}
                  className="relative h-12 rounded-lg flex items-center justify-center font-black text-xl select-none"
                  style={{
                    backgroundColor: `${item.color}22`,
                    border: `2px solid ${item.color}55`,
                    color: item.color,
                    boxShadow: i === stack.length - 1 ? `0 0 18px 4px ${item.color}28` : 'none',
                  }}
                >
                  {item.label}
                  {i === stack.length - 1 && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute -right-10 text-[9px] font-bold text-slate-500 uppercase tracking-wider"
                    >
                      top
                    </motion.span>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {stack.length === 0 && (
              <div className="flex-1 flex items-center justify-center text-slate-700 text-xs font-mono">
                empty
              </div>
            )}
          </div>
          <div className="mt-1 text-center text-[10px] text-slate-700 uppercase tracking-wider">bottom</div>
        </div>
      </div>

      <AnimationControls isPlaying={isPlaying} speed={speed} onToggle={togglePlay} onSpeed={setSpeed} />
    </div>
  )
}
