import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { buildAvailabilityPatternsSteps } from './steps'
import { useStepRunner } from '../../../../hooks/useStepRunner'
import StepControls from '../../../../components/ui/StepControls'

const CW = 620
const CH = 310

const NODES = [
  {
    id: 'client', label: 'Client', icon: '💻', dir: 'left',
    cx: 72, cy: 155, w: 100, h: 72,
    color: '#8b5cf6', glow: 'rgba(139,92,246,0.65)', lc: '#c4b5fd', strip: 'bg-violet-500',
    sub1: 'sends requests', sub2: 'browser / app',
    desc: 'The end user\'s browser or mobile app sending requests to the system. During failover, the client may receive errors or timeouts — the goal is to minimize this window.',
    note: 'Health check intervals determine the failover detection time. 30s interval means up to 30s of errors before failover begins.',
  },
  {
    id: 'lb', label: 'Load Balancer', icon: '⚖️', dir: 'top',
    cx: 240, cy: 155, w: 120, h: 80,
    color: '#0ea5e9', glow: 'rgba(14,165,233,0.65)', lc: '#7dd3fc', strip: 'bg-sky-500',
    sub1: 'health checks', sub2: 'auto failover',
    desc: 'Routes requests to healthy servers. Probes each server on /health every few seconds. Removes unresponsive servers from rotation automatically.',
    note: 'The load balancer is itself a potential SPOF — production setups use active-active load balancers with anycast or floating IPs for redundancy.',
  },
  {
    id: 'primary', label: 'Primary', icon: '🖥️', dir: 'top',
    cx: 430, cy: 90, w: 118, h: 78,
    color: '#10b981', glow: 'rgba(16,185,129,0.65)', lc: '#6ee7b7', strip: 'bg-emerald-500',
    sub1: 'handles traffic', sub2: 'active server',
    desc: 'The primary server handling all production traffic. Continuously replicates state to the standby. Health checks from the load balancer ensure it is responsive.',
    note: 'In active-passive, the primary is the only node serving traffic. In active-active, both primary and standby serve traffic simultaneously.',
  },
  {
    id: 'standby', label: 'Standby', icon: '🖥️', dir: 'bottom',
    cx: 430, cy: 230, w: 118, h: 78,
    color: '#f59e0b', glow: 'rgba(245,158,11,0.65)', lc: '#fcd34d', strip: 'bg-amber-500',
    sub1: 'warm standby', sub2: 'ready to promote',
    desc: 'A synchronized hot standby. Receives continuous replication from the primary and can be promoted within seconds. Not serving traffic in active-passive mode.',
    note: 'Hot standby (in sync) vs warm standby (periodic sync) vs cold standby (manual setup). Hotter = faster failover, higher cost.',
  },
]

const EDGES = {
  'client-lb':       { x1: 122, y1: 155, x2: 180, y2: 155, axis: 'h' },
  'lb-primary':      { x1: 300, y1: 130, x2: 371, y2: 101, axis: 'd' },
  'lb-standby':      { x1: 300, y1: 178, x2: 371, y2: 218, axis: 'd' },
  'primary-standby': { x1: 430, y1: 129, x2: 430, y2: 191, axis: 'v' },
}

const C = {
  violet:  { hex: '#8b5cf6', glow: 'rgba(139,92,246,0.85)'  },
  sky:     { hex: '#0ea5e9', glow: 'rgba(14,165,233,0.85)'  },
  emerald: { hex: '#10b981', glow: 'rgba(16,185,129,0.85)'  },
  amber:   { hex: '#f59e0b', glow: 'rgba(245,158,11,0.85)'  },
  red:     { hex: '#f43f5e', glow: 'rgba(244,63,94,0.85)'   },
}

const DIR_MAP = {
  request:  { fwd: C.violet,  bwd: null      },
  response: { fwd: C.emerald, bwd: null      },
  both:     { fwd: C.violet,  bwd: C.emerald },
}

const FAIL_BANNERS = {
  'primary-down':  { icon: '⚠️', color: 'rose',   label: 'Primary Down — Failover Initiated', sub: 'Load balancer removing primary from rotation · promoting standby' },
  'circuit-open':  { icon: '🔴', color: 'rose',   label: 'Circuit Breaker Open — Fast Failing', sub: 'No requests reaching downstream · returning cached fallback immediately' },
  'degraded':      { icon: '🟡', color: 'amber',  label: 'Degraded Mode — Core Features Serving', sub: 'Non-critical features disabled · recommendations, ML services unavailable' },
}

function EdgeConnection({ edgeId, connections, stepKey, failState }) {
  const edge = EDGES[edgeId]
  const dir  = connections[edgeId]
  const map  = DIR_MAP[dir]
  const { x1, y1, x2, y2, axis } = edge

  const fwdC = map?.fwd ?? null
  const bwdC = map?.bwd ?? null
  const isActive = !!map

  const isBrokenEdge = edgeId === 'lb-primary' && failState === 'primary-down'

  const fwdAnim = axis === 'v' ? { cx: x1,       cy: [y1, y2] }
                : axis === 'h' ? { cx: [x1, x2], cy: y1       }
                :                { cx: [x1, x2], cy: [y1, y2] }
  const bwdAnim = axis === 'v' ? { cx: x2,       cy: [y2, y1] }
                : axis === 'h' ? { cx: [x2, x1], cy: y2       }
                :                { cx: [x2, x1], cy: [y2, y1] }

  return (
    <g>
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={isBrokenEdge ? C.red.hex : isActive ? (fwdC?.hex ?? '#1e293b') : '#182030'}
        strokeWidth={isActive || isBrokenEdge ? 2 : 1}
        strokeDasharray={isBrokenEdge ? '4 3' : isActive ? 'none' : '5 4'}
        style={{
          filter: isBrokenEdge ? `drop-shadow(0 0 5px ${C.red.glow})` : isActive && fwdC ? `drop-shadow(0 0 5px ${fwdC.glow})` : 'none',
          transition: 'all 0.3s',
        }}
      />
      {!isBrokenEdge && fwdC && [0, 1, 2].map((p) => (
        <motion.circle
          key={`${stepKey}-${edgeId}-f${p}`}
          r={3.5} fill={fwdC.hex}
          style={{ filter: `drop-shadow(0 0 5px ${fwdC.glow})` }}
          animate={fwdAnim}
          transition={{ duration: 0.5, delay: p * 0.16, ease: 'linear', repeat: Infinity, repeatDelay: 0.1 }}
        />
      ))}
      {!isBrokenEdge && bwdC && [0, 1, 2].map((p) => (
        <motion.circle
          key={`${stepKey}-${edgeId}-b${p}`}
          r={3.5} fill={bwdC.hex}
          style={{ filter: `drop-shadow(0 0 5px ${bwdC.glow})` }}
          animate={bwdAnim}
          transition={{ duration: 0.5, delay: p * 0.16, ease: 'linear', repeat: Infinity, repeatDelay: 0.1 }}
        />
      ))}
    </g>
  )
}

function NodeBlock({ node, isActive, wasVisited, isExpanded, onClick, popKey, isDown }) {
  const { cx, cy, w, h } = node
  return (
    <div className="absolute" style={{ left: cx - w / 2, top: cy - h / 2, width: w, height: h }}>
      <motion.button
        onClick={onClick}
        className="relative w-full h-full rounded-xl border-2 overflow-hidden flex flex-col items-center justify-center gap-0.5 px-1 cursor-pointer focus:outline-none"
        animate={{
          borderColor:     isDown ? C.red.hex : isActive ? node.color : wasVisited ? `${node.color}38` : 'rgba(255,255,255,0.08)',
          backgroundColor: isDown ? 'rgba(244,63,94,0.08)' : isActive ? `${node.color}16` : wasVisited ? `${node.color}07` : 'rgba(10,18,36,1)',
          boxShadow:       isDown ? `0 0 24px -6px ${C.red.glow}` : isActive ? `0 0 28px -5px ${node.glow}` : 'none',
        }}
        transition={{ duration: 0.28 }}
      >
        <motion.div className={`absolute top-0 left-0 right-0 h-0.5 ${node.strip}`}
          animate={{ opacity: isDown ? 0.2 : isActive ? 1 : wasVisited ? 0.35 : 0.12 }} />

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

        <motion.span
          key={`ic-${popKey ?? 0}`}
          animate={popKey != null ? { scale: [1, 1.4, 0.88, 1.06, 1] } : { scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 12 }}
          className="text-xl leading-none select-none"
        >
          {node.icon}
        </motion.span>

        <motion.p animate={{ color: isDown ? C.red.hex : isActive ? node.lc : wasVisited ? '#94a3b8' : '#475569' }}
          className="text-[10px] font-bold text-center leading-tight">
          {node.label}
        </motion.p>

        <motion.p animate={{ color: isActive ? node.color : '#1f2937' }} className="text-[9px] font-mono">
          {isDown ? 'DOWN' : node.sub1}
        </motion.p>
        <p className="text-[8px] text-slate-700">{node.sub2}</p>

        <AnimatePresence>
          {isDown && (
            <motion.span
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 360, damping: 20 }}
              className="absolute top-1 right-1 text-[7px] font-bold font-mono text-rose-400 bg-rose-400/10 border border-rose-400/30 rounded px-1"
            >
              FAILED
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 360, damping: 26 }}
            className="absolute z-30 w-52 rounded-xl border bg-slate-900/96 backdrop-blur shadow-2xl p-3 space-y-1.5"
            style={{
              borderColor: `${node.color}40`,
              ...(node.dir === 'top'    ? { top: '105%',    left: '50%', transform: 'translateX(-50%)' } : {}),
              ...(node.dir === 'right'  ? { left: '105%',   top: '50%',  transform: 'translateY(-50%)' } : {}),
              ...(node.dir === 'bottom' ? { bottom: '105%', left: '50%', transform: 'translateX(-50%)' } : {}),
              ...(node.dir === 'left'   ? { right: '105%',  top: '50%',  transform: 'translateY(-50%)' } : {}),
            }}
          >
            <p className="text-[11px] font-bold" style={{ color: node.lc }}>{node.label}</p>
            <p className="text-[10px] text-slate-400 leading-relaxed">{node.desc}</p>
            <p className="text-[10px] italic" style={{ color: node.color }}>{node.note}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function AvailabilityPatternsDiagram() {
  const steps  = useMemo(() => buildAvailabilityPatternsSteps(), [])
  const runner = useStepRunner(steps)
  const { step, index } = runner

  const [expandedNode, setExpandedNode] = useState(null)

  const visitedNodes = useMemo(() => {
    const s = new Set()
    for (let i = 0; i <= index; i++) steps[i].activeNodes.forEach((id) => s.add(id))
    return s
  }, [steps, index])

  const failBanner = step.failState ? FAIL_BANNERS[step.failState] : null

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">Availability Patterns</h2>
        <p className="text-sm text-slate-400">
          Step through active-active, active-passive failover, health checks, circuit breakers, and graceful degradation.
        </p>
      </div>

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
            <div className="relative mx-auto" style={{ width: CW, height: CH }}>

              <svg
                className="absolute inset-0 pointer-events-none overflow-visible"
                viewBox={`0 0 ${CW} ${CH}`}
                width={CW} height={CH}
              >
                <text x="72"  y="22" textAnchor="middle" fill="#334155" fontSize="9" fontWeight="600" letterSpacing="1.5">CLIENT</text>
                <text x="240" y="22" textAnchor="middle" fill="#334155" fontSize="9" fontWeight="600" letterSpacing="1.5">LOAD BALANCER</text>
                <text x="430" y="22" textAnchor="middle" fill="#334155" fontSize="9" fontWeight="600" letterSpacing="1.5">SERVERS</text>

                {Object.keys(EDGES).map((edgeId) => (
                  <EdgeConnection
                    key={edgeId}
                    edgeId={edgeId}
                    connections={step.connections}
                    stepKey={index}
                    failState={step.failState}
                  />
                ))}
              </svg>

              {NODES.map((node) => (
                <NodeBlock
                  key={node.id}
                  node={node}
                  isActive={step.activeNodes.includes(node.id)}
                  wasVisited={visitedNodes.has(node.id) && !step.activeNodes.includes(node.id)}
                  isExpanded={expandedNode === node.id}
                  onClick={() => setExpandedNode((p) => p === node.id ? null : node.id)}
                  popKey={step.activeNodes.includes(node.id) ? index : null}
                  isDown={node.id === 'primary' && step.failState === 'primary-down'}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              {failBanner && (
                <motion.div
                  key={step.failState}
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                  className={`mt-3 flex items-center gap-3 rounded-xl border px-4 py-2.5 ${
                    failBanner.color === 'rose'
                      ? 'border-rose-500/40 bg-rose-500/[0.07]'
                      : 'border-amber-500/40 bg-amber-500/[0.07]'
                  }`}
                >
                  <span className="text-xl select-none">{failBanner.icon}</span>
                  <div>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${failBanner.color === 'rose' ? 'text-rose-400' : 'text-amber-400'}`}>
                      {failBanner.label}
                    </p>
                    <p className={`text-[11px] font-mono ${failBanner.color === 'rose' ? 'text-rose-300' : 'text-amber-300'}`}>
                      {failBanner.sub}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-5 mt-3 px-1 flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-px rounded-full" style={{ background: C.violet.hex, boxShadow: `0 0 4px ${C.violet.glow}` }} />
                <span className="text-[10px] text-slate-500">request</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-px rounded-full" style={{ background: C.emerald.hex, boxShadow: `0 0 4px ${C.emerald.glow}` }} />
                <span className="text-[10px] text-slate-500">response / replication</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-px rounded-full" style={{ background: C.red.hex, boxShadow: `0 0 4px ${C.red.glow}`, strokeDasharray: '4 3' }} />
                <span className="text-[10px] text-slate-500">failed connection</span>
              </div>
              <span className="text-[10px] text-slate-600 ml-auto hidden sm:inline">tap any node for details</span>
            </div>
          </div>
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
