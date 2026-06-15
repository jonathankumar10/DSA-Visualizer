import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AI_ITEMS } from '../constants/aiRegistry'

// ── SVG animations ────────────────────────────────────────────────────────────

function SvgAiHistory({ c }) {
  const milestones = [6, 14, 22, 30, 38]
  return (
    <svg viewBox="0 0 44 40" width="40" height="40" fill="none">
      <line x1="4" y1="22" x2="40" y2="22" stroke={c} strokeWidth="1" opacity="0.3" />
      {milestones.map((x, i) => (
        <motion.g key={x}>
          <line x1={x} y1="18" x2={x} y2="26" stroke={c} strokeWidth="1" opacity="0.4" />
          <motion.circle cx={x} cy="22" r="3" fill={c}
            animate={{ fillOpacity: [0.2, 0.9, 0.2], scale: [1, 1.3, 1] }}
            style={{ transformOrigin: `${x}px 22px` }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.35 }} />
        </motion.g>
      ))}
    </svg>
  )
}

function SvgNeuralNetworks({ c }) {
  const layers = [[6, [10, 20, 30]], [20, [14, 26]], [34, [10, 20, 30]]]
  const edges = []
  layers.slice(0, -1).forEach(([x1, ys1], li) => {
    const [x2, ys2] = layers[li + 1]
    ys1.forEach((y1) => ys2.forEach((y2) => edges.push([x1, y1, x2, y2])))
  })
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      {edges.map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="0.6" opacity="0.2" />
      ))}
      {layers.map(([x, ys]) => ys.map((y, i) => (
        <motion.circle key={`${x}${y}`} cx={x} cy={y} r="4" fill={c}
          animate={{ fillOpacity: [0.15, 0.7, 0.15] }}
          transition={{ duration: 1.6, repeat: Infinity, delay: (layers.findIndex(l => l[0] === x)) * 0.4 + i * 0.12 }} />
      )))}
    </svg>
  )
}

function SvgTrainingAndLoss({ c }) {
  const pts = '4,34 10,28 16,22 22,18 28,14 34,12 38,10'
  return (
    <svg viewBox="0 0 42 38" width="40" height="38" fill="none">
      <line x1="4" y1="4" x2="4" y2="34" stroke={c} strokeWidth="1" opacity="0.3" />
      <line x1="4" y1="34" x2="38" y2="34" stroke={c} strokeWidth="1" opacity="0.3" />
      <motion.polyline points={pts} fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} />
      <motion.circle r="3" fill={c}
        animate={{ cx: [4, 10, 16, 22, 28, 34, 38, 4], cy: [34, 28, 22, 18, 14, 12, 10, 34], opacity: [0, 1, 1, 1, 1, 1, 0, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'linear', times: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1] }} />
    </svg>
  )
}

function SvgTransformer({ c }) {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      <rect x="4" y="24" width="14" height="10" rx="1.5" fill={c} fillOpacity="0.15" stroke={c} strokeWidth="1.2" />
      <rect x="22" y="24" width="14" height="10" rx="1.5" fill={c} fillOpacity="0.15" stroke={c} strokeWidth="1.2" />
      <rect x="4" y="8" width="14" height="12" rx="1.5" fill={c} fillOpacity="0.1" stroke={c} strokeWidth="1" />
      <rect x="22" y="8" width="14" height="12" rx="1.5" fill={c} fillOpacity="0.1" stroke={c} strokeWidth="1" />
      <motion.line x1="18" y1="13" x2="22" y2="13" stroke={c} strokeWidth="1.2"
        animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1.5, repeat: Infinity }} />
      <motion.line x1="11" y1="24" x2="29" y2="20" stroke={c} strokeWidth="1"
        strokeDasharray="3 2" animate={{ strokeDashoffset: [0, -10] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
    </svg>
  )
}

function SvgAttention({ c }) {
  const size = 4
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      {Array.from({ length: size }).map((_, row) =>
        Array.from({ length: size }).map((_, col) => (
          <motion.rect key={`${row}${col}`}
            x={6 + col * 8} y={6 + row * 8} width="6" height="6" rx="1"
            fill={c}
            animate={{ fillOpacity: [row === col ? 0.6 : 0.08, row === col ? 0.9 : 0.35, row === col ? 0.6 : 0.08] }}
            transition={{ duration: 2, repeat: Infinity, delay: (row + col) * 0.15 }} />
        ))
      )}
    </svg>
  )
}

function SvgTokenization({ c }) {
  const tokens = [
    { x: 4, w: 10 }, { x: 16, w: 8 }, { x: 26, w: 12 },
  ]
  return (
    <svg viewBox="0 0 42 40" width="40" height="40" fill="none">
      <rect x="3" y="13" width="36" height="14" rx="2" stroke={c} strokeWidth="1" fill={c} fillOpacity="0.05" />
      {tokens.map(({ x, w }, i) => (
        <motion.rect key={i} x={x} y="15" width={w} height="10" rx="1.5"
          fill={c} fillOpacity="0.2" stroke={c} strokeWidth="0.8"
          animate={{ fillOpacity: [0.12, 0.45, 0.12], y: [15, 13, 15] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.45 }} />
      ))}
      <motion.line x1="14" y1="27" x2="14" y2="31" stroke={c} strokeWidth="0.8" opacity="0.3"
        animate={{ opacity: [0.1, 0.5, 0.1] }} transition={{ duration: 1.8, repeat: Infinity }} />
      <motion.line x1="24" y1="27" x2="24" y2="31" stroke={c} strokeWidth="0.8" opacity="0.3"
        animate={{ opacity: [0.1, 0.5, 0.1] }} transition={{ duration: 1.8, repeat: Infinity, delay: 0.45 }} />
    </svg>
  )
}

function SvgContextWindows({ c }) {
  const dots = Array.from({ length: 9 }, (_, i) => 4 + i * 4)
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      {dots.map((x) => (
        <circle key={x} cx={x} cy="20" r="1.5" fill={c} opacity="0.2" />
      ))}
      <motion.rect y="15" height="10" rx="2" fill={c} fillOpacity="0.12" stroke={c} strokeWidth="1"
        animate={{ x: [2, 2, 14, 14, 2], width: [20, 20, 20, 20, 20] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', times: [0, 0.3, 0.6, 0.9, 1] }} />
      {dots.map((x, i) => (
        <motion.circle key={x} cx={x} cy="20" r="1.5" fill={c}
          animate={{ fillOpacity: i < 5 ? [0.2, 0.9, 0.2] : [0.2, 0.2, 0.2] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.06 }} />
      ))}
    </svg>
  )
}

function SvgLlmInference({ c }) {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      {[4, 11, 18, 25].map((x, i) => (
        <motion.rect key={x} x={x} y="16" width="6" height="8" rx="1"
          fill={c} animate={{ fillOpacity: [0, 0.7, 0.7, 0.7] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.5, times: [0, 0.1, 0.6, 1] }} />
      ))}
      <motion.rect x="33" y="16" width="4" height="8" rx="0.5" fill={c}
        animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.7, repeat: Infinity }} />
    </svg>
  )
}

function SvgMultimodal({ c }) {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      <rect x="2" y="6" width="14" height="12" rx="2" stroke={c} strokeWidth="1.2" fill={c} fillOpacity="0.1" />
      <circle cx="8" cy="11" r="2.5" fill={c} opacity="0.4" />
      <polyline points="2,16 7,11 12,14 18,8" fill="none" stroke={c} strokeWidth="0.8" opacity="0.5" />
      {[8, 13, 18].map((y, i) => (
        <motion.line key={y} x1="20" y1={y} x2="26" y2={y} stroke={c} strokeWidth="1.2"
          animate={{ opacity: [0.2, 0.8, 0.2] }}
          transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.4 }} />
      ))}
      <motion.line x1="18" y1="12" x2="26" y2="12" stroke={c} strokeWidth="1"
        animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.6 }} />
      <motion.line x1="26" y1="12" x2="34" y2="20" stroke={c} strokeWidth="1.2" strokeLinecap="round"
        animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1.4, repeat: Infinity }} />
      <circle cx="36" cy="20" r="3" fill={c} fillOpacity="0.3" stroke={c} strokeWidth="1" />
    </svg>
  )
}

function SvgPromptEngineering({ c }) {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      <rect x="3" y="6" width="34" height="28" rx="2" stroke={c} strokeWidth="1" fill={c} fillOpacity="0.05" />
      <line x1="7" y1="13" x2="33" y2="13" stroke={c} strokeWidth="0.8" opacity="0.3" />
      <line x1="7" y1="18" x2="33" y2="18" stroke={c} strokeWidth="0.8" opacity="0.3" />
      <line x1="7" y1="23" x2="25" y2="23" stroke={c} strokeWidth="0.8" opacity="0.3" />
      <motion.rect x="25" y="20" width="1.5" height="6" rx="0.5" fill={c}
        animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
      <motion.line x1="7" y1="29" x2="20" y2="29" stroke={c} strokeWidth="1.5"
        strokeLinecap="round" animate={{ x2: [7, 20, 7] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
    </svg>
  )
}

function SvgRag({ c }) {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      {[6, 13, 20].map((y, i) => (
        <motion.rect key={y} x="2" y={y} width="12" height="5" rx="1"
          fill={c} fillOpacity="0.12" stroke={c} strokeWidth="0.8"
          animate={{ fillOpacity: i === 1 ? [0.1, 0.5, 0.1] : [0.1, 0.1, 0.1] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.8 }} />
      ))}
      <motion.circle cx="22" cy="16" r="5" stroke={c} strokeWidth="1.2" fill="none"
        animate={{ scale: [1, 1.2, 1] }} style={{ transformOrigin: '22px 16px' }}
        transition={{ duration: 2, repeat: Infinity }} />
      <motion.line x1="26" y1="20" x2="30" y2="24" stroke={c} strokeWidth="1.5" strokeLinecap="round"
        animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }} />
      <motion.path d="M14 13 Q22 13 22 16" stroke={c} strokeWidth="1" fill="none"
        strokeDasharray="3 2" animate={{ strokeDashoffset: [0, -10] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
      <rect x="30" y="26" width="8" height="10" rx="1.5" fill={c} fillOpacity="0.2" stroke={c} strokeWidth="1" />
      <motion.line x1="34" y1="26" x2="34" y2="30" stroke={c} strokeWidth="1"
        animate={{ opacity: [0, 1, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 1.2 }} />
    </svg>
  )
}

function SvgEmbeddings({ c }) {
  const pts = [[12, 14], [18, 10], [15, 20], [28, 26], [32, 22], [30, 30]]
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      <line x1="4" y1="36" x2="36" y2="36" stroke={c} strokeWidth="0.8" opacity="0.2" />
      <line x1="4" y1="4" x2="4" y2="36" stroke={c} strokeWidth="0.8" opacity="0.2" />
      {pts.map(([x, y], i) => (
        <motion.circle key={i} cx={x} cy={y} r="3.5"
          fill={c} fillOpacity="0.2" stroke={c} strokeWidth="1"
          animate={{ fillOpacity: [0.15, 0.6, 0.15], scale: [1, 1.2, 1] }}
          style={{ transformOrigin: `${x}px ${y}px` }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.25 }} />
      ))}
      <ellipse cx="14" cy="15" rx="6" ry="7" stroke={c} strokeWidth="0.8" fill="none" opacity="0.25" strokeDasharray="3 2" />
      <ellipse cx="30" cy="26" rx="5" ry="6" stroke={c} strokeWidth="0.8" fill="none" opacity="0.25" strokeDasharray="3 2" />
    </svg>
  )
}

function SvgFunctionCalling({ c }) {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      <circle cx="8" cy="20" r="5" fill={c} fillOpacity="0.15" stroke={c} strokeWidth="1.2" />
      <rect x="20" y="14" width="16" height="12" rx="2" fill={c} fillOpacity="0.12" stroke={c} strokeWidth="1.2" />
      <motion.path d="M13 16 L20 16 M18 13.5 L20 16 L18 18.5" stroke={c} strokeWidth="1.2"
        strokeLinecap="round" strokeLinejoin="round"
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, times: [0, 0.1, 0.5, 0.6] }} />
      <motion.path d="M20 24 L13 24 M15 21.5 L13 24 L15 26.5" stroke={c} strokeWidth="1.2"
        strokeLinecap="round" strokeLinejoin="round"
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, delay: 1.1, times: [0, 0.1, 0.5, 0.6] }} />
      {[17, 20, 23].map((y) => (
        <line key={y} x1="23" y1={y} x2="33" y2={y} stroke={c} strokeWidth="0.8" opacity="0.35" />
      ))}
    </svg>
  )
}

function SvgFineTuning({ c }) {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      {[[6,10],[14,10],[22,10],[6,20],[14,20],[22,20],[6,30],[14,30],[22,30]].map(([x, y], i) => (
        <motion.rect key={i} x={x} y={y} width="6" height="6" rx="1" fill={c}
          animate={{ fillOpacity: [0.1, 0.6, 0.1] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.18 }} />
      ))}
      {[[28,13],[28,20],[28,27]].map(([x, y], i) => (
        <motion.g key={y}>
          <motion.path d={`M${x} ${y} L${x} ${y-4}`} stroke={c} strokeWidth="1.5" strokeLinecap="round"
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }} />
          <motion.polygon points={`${x-2},${y-4} ${x+2},${y-4} ${x},${y-7}`} fill={c}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }} />
        </motion.g>
      ))}
    </svg>
  )
}

function SvgGuardrails({ c }) {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      <path d="M20 4 L34 10 L34 22 Q34 32 20 38 Q6 32 6 22 L6 10 Z"
        stroke={c} strokeWidth="1.2" fill={c} fillOpacity="0.08" />
      <motion.path d="M20 4 L34 10 L34 22 Q34 32 20 38 Q6 32 6 22 L6 10 Z"
        stroke={c} strokeWidth="1" fill="none" opacity="0.4"
        animate={{ scale: [1, 1.06, 1] }} style={{ transformOrigin: '20px 21px' }}
        transition={{ duration: 2, repeat: Infinity }} />
      <motion.polyline points="13,21 18,26 27,16" stroke={c} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
        animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity }} />
    </svg>
  )
}

function SvgAiAgents({ c }) {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      <circle cx="20" cy="20" r="6" fill={c} fillOpacity="0.2" stroke={c} strokeWidth="1.3" />
      {[['Plan', 10, 6], ['Act', 34, 14], ['Observe', 34, 28], ['Back', 10, 36]].map(([, cx, cy], i) => (
        <motion.circle key={i} cx={cx} cy={cy} r="4" fill={c}
          animate={{ fillOpacity: [0.2, 0.7, 0.2] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.55 }} />
      ))}
      <motion.circle cx="20" cy="20" r="6" stroke={c} strokeWidth="1" fill="none"
        animate={{ r: [6, 14, 6], opacity: [0.6, 0, 0.6] }}
        transition={{ duration: 2.4, repeat: Infinity }} />
      {/* Cycle arrows */}
      {[[10,6,34,14],[34,14,34,28],[34,28,10,36],[10,36,10,6]].map(([x1,y1,x2,y2], i) => (
        <motion.line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="0.8"
          animate={{ opacity: [0.1, 0.5, 0.1] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.55 }} />
      ))}
    </svg>
  )
}

function SvgMultiAgent({ c }) {
  const agents = [[8, 10], [32, 10], [8, 30], [32, 30], [20, 20]]
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      {[[0,4],[1,4],[2,4],[3,4],[0,1],[2,3]].map(([a, b], i) => (
        <motion.line key={i}
          x1={agents[a][0]} y1={agents[a][1]}
          x2={agents[b][0]} y2={agents[b][1]}
          stroke={c} strokeWidth="0.8"
          animate={{ opacity: [0.1, 0.6, 0.1] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }} />
      ))}
      {agents.map(([x, y], i) => (
        <motion.rect key={i} x={x - 5} y={y - 5} width="10" height="10" rx="2"
          fill={c} fillOpacity="0.15" stroke={c} strokeWidth="1"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.25 }} />
      ))}
    </svg>
  )
}

function SvgAiEngineer({ c }) {
  const layers = [
    { y: 30, label: 'Data' },
    { y: 23, label: 'Model' },
    { y: 16, label: 'API' },
    { y: 9,  label: 'UI' },
  ]
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      {layers.map(({ y }, i) => (
        <motion.rect key={y} x="6" y={y} width="28" height="6" rx="1.5"
          fill={c} stroke={c} strokeWidth="0.8"
          animate={{ fillOpacity: [0.12, 0.45, 0.12] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.35 }} />
      ))}
    </svg>
  )
}

function SvgLlmEvaluation({ c }) {
  const bars = [18, 28, 14, 24, 32]
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      {bars.map((h, i) => (
        <motion.rect key={i} x={4 + i * 7} y={36 - h} width="5" height={h} rx="1" fill={c}
          animate={{ height: [h, h + 4, h], y: [36 - h, 36 - h - 4, 36 - h] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }} />
      ))}
      <line x1="3" y1="36" x2="37" y2="36" stroke={c} strokeWidth="0.8" opacity="0.4" />
    </svg>
  )
}

function SvgAiObservability({ c }) {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      <rect x="3" y="5" width="34" height="30" rx="2" stroke={c} strokeWidth="1" fill={c} fillOpacity="0.04" />
      <motion.polyline points="6,26 10,20 14,24 18,14 22,18 26,10 30,16 34,12"
        fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
        animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }} />
      <motion.circle r="2.5" fill={c}
        animate={{ cx: [6,10,14,18,22,26,30,34,6], cy: [26,20,24,14,18,10,16,12,26] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'linear',
          times: [0,0.125,0.25,0.375,0.5,0.625,0.75,0.875,1] }} />
    </svg>
  )
}

function SvgLiveCoding({ c }) {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      <rect x="3" y="6" width="34" height="28" rx="2" stroke={c} strokeWidth="1" fill={c} fillOpacity="0.05" />
      <rect x="3" y="6" width="34" height="6" rx="2" fill={c} fillOpacity="0.12" />
      {[7, 8.5, 10].map((x, i) => (
        <circle key={i} cx={x} cy="9" r="1.2" fill={c} opacity={0.7 - i * 0.15} />
      ))}
      <motion.polyline points="7,20 11,17 15,22 19,16 23,19 27,15"
        fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
        animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.8, repeat: Infinity }} />
      <motion.rect x="27" y="16" width="1.2" height="6" rx="0.5" fill={c}
        animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.7, repeat: Infinity }} />
      <line x1="7" y1="27" x2="22" y2="27" stroke={c} strokeWidth="0.8" opacity="0.3" />
    </svg>
  )
}

const NODE_SVG = {
  'ai-history':             SvgAiHistory,
  'neural-networks':        SvgNeuralNetworks,
  'training-and-loss':      SvgTrainingAndLoss,
  'transformer-architecture': SvgTransformer,
  'attention-mechanism':    SvgAttention,
  'tokenization':           SvgTokenization,
  'context-windows':        SvgContextWindows,
  'llm-inference':          SvgLlmInference,
  'multimodal-models':      SvgMultimodal,
  'prompt-engineering':     SvgPromptEngineering,
  'rag':                    SvgRag,
  'embeddings':             SvgEmbeddings,
  'function-calling':       SvgFunctionCalling,
  'fine-tuning':            SvgFineTuning,
  'guardrails':             SvgGuardrails,
  'ai-agents':              SvgAiAgents,
  'multi-agent-systems':    SvgMultiAgent,
  'ai-engineer':            SvgAiEngineer,
  'llm-evaluation':         SvgLlmEvaluation,
  'ai-observability':       SvgAiObservability,
}

// ── Stage definitions ─────────────────────────────────────────────────────────

const STAGES = [
  {
    id: 'history',
    label: 'Foundations',
    description: 'Where AI came from — the ideas, failures, and breakthroughs that shaped everything that followed.',
    hex: '#f59e0b',
    text: 'text-amber-400',
    badge: 'bg-amber-500/15 text-amber-300',
    ids: ['ai-history'],
  },
  {
    id: 'ml',
    label: 'Machine Learning',
    description: 'How models learn: forward passes, loss functions, backpropagation, and the training loop.',
    hex: '#3b82f6',
    text: 'text-blue-400',
    badge: 'bg-blue-500/15 text-blue-300',
    ids: ['neural-networks', 'training-and-loss'],
  },
  {
    id: 'llms',
    label: 'LLMs & Transformers',
    description: 'The architecture behind GPT, Claude, and every modern language model — attention, tokenization, inference, and beyond.',
    hex: '#8b5cf6',
    text: 'text-violet-400',
    badge: 'bg-violet-500/15 text-violet-300',
    ids: ['transformer-architecture', 'attention-mechanism', 'tokenization', 'context-windows', 'llm-inference', 'multimodal-models'],
  },
  {
    id: 'workflows',
    label: 'Workflows',
    description: 'How to build useful AI systems: prompt engineering, retrieval, embeddings, tool use, fine-tuning, and safety.',
    hex: '#14b8a6',
    text: 'text-teal-400',
    badge: 'bg-teal-500/15 text-teal-300',
    ids: ['prompt-engineering', 'rag', 'embeddings', 'function-calling', 'fine-tuning', 'guardrails'],
  },
  {
    id: 'agents',
    label: 'Agents',
    description: 'Autonomous systems that plan, act, and reflect — from single-agent loops to multi-agent coordination.',
    hex: '#0ea5e9',
    text: 'text-sky-400',
    badge: 'bg-sky-500/15 text-sky-300',
    ids: ['ai-agents', 'multi-agent-systems'],
  },
  {
    id: 'production',
    label: 'Production',
    description: 'What it takes to ship AI: the AI engineer role, evaluating outputs, and observability in live systems.',
    hex: '#10b981',
    text: 'text-emerald-400',
    badge: 'bg-emerald-500/15 text-emerald-300',
    ids: ['ai-engineer', 'llm-evaluation', 'ai-observability'],
  },
]

const LIVE_CODING_HEX = '#6366f1'

// ── Shared sub-components ─────────────────────────────────────────────────────

function StageConnector({ fromHex, toHex }) {
  return (
    <div className="flex justify-center my-1">
      <svg width="24" height="40" viewBox="0 0 24 40" fill="none">
        <motion.line x1="12" y1="0" x2="12" y2="28"
          stroke={fromHex} strokeWidth="1.5" strokeDasharray="4 3"
          animate={{ strokeDashoffset: [0, -14] }}
          transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }} />
        <motion.polyline points="5,22 12,32 19,22"
          stroke={toHex} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity }} />
      </svg>
    </div>
  )
}

const nodeContainerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}
const nodeVariants = {
  hidden: { opacity: 0, scale: 0.75, y: 12 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 22 } },
}

function ConceptNode({ item, stage }) {
  const SvgComp = NODE_SVG[item.id]
  return (
    <motion.div variants={nodeVariants} className="flex flex-col items-center gap-2">
      <motion.div
        whileHover={{ y: -5, scale: 1.1 }}
        whileTap={{ scale: 0.94 }}
        transition={{ type: 'spring', stiffness: 320, damping: 20 }}
      >
        <Link
          to={`/ai/${item.id}`}
          className="flex items-center justify-center w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-2xl border bg-white/[0.03] hover:bg-white/[0.07] transition-colors"
          style={{ borderColor: `${stage.hex}55` }}
        >
          {SvgComp && <SvgComp c={stage.hex} />}
        </Link>
      </motion.div>
      <span className="text-[10px] font-medium text-slate-500 text-center leading-tight w-20 line-clamp-2">
        {item.title}
      </span>
    </motion.div>
  )
}

function StageSection({ stage, items, stageIndex }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-50px' }}
      variants={{
        hidden: { opacity: 0, y: 28 },
        show: { opacity: 1, y: 0, transition: { duration: 0.35, staggerChildren: 0.07, delayChildren: 0.1 } },
      }}
      className="rounded-2xl border px-5 py-5 sm:px-6 sm:py-6"
      style={{ borderColor: `${stage.hex}33`, background: `${stage.hex}08` }}
    >
      <div className="flex items-center gap-3 mb-3">
        <span className={`text-[10px] font-black font-mono tracking-widest ${stage.text} opacity-35`}>
          {String(stageIndex + 1).padStart(2, '0')}
        </span>
        <h2 className={`text-xs font-bold uppercase tracking-[0.16em] ${stage.text}`}>{stage.label}</h2>
        <div className="flex-1 h-px" style={{ background: `${stage.hex}22` }} />
        <span className={`text-[10px] rounded-full px-2 py-0.5 font-medium ${stage.badge}`}>
          {items.length} topic{items.length !== 1 ? 's' : ''}
        </span>
      </div>
      <p className="text-[11px] text-slate-500 leading-relaxed mb-5 max-w-lg">{stage.description}</p>
      <motion.div variants={nodeContainerVariants} className="flex flex-wrap justify-center gap-3 sm:gap-5">
        {items.map((item) => (
          <ConceptNode key={item.id} item={item} stage={stage} />
        ))}
      </motion.div>
    </motion.div>
  )
}

function LiveCodingNode({ item, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: index * 0.04, type: 'spring', stiffness: 260, damping: 22 }}
      whileHover={{ y: -4 }}
    >
      <Link
        to={`/ai/${item.id}`}
        className="group flex items-center gap-3 rounded-xl border border-indigo-500/25 bg-indigo-500/[0.06] hover:bg-indigo-500/[0.11] hover:border-indigo-500/45 p-3.5 transition-colors h-full"
      >
        <div className="w-10 h-10 rounded-xl border border-indigo-500/30 bg-indigo-500/10 flex items-center justify-center shrink-0">
          <SvgLiveCoding c={LIVE_CODING_HEX} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white leading-snug group-hover:text-indigo-200 transition-colors line-clamp-1">
            {item.title}
          </p>
          {item.tagline && (
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed line-clamp-1">{item.tagline}</p>
          )}
          {item.duration && (
            <span className="inline-block mt-1 text-[10px] rounded-full px-2 py-0.5 font-medium bg-indigo-500/15 text-indigo-300">
              {item.duration}
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  )
}

function LiveCodingTier({ items }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl border border-indigo-500/30 px-5 py-5 sm:px-6 sm:py-6"
      style={{ background: `${LIVE_CODING_HEX}08` }}
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="text-[10px] font-black font-mono tracking-widest text-indigo-400 opacity-35">07</span>
        <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-400">Live Coding</h2>
        <div className="flex-1 h-px bg-indigo-500/20" />
        <span className="text-[10px] rounded-full px-2 py-0.5 font-medium bg-indigo-500/15 text-indigo-300">
          {items.length} challenges
        </span>
      </div>
      <p className="text-[11px] text-slate-500 leading-relaxed mb-5 max-w-lg">
        Put it all together in timed AI engineering challenges — build real AI-powered features from scratch under interview conditions.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => (
          <LiveCodingNode key={item.id} item={item} index={i} />
        ))}
      </div>
    </motion.div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AIIndex() {
  const byId = useMemo(() => {
    const map = {}
    AI_ITEMS.forEach((item) => { map[item.id] = item })
    return map
  }, [])

  const liveCodingItems = useMemo(
    () => AI_ITEMS.filter((item) => item.category === 'live-coding'),
    []
  )

  return (
    <div className="space-y-1">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Artificial Intelligence</h1>
        <p className="mt-2 text-slate-400 max-w-2xl">
          A structured path from AI history through LLMs, agentic systems, and production — then into live coding challenges.
          Follow the roadmap top-to-bottom to build a complete mental model of how modern AI systems work and how engineers build with them.
        </p>
      </div>

      <div className="space-y-1">
        {STAGES.map((stage, i) => {
          const items = stage.ids.map((id) => byId[id]).filter(Boolean)
          const nextHex = i < STAGES.length - 1 ? STAGES[i + 1].hex : LIVE_CODING_HEX
          return (
            <div key={stage.id}>
              <StageSection stage={stage} items={items} stageIndex={i} />
              <StageConnector fromHex={stage.hex} toHex={nextHex} />
            </div>
          )
        })}
        <LiveCodingTier items={liveCodingItems} />
      </div>
    </div>
  )
}
