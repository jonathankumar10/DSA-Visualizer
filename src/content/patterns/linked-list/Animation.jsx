import { motion } from 'framer-motion'
import { usePatternAnimation } from '../../../hooks/usePatternAnimation'
import AnimationControls from '../../../components/ui/AnimationControls'

const NODES = [
  { val: 1, id: 'n1' },
  { val: 2, id: 'n2' },
  { val: 3, id: 'n3' },
  { val: 4, id: 'n4' },
]

// 0=head, 1-4=node 0-3, 5=null, 6=reset
const DURATIONS = [700, 700, 700, 700, 700, 1100, 900]

export default function LinkedListAnimation() {
  const { phase, isPlaying, speed, setSpeed, togglePlay } = usePatternAnimation(DURATIONS)

  const curIdx = (phase === 0 || phase === 6) ? -1 : phase - 1
  const atNull = phase === 5

  function nodeState(i) {
    if (phase === 6) return 'idle'
    if (i === curIdx) return 'current'
    if (i < curIdx || atNull) return 'visited'
    return 'idle'
  }

  return (
    <div className="space-y-6 py-2">
      <p className="text-[11px] text-center uppercase tracking-wider text-slate-600">
        Linked List Traversal
      </p>

      <div className="overflow-x-auto">
        <div className="flex items-center justify-center gap-0 min-w-max mx-auto px-2">
          {/* head label */}
          <div className="flex flex-col items-center mr-1">
            <motion.span
              animate={{ opacity: phase === 0 ? 1 : 0.25 }}
              className="text-[9px] font-bold text-rose-300 uppercase tracking-wider mb-0.5"
            >
              head
            </motion.span>
            <motion.span
              animate={{ color: phase === 0 ? '#fda4af' : '#334155' }}
              className="text-lg font-black font-mono"
            >
              →
            </motion.span>
          </div>

          {NODES.map((node, i) => {
            const state = nodeState(i)
            return (
              <div key={node.id} className="flex items-center">
                <div className="flex flex-col items-center gap-0.5">
                  <motion.span
                    animate={{ opacity: state === 'current' ? 1 : 0, y: state === 'current' ? 0 : -4 }}
                    transition={{ duration: 0.2 }}
                    className="text-[9px] font-black text-rose-300 uppercase tracking-wider h-3"
                  >
                    cur
                  </motion.span>

                  <motion.div
                    animate={{
                      borderColor:
                        state === 'current' ? 'rgba(251,113,133,0.9)' :
                        state === 'visited' ? 'rgba(52,211,153,0.5)'  :
                        'rgba(255,255,255,0.12)',
                      backgroundColor:
                        state === 'current' ? 'rgba(251,113,133,0.12)' :
                        state === 'visited' ? 'rgba(52,211,153,0.08)'  :
                        'rgba(255,255,255,0.02)',
                      boxShadow: state === 'current' ? '0 0 16px 4px rgba(244,63,94,0.22)' : 'none',
                    }}
                    transition={{ duration: 0.25 }}
                    className="w-11 h-11 rounded-xl border-2 flex flex-col items-center justify-center"
                  >
                    <span
                      className="font-black text-base font-mono"
                      style={{
                        color: state === 'current' ? '#fda4af' :
                               state === 'visited'  ? '#6ee7b7' : '#475569',
                      }}
                    >
                      {node.val}
                    </span>
                    <span className="text-[8px] text-slate-700 font-mono">.next</span>
                  </motion.div>
                </div>

                <motion.span
                  animate={{
                    color:   state === 'visited' ? '#6ee7b7' : '#1e293b',
                    opacity: state === 'idle' && phase > 0 ? 0.3 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                  className="text-lg font-black font-mono mx-1"
                >
                  →
                </motion.span>
              </div>
            )
          })}

          <motion.div
            animate={{
              borderColor: atNull ? 'rgba(251,113,133,0.8)' : 'rgba(255,255,255,0.08)',
              color:       atNull ? '#fda4af'               : '#1e293b',
              boxShadow:   atNull ? '0 0 12px 3px rgba(244,63,94,0.2)' : 'none',
            }}
            transition={{ duration: 0.25 }}
            className="rounded-lg border px-2 py-1 text-xs font-mono font-bold"
          >
            null
          </motion.div>
        </div>
      </div>

      <motion.div
        key={phase}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center text-xs font-mono text-slate-400 min-h-[20px]"
      >
        {phase === 0 && 'cur = head'}
        {phase >= 1 && phase <= 4 && (
          <span>
            cur.val = <span className="text-rose-300 font-bold">{NODES[curIdx].val}</span>
            {' → '}cur = cur.next
          </span>
        )}
        {phase === 5 && <span className="text-emerald-400">cur == null — traversal complete ✓</span>}
        {phase === 6 && <span className="text-slate-600">Resetting…</span>}
      </motion.div>

      <AnimationControls isPlaying={isPlaying} speed={speed} onToggle={togglePlay} onSpeed={setSpeed} />
    </div>
  )
}
