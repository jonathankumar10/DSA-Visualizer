import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { buildComputerArchitectureSteps } from './steps'
import { useTtsRunner } from '../../../../hooks/useTtsRunner'
import StepControls from '../../../../components/ui/StepControls'

// ── Layout ────────────────────────────────────────────────────────────────────
// Container: 500 × 345 px
// CPU centred at (250, 175). Four components radiate in cardinal directions.

const CW = 500   // container width
const CH = 345   // container height

const CPU_NODE = { cx: 250, cy: 175, w: 130, h: 105 }

const SIDE_NODES = [
  {
    id: 'ram', label: 'RAM', icon: '🧠', dir: 'top',
    cx: 250, cy: 52, w: 120, h: 84,
    speed: '~60 ns', size: '8–64 GB',
    color: '#06b6d4', glow: 'rgba(6,182,212,0.65)', lc: '#67e8f9', strip: 'bg-cyan-500',
    desc: 'Volatile working memory — every running program lives here.',
    sdNote: 'Redis replicates the RAM role at software scale.',
  },
  {
    id: 'gpu', label: 'GPU', icon: '🎮', dir: 'right',
    cx: 426, cy: 175, w: 108, h: 98,
    speed: '~1 µs', size: '8–24 GB VRAM',
    color: '#8b5cf6', glow: 'rgba(139,92,246,0.65)', lc: '#c4b5fd', strip: 'bg-violet-500',
    desc: 'Thousands of parallel shader cores: graphics, ML, video encode.',
    sdNote: 'Cloud GPU clusters (A100, H100) are this PCIe offload at datacenter scale.',
  },
  {
    id: 'ssd', label: 'SSD / HDD', icon: '🗄️', dir: 'bottom',
    cx: 250, cy: 301, w: 120, h: 84,
    speed: '~100 µs', size: '1–4 TB',
    color: '#f59e0b', glow: 'rgba(245,158,11,0.65)', lc: '#fcd34d', strip: 'bg-amber-500',
    desc: 'Persistent storage — survives power loss. Databases live here.',
    sdNote: 'WALs, B-trees, LSM trees all optimise around disk latency.',
  },
  {
    id: 'nic', label: 'Network', icon: '🌐', dir: 'left',
    cx: 66, cy: 175, w: 108, h: 98,
    speed: '~100 ms', size: 'unlimited',
    color: '#a78bfa', glow: 'rgba(167,139,250,0.65)', lc: '#c4b5fd', strip: 'bg-violet-400',
    desc: 'NIC handles packet TX/RX via DMA — no CPU stall during transfer.',
    sdNote: 'CDNs and load balancers are attempts to move the NIC closer to the user.',
  },
]

// Connection endpoints — from CPU edge to component edge
const CONNECTIONS = {
  ram: { x1: 250, y1: CPU_NODE.cy - CPU_NODE.h / 2,  x2: 250, y2: 94,  axis: 'v' },
  gpu: { x1: CPU_NODE.cx + CPU_NODE.w / 2, y1: 175,  x2: 372, y2: 175, axis: 'h' },
  ssd: { x1: 250, y1: CPU_NODE.cy + CPU_NODE.h / 2,  x2: 250, y2: 259, axis: 'v' },
  nic: { x1: CPU_NODE.cx - CPU_NODE.w / 2, y1: 175,  x2: 120, y2: 175, axis: 'h' },
}

const DIR_C = {
  request:  { hex: '#3b82f6', glow: 'rgba(59,130,246,0.85)' },
  response: { hex: '#10b981', glow: 'rgba(16,185,129,0.85)' },
}

// ── Bus connection (SVG particles) ────────────────────────────────────────────

function BusConnection({ nodeId, connections, stepKey }) {
  const conn      = CONNECTIONS[nodeId]
  const direction = connections[`cpu-${nodeId}`]
  const isActive  = !!direction
  const fwd       = isActive && (direction === 'request'  || direction === 'both')
  const bwd       = isActive && (direction === 'response' || direction === 'both')

  // forward = CPU → node
  const [fx, fy] = [conn.x1, conn.y1]
  const [tx, ty] = [conn.x2, conn.y2]

  return (
    <g>
      {/* Line */}
      <line
        x1={conn.x1} y1={conn.y1} x2={conn.x2} y2={conn.y2}
        stroke={isActive ? DIR_C.request.hex : '#182030'}
        strokeWidth={isActive ? 2 : 1}
        strokeDasharray={isActive ? 'none' : '5 4'}
        style={{ filter: isActive ? `drop-shadow(0 0 5px ${DIR_C.request.glow})` : 'none', transition: 'all 0.3s' }}
      />

      {/* Forward particles */}
      {fwd && [0, 1, 2].map((p) => (
        <motion.circle
          key={`${stepKey}-${nodeId}-f${p}`}
          r={3.5} fill={DIR_C.request.hex}
          style={{ filter: `drop-shadow(0 0 5px ${DIR_C.request.glow})` }}
          animate={conn.axis === 'v'
            ? { cx: fx, cy: [fy, ty] }
            : { cx: [fx, tx], cy: fy }}
          transition={{ duration: 0.5, delay: p * 0.16, ease: 'linear', repeat: Infinity, repeatDelay: 0.1 }}
        />
      ))}

      {/* Backward particles */}
      {bwd && [0, 1, 2].map((p) => (
        <motion.circle
          key={`${stepKey}-${nodeId}-b${p}`}
          r={3.5} fill={DIR_C.response.hex}
          style={{ filter: `drop-shadow(0 0 5px ${DIR_C.response.glow})` }}
          animate={conn.axis === 'v'
            ? { cx: tx, cy: [ty, fy] }
            : { cx: [tx, fx], cy: ty }}
          transition={{ duration: 0.5, delay: p * 0.16, ease: 'linear', repeat: Infinity, repeatDelay: 0.1 }}
        />
      ))}
    </g>
  )
}

// ── CPU centre block ──────────────────────────────────────────────────────────

const CORE_DELAYS = [0, 0.14, 0.28, 0.42, 0.07, 0.21]

function CPUBlock({ isActive }) {
  const { cx, cy, w, h } = CPU_NODE
  return (
    <motion.div
      className="absolute flex flex-col p-2.5 rounded-2xl border-2 overflow-hidden"
      style={{ left: cx - w / 2, top: cy - h / 2, width: w, height: h }}
      animate={{
        borderColor:     isActive ? '#3b82f6' : 'rgba(255,255,255,0.1)',
        backgroundColor: isActive ? 'rgba(59,130,246,0.08)' : 'rgba(10,18,36,1)',
        boxShadow:       isActive ? '0 0 44px -6px rgba(59,130,246,0.65), inset 0 0 24px -10px rgba(59,130,246,0.3)' : 'none',
      }}
      transition={{ duration: 0.3 }}
    >
      {/* Accent strip */}
      <motion.div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500"
        animate={{ opacity: isActive ? 1 : 0.15 }} />

      {/* Header */}
      <div className="flex items-center gap-1.5 pb-1.5 border-b border-white/10 shrink-0">
        <span className="text-base select-none">⚙️</span>
        <div>
          <p className="text-[11px] font-bold text-white leading-none">CPU</p>
          <p className="text-[8px] text-slate-500 font-mono">3–5 GHz</p>
        </div>
      </div>

      {/* Core grid */}
      <div className="flex-1 flex items-center justify-center">
        <div className="grid grid-cols-3 gap-1">
          {CORE_DELAYS.map((delay, i) => (
            <motion.div
              key={i}
              className="w-6 h-6 rounded border relative overflow-hidden"
              animate={{
                borderColor:     isActive ? '#3b82f660' : '#1e293b',
                backgroundColor: isActive ? 'rgba(59,130,246,0.15)' : 'transparent',
              }}
              transition={{ duration: 0.2, delay: isActive ? delay : 0 }}
            >
              {isActive && (
                <motion.div
                  className="absolute inset-0 bg-blue-400/30 rounded-sm"
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 0.65 + delay * 0.4, repeat: Infinity, delay }}
                />
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Cache sub-label */}
      <motion.p
        animate={{ color: isActive ? '#60a5fa' : '#1e293b' }}
        className="text-[8px] font-mono text-center mt-1 shrink-0"
      >
        L1 / L2 / L3 Cache
      </motion.p>
    </motion.div>
  )
}

// ── Side component block ──────────────────────────────────────────────────────

function SideBlock({ node, isActive, wasVisited, isExpanded, onClick, popKey }) {
  const { cx, cy, w, h } = node
  return (
    <div className="absolute" style={{ left: cx - w / 2, top: cy - h / 2, width: w, height: h }}>
      <motion.button
        onClick={onClick}
        className="relative w-full h-full rounded-xl border-2 overflow-hidden flex flex-col items-center justify-center gap-0.5 px-1 cursor-pointer focus:outline-none"
        animate={{
          borderColor:     isActive ? node.color : wasVisited ? `${node.color}38` : 'rgba(255,255,255,0.08)',
          backgroundColor: isActive ? `${node.color}16` : wasVisited ? `${node.color}07` : 'rgba(10,18,36,1)',
          boxShadow:       isActive ? `0 0 32px -5px ${node.glow}` : 'none',
        }}
        transition={{ duration: 0.28 }}
      >
        {/* Top strip */}
        <motion.div className={`absolute top-0 left-0 right-0 h-0.5 ${node.strip}`}
          animate={{ opacity: isActive ? 1 : wasVisited ? 0.35 : 0.12 }} />

        {/* Ripple burst */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={`${popKey ?? 'i'}-${node.id}-${i}`}
            className="absolute inset-0 rounded-xl border-2 pointer-events-none"
            style={{ borderColor: node.color }}
            initial={{ scale: 1, opacity: popKey != null ? 0.65 : 0 }}
            animate={{ scale: 2.0 + i * 0.35, opacity: 0 }}
            transition={{ duration: 0.7, delay: i * 0.12, ease: 'easeOut' }}
          />
        ))}

        {/* Icon */}
        <motion.span
          key={`ic-${popKey ?? 0}`}
          animate={popKey != null ? { scale: [1, 1.4, 0.88, 1.06, 1] } : { scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 12 }}
          className="text-xl leading-none select-none"
        >
          {node.icon}
        </motion.span>

        {/* Label */}
        <motion.p
          animate={{ color: isActive ? node.lc : wasVisited ? '#94a3b8' : '#475569' }}
          className="text-[10px] font-bold text-center leading-tight"
        >
          {node.label}
        </motion.p>

        {/* Speed */}
        <motion.p
          animate={{ color: isActive ? node.color : '#1f2937' }}
          className="text-[9px] font-mono"
        >
          {node.speed}
        </motion.p>

        <p className="text-[8px] text-slate-700">{node.size}</p>
      </motion.button>

      {/* Info panel — appears toward the outer edge */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 360, damping: 26 }}
            className="absolute z-30 w-48 rounded-xl border bg-slate-900/96 backdrop-blur shadow-2xl p-3 space-y-1.5"
            style={{
              borderColor: `${node.color}40`,
              // Position toward outer edge
              ...(node.dir === 'top'    ? { top: '105%',   left: '50%', transform: 'translateX(-50%)' } : {}),
              ...(node.dir === 'right'  ? { left: '105%',  top: '50%',  transform: 'translateY(-50%)' } : {}),
              ...(node.dir === 'bottom' ? { bottom: '105%',left: '50%', transform: 'translateX(-50%)' } : {}),
              ...(node.dir === 'left'   ? { right: '105%', top: '50%',  transform: 'translateY(-50%)' } : {}),
            }}
          >
            <p className="text-[11px] font-bold" style={{ color: node.lc }}>{node.label}</p>
            <p className="text-[10px] text-slate-400 leading-relaxed">{node.desc}</p>
            <p className="text-[10px] italic" style={{ color: node.color }}>{node.sdNote}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ComputerArchitectureDiagram() {
  const steps  = useMemo(() => buildComputerArchitectureSteps(), [])
  const runner = useTtsRunner(steps, (step) => `${step.message}. ${step.detail}`)
  const { step, index } = runner

  const [expandedNode, setExpandedNode] = useState(null)

  const visitedNodes = useMemo(() => {
    const s = new Set()
    for (let i = 0; i <= index; i++) steps[i].activeNodes.forEach((id) => s.add(id))
    return s
  }, [steps, index])

  const cpuActive   = step.activeNodes.includes('cpu')
  const showBanner  = step.type === 'gaming' || step.type === 'sd-insight' || step.type === 'full-system'

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-white">Computer System — Hub & Spoke</h2>
        <p className="text-sm text-slate-400">
          CPU at the centre. Every component connects through it. Step through real operations to see how they interact.
        </p>
      </div>

      {/* Diagram */}
      <div
        className="rounded-2xl border border-white/10 p-3 sm:p-5"
        style={{
          background: '#060d1a',
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      >
        <div className="overflow-x-auto pb-2">
          <div style={{ minWidth: CW }}>

            {/* Hub diagram */}
            <div className="relative mx-auto" style={{ width: CW, height: CH }}>

              {/* CPU die outer ring (subtle) */}
              <div
                className="absolute rounded-full border border-blue-500/10 pointer-events-none"
                style={{ left: CPU_NODE.cx - 140, top: CPU_NODE.cy - 140, width: 280, height: 280 }}
              />

              {/* SVG overlay for bus lines + particles */}
              <svg
                className="absolute inset-0 pointer-events-none overflow-visible"
                viewBox={`0 0 ${CW} ${CH}`}
                width={CW} height={CH}
              >
                {SIDE_NODES.map((node) => (
                  <BusConnection
                    key={node.id}
                    nodeId={node.id}
                    connections={step.connections}
                    stepKey={index}
                  />
                ))}
              </svg>

              {/* CPU centre block */}
              <CPUBlock isActive={cpuActive} />

              {/* Side component blocks */}
              {SIDE_NODES.map((node) => (
                <SideBlock
                  key={node.id}
                  node={node}
                  isActive={step.activeNodes.includes(node.id)}
                  wasVisited={visitedNodes.has(node.id) && !step.activeNodes.includes(node.id)}
                  isExpanded={expandedNode === node.id}
                  onClick={() => setExpandedNode((p) => p === node.id ? null : node.id)}
                  popKey={step.activeNodes.includes(node.id) ? index : null}
                />
              ))}
            </div>

            {/* Gaming / insight banner */}
            <AnimatePresence>
              {showBanner && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0,  scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                  className={`relative mt-3 flex items-center gap-3 rounded-xl border px-4 py-3 overflow-hidden ${
                    step.type === 'sd-insight'
                      ? 'border-blue-500/40 bg-blue-500/[0.07]'
                      : 'border-violet-500/40 bg-violet-500/[0.07]'
                  }`}
                >
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={`b-r-${i}`}
                      className={`absolute inset-0 rounded-xl border pointer-events-none ${step.type === 'sd-insight' ? 'border-blue-400/18' : 'border-violet-400/18'}`}
                      initial={{ scale: 0.95, opacity: 0.65 }}
                      animate={{ scale: 1.5 + i * 0.3, opacity: 0 }}
                      transition={{ duration: 1.1, delay: i * 0.2, ease: 'easeOut' }}
                    />
                  ))}
                  <span className="text-xl relative z-10 select-none">
                    {step.type === 'sd-insight' ? '💡' : step.type === 'gaming' ? '🎮' : '💻'}
                  </span>
                  <div className="relative z-10">
                    <p className={`text-[11px] font-bold uppercase tracking-wider ${step.type === 'sd-insight' ? 'text-blue-400' : 'text-violet-400'}`}>
                      {step.type === 'sd-insight' ? 'System Design Insight' : 'All Components Active'}
                    </p>
                    <p className="text-sm text-white">
                      {step.type === 'sd-insight'
                        ? 'Redis = RAM · Database = SSD · GPU cloud = PCIe at scale · CDN = NIC near the edge'
                        : 'Every data path flows through the CPU — it is the bottleneck and the hub'}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 mt-3 px-1 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-px bg-blue-500 rounded-full" style={{ boxShadow: '0 0 4px rgba(59,130,246,0.8)' }} />
            <span className="text-[10px] text-slate-500">CPU → component</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-px bg-emerald-500 rounded-full" style={{ boxShadow: '0 0 4px rgba(16,185,129,0.8)' }} />
            <span className="text-[10px] text-slate-500">← response</span>
          </div>
          <span className="text-[10px] text-slate-600 ml-auto hidden sm:inline">tap any component for details</span>
        </div>
      </div>

      {/* Step message */}
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
