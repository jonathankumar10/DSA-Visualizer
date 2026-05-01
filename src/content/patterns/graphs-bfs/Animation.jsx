import { motion } from 'framer-motion'
import { usePatternAnimation } from '../../../hooks/usePatternAnimation'
import AnimationControls from '../../../components/ui/AnimationControls'

// Graph:
//  0 — 1 — 3
//  |   |
//  2   4

const NODES = [
  { id: 0, x: 72,  y: 80  },
  { id: 1, x: 162, y: 80  },
  { id: 2, x: 72,  y: 160 },
  { id: 3, x: 252, y: 80  },
  { id: 4, x: 162, y: 160 },
]
const EDGES       = [[0,1],[0,2],[1,3],[1,4]]
const BFS_LEVEL   = { 0:0, 1:1, 2:1, 3:2, 4:2 }
const LEVEL_COLORS = ['#f59e0b', '#8b5cf6', '#14b8a6']
const NODE_MAP     = Object.fromEntries(NODES.map((n) => [n.id, n]))
const QUEUES       = [[], [0], [1,2], [3,4], []]

// phase 0=idle, 1=level0, 2=level1, 3=level2, 4=pause
const DURATIONS = [800, 1000, 1000, 1000, 1500]

export default function GraphsBFSAnimation() {
  const { phase, isPlaying, speed, setSpeed, togglePlay } = usePatternAnimation(DURATIONS)

  const litColor = (id) => BFS_LEVEL[id] < phase ? LEVEL_COLORS[BFS_LEVEL[id]] : null
  const edgeLit  = (a, b) => BFS_LEVEL[a] < phase && BFS_LEVEL[b] < phase

  return (
    <div className="space-y-4 py-2">
      <p className="text-[11px] text-center uppercase tracking-wider text-slate-600">
        BFS from node 0 — level-by-level
      </p>

      <svg viewBox="0 0 324 210" className="w-full" style={{ maxHeight: 210 }}>
        {EDGES.map(([a, b]) => {
          const na = NODE_MAP[a], nb = NODE_MAP[b]
          return (
            <g key={`${a}-${b}`}>
              <line x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
                stroke="#1e293b" strokeWidth={3} strokeLinecap="round" />
              {edgeLit(a, b) && (
                <motion.line
                  key={`${a}-${b}-lit`}
                  x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
                  stroke="#6ee7b7" strokeWidth={2.5} strokeLinecap="round"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                />
              )}
            </g>
          )
        })}

        {NODES.map((node) => {
          const color  = litColor(node.id)
          const newLit = BFS_LEVEL[node.id] === phase - 1
          return (
            <g key={node.id}>
              {newLit && color && (
                <motion.circle
                  key={`ripple-${node.id}-${phase}`}
                  cx={node.x} cy={node.y}
                  fill={color}
                  initial={{ r: 20, opacity: 0.65 }}
                  animate={{ r: 40, opacity: 0 }}
                  transition={{ duration: 0.75, ease: 'easeOut' }}
                />
              )}
              <motion.circle
                cx={node.x} cy={node.y} r={22}
                animate={{
                  fill:        color ? `${color}22` : '#0f172a',
                  stroke:      color ?? '#1e293b',
                  strokeWidth: color ? 2.5 : 1.5,
                }}
                transition={{ duration: 0.35 }}
              />
              {color && (
                <text x={node.x + 18} y={node.y - 16}
                  textAnchor="middle" fontSize="9" fontWeight="800"
                  fill={color} className="select-none pointer-events-none">
                  L{BFS_LEVEL[node.id]}
                </text>
              )}
              <text x={node.x} y={node.y + 5}
                textAnchor="middle" fontSize="13" fontWeight="800"
                fill={color ?? '#334155'} className="select-none pointer-events-none">
                {node.id}
              </text>
            </g>
          )
        })}
      </svg>

      <div className="rounded-lg border border-white/8 bg-white/[0.02] px-4 py-2.5 flex items-center gap-3">
        <span className="text-[10px] uppercase tracking-wider text-slate-600 shrink-0 font-medium">Queue</span>
        <div className="flex gap-2 flex-wrap">
          {QUEUES[phase].length === 0
            ? <span className="text-xs text-slate-700 font-mono">empty</span>
            : QUEUES[phase].map((id) => {
                const color = LEVEL_COLORS[BFS_LEVEL[id]]
                return (
                  <motion.span
                    key={`q-${phase}-${id}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="rounded-md px-2.5 py-0.5 text-xs font-mono font-bold"
                    style={{ backgroundColor: `${color}22`, border: `1px solid ${color}55`, color }}
                  >
                    {id}
                  </motion.span>
                )
              })
          }
        </div>
      </div>

      <div className="flex flex-wrap gap-4 justify-center">
        {LEVEL_COLORS.map((color, i) => (
          <span key={i} className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            Level {i}
          </span>
        ))}
      </div>

      <AnimationControls isPlaying={isPlaying} speed={speed} onToggle={togglePlay} onSpeed={setSpeed} />
    </div>
  )
}
