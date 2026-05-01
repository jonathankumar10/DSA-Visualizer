import { motion } from 'framer-motion'
import { usePatternAnimation } from '../../../hooks/usePatternAnimation'
import AnimationControls from '../../../components/ui/AnimationControls'

//       4
//      / \
//     2   6
//    / \ / \
//   1  3 5  7

const NODES = [
  { id: 'n4', val: 4, x: 140, y: 28  },
  { id: 'n2', val: 2, x: 72,  y: 96  },
  { id: 'n6', val: 6, x: 208, y: 96  },
  { id: 'n1', val: 1, x: 36,  y: 164 },
  { id: 'n3', val: 3, x: 108, y: 164 },
  { id: 'n5', val: 5, x: 172, y: 164 },
  { id: 'n7', val: 7, x: 244, y: 164 },
]
const EDGES   = [['n4','n2'],['n4','n6'],['n2','n1'],['n2','n3'],['n6','n5'],['n6','n7']]
const NODE_MAP = Object.fromEntries(NODES.map((n) => [n.id, n]))
const INORDER  = ['n1','n2','n3','n4','n5','n6','n7']

// phase 0=idle, 1-7=visit node in inorder, 8=all done
const DURATIONS = [900, 680, 680, 680, 680, 680, 680, 680, 1400]

export default function TreesAnimation() {
  const { phase, isPlaying, speed, setSpeed, togglePlay } = usePatternAnimation(DURATIONS)

  const visitedSet = new Set(INORDER.slice(0, phase))
  const currentId  = (phase >= 1 && phase <= 7) ? INORDER[phase - 1] : null

  function ns(id) {
    if (id === currentId) return 'current'
    if (visitedSet.has(id)) return 'visited'
    return 'idle'
  }

  return (
    <div className="space-y-4 py-2">
      <p className="text-[11px] text-center uppercase tracking-wider text-slate-600">
        Inorder DFS — L → root → R
      </p>

      <svg viewBox="0 0 280 196" className="w-full" style={{ maxHeight: 196 }}>
        {EDGES.map(([a, b]) => {
          const na = NODE_MAP[a], nb = NODE_MAP[b]
          const lit = visitedSet.has(a) && visitedSet.has(b)
          return (
            <g key={`${a}-${b}`}>
              <line x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
                stroke="rgba(255,255,255,0.07)" strokeWidth={2} strokeLinecap="round" />
              {lit && (
                <motion.line
                  key={`${a}-${b}-lit`}
                  x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
                  stroke="#14b8a6" strokeWidth={2.5} strokeLinecap="round"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.35 }}
                />
              )}
            </g>
          )
        })}

        {NODES.map((node) => {
          const state = ns(node.id)
          return (
            <g key={node.id}>
              {state === 'current' && (
                <motion.circle
                  key={`ring-${node.id}-${phase}`}
                  cx={node.x} cy={node.y}
                  fill="none" stroke="#14b8a6" strokeWidth={2}
                  initial={{ r: 16, opacity: 0.85 }}
                  animate={{ r: 30, opacity: 0 }}
                  transition={{ duration: 0.65, ease: 'easeOut' }}
                />
              )}
              <motion.circle
                cx={node.x} cy={node.y} r={16}
                animate={{
                  fill:        state === 'current' ? '#0f766e' : state === 'visited' ? '#134e4a' : '#0f172a',
                  stroke:      state === 'current' ? '#14b8a6' : state === 'visited' ? '#0d9488' : '#1e293b',
                  strokeWidth: state === 'current' ? 2.5 : 1.5,
                }}
                transition={{ duration: 0.3 }}
              />
              <text
                x={node.x} y={node.y + 5}
                textAnchor="middle" fontSize="12" fontWeight="800"
                fill={state === 'current' ? '#ccfbf1' : state === 'visited' ? '#5eead4' : '#334155'}
                className="select-none pointer-events-none"
              >
                {node.val}
              </text>
            </g>
          )
        })}
      </svg>

      <div className="flex justify-center gap-1.5 flex-wrap">
        {INORDER.map((id, i) => {
          const active = i === phase - 1
          const done   = i < phase - 1
          return (
            <motion.span
              key={id}
              animate={{
                backgroundColor: active ? 'rgba(20,184,166,0.20)' : done ? 'rgba(20,184,166,0.08)' : 'transparent',
                borderColor:     active ? 'rgba(20,184,166,0.60)' : done ? 'rgba(20,184,166,0.25)' : 'rgba(255,255,255,0.08)',
                color:           active ? '#5eead4' : done ? '#2dd4bf' : '#334155',
                scale:           active ? 1.1 : 1,
              }}
              transition={{ duration: 0.2 }}
              className="rounded-md border px-2 py-0.5 text-xs font-mono font-bold"
            >
              {NODE_MAP[id].val}
            </motion.span>
          )
        })}
      </div>

      <motion.div
        key={phase}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center text-xs font-mono min-h-[20px]"
      >
        {phase === 0 && <span className="text-slate-600">Starting inorder traversal…</span>}
        {phase >= 1 && phase <= 7 && (
          <span className="text-slate-400">
            Visiting node <span className="text-teal-300 font-bold">{NODE_MAP[currentId].val}</span>
          </span>
        )}
        {phase === 8 && <span className="text-teal-400">All 7 nodes visited in order ✓</span>}
      </motion.div>

      <AnimationControls isPlaying={isPlaying} speed={speed} onToggle={togglePlay} onSpeed={setSpeed} />
    </div>
  )
}
