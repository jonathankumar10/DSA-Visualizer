import { useMemo, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { buildDistributedTracingSteps } from './steps'
import { useStepRunner } from '../../../../hooks/useStepRunner'
import StepControls from '../../../../components/ui/StepControls'

// ── Layout ────────────────────────────────────────────────────────────────────
// Client (left) → Gateway (center-left) → Service A (center) → Service B (center-right)
// Tracing Backend (right) receives spans from all services

const CW = 680
const CH = 280

const NODES = [
  {
    id: 'client', label: 'Client', icon: '💻', dir: 'bottom',
    cx: 60, cy: 140, w: 96, h: 78,
    color: '#94a3b8', glow: 'rgba(148,163,184,0.65)', lc: '#cbd5e1', strip: 'bg-slate-400',
    sub1: 'browser / app', sub2: 'makes HTTP call',
    desc: 'The end user or external caller making the initial request.',
    note: 'The client has no visibility into which services are involved — tracing gives you that view.',
  },
  {
    id: 'gateway', label: 'API Gateway', icon: '🚪', dir: 'top',
    cx: 190, cy: 140, w: 112, h: 80,
    color: '#8b5cf6', glow: 'rgba(139,92,246,0.65)', lc: '#c4b5fd', strip: 'bg-violet-500',
    sub1: 'trace ID born here', sub2: 'root span',
    desc: 'Entry point for all traffic. Generates the trace ID and root span, injects W3C traceparent into outgoing headers.',
    note: 'Every trace starts here. If the gateway drops the trace header, the trace is lost.',
  },
  {
    id: 'serviceA', label: 'Service A', icon: '⚙️', dir: 'top',
    cx: 330, cy: 140, w: 112, h: 80,
    color: '#3b82f6', glow: 'rgba(59,130,246,0.65)', lc: '#93c5fd', strip: 'bg-blue-500',
    sub1: 'child span', sub2: 'propagates context',
    desc: 'Reads the traceparent header, creates a child span, runs its business logic, and injects the header into calls to Service B.',
    note: 'OTel auto-instrumentation handles this transparently for HTTP, gRPC, and database calls.',
  },
  {
    id: 'serviceB', label: 'Service B', icon: '🔧', dir: 'top',
    cx: 470, cy: 140, w: 112, h: 80,
    color: '#0ea5e9', glow: 'rgba(14,165,233,0.65)', lc: '#7dd3fc', strip: 'bg-sky-500',
    sub1: 'leaf span', sub2: 'data layer',
    desc: 'The deepest service in the call chain. Creates the leaf span. Any slowness here is directly visible in the trace flame graph.',
    note: 'The bottleneck is always easier to find in a trace than in logs — just look for the widest bar.',
  },
  {
    id: 'tracing', label: 'Jaeger', icon: '🔍', dir: 'left',
    cx: 610, cy: 140, w: 110, h: 80,
    color: '#10b981', glow: 'rgba(16,185,129,0.65)', lc: '#6ee7b7', strip: 'bg-emerald-500',
    sub1: 'span collector', sub2: 'flame graph UI',
    desc: 'Receives spans from all services, correlates them by trace ID, and renders the full timeline. Also supports dependency graph and service map views.',
    note: 'Jaeger, Zipkin, Honeycomb, and AWS X-Ray all speak OpenTelemetry — swap exporters without re-instrumenting.',
  },
]

const EDGES = {
  'client-gateway':   { x1: 108,  y1: 140, x2: 134,  y2: 140, axis: 'h' },
  'gateway-serviceA': { x1: 246,  y1: 140, x2: 274,  y2: 140, axis: 'h' },
  'serviceA-serviceB':{ x1: 386,  y1: 140, x2: 414,  y2: 140, axis: 'h' },
  'serviceA-tracing': { x1: 386,  y1: 120, x2: 555,  y2: 115, axis: 'd' },
  'serviceB-tracing': { x1: 526,  y1: 140, x2: 555,  y2: 140, axis: 'h' },
}

const C = {
  request:  { hex: '#8b5cf6', glow: 'rgba(139,92,246,0.85)'  },
  response: { hex: '#10b981', glow: 'rgba(16,185,129,0.85)'  },
  span:     { hex: '#f59e0b', glow: 'rgba(245,158,11,0.85)'  },
}

// ── Edge connection ───────────────────────────────────────────────────────────

function EdgeConnection({ edgeId, connections, stepKey }) {
  const edge      = EDGES[edgeId]
  const direction = connections[edgeId]
  const isActive  = !!direction

  const colorKey  = direction === 'response' ? 'response' : direction === 'span' ? 'span' : 'request'
  const fwdC      = isActive ? C[colorKey] : null
  const bwd       = isActive && direction === 'both'
  const bwdC      = bwd ? C.response : null

  const { x1, y1, x2, y2, axis } = edge

  const fwdAnim = axis === 'v' ? { cx: x1, cy: [y1, y2] }
                : axis === 'h' ? { cx: [x1, x2], cy: y1 }
                : { cx: [x1, x2], cy: [y1, y2] }

  const bwdAnim = axis === 'v' ? { cx: x2, cy: [y2, y1] }
                : axis === 'h' ? { cx: [x2, x1], cy: y2 }
                : { cx: [x2, x1], cy: [y2, y1] }

  return (
    <g>
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={isActive ? (fwdC?.hex ?? '#1e293b') : '#182030'}
        strokeWidth={isActive ? 2 : 1}
        strokeDasharray={isActive ? 'none' : '5 4'}
        style={{ filter: isActive && fwdC ? `drop-shadow(0 0 5px ${fwdC.glow})` : 'none', transition: 'all 0.3s' }}
      />
      {fwdC && [0, 1, 2].map((p) => (
        <motion.circle
          key={`${stepKey}-${edgeId}-f${p}`}
          r={3.5} fill={fwdC.hex}
          style={{ filter: `drop-shadow(0 0 5px ${fwdC.glow})` }}
          animate={fwdAnim}
          transition={{ duration: 0.5, delay: p * 0.16, ease: 'linear', repeat: Infinity, repeatDelay: 0.1 }}
        />
      ))}
      {bwdC && [0, 1, 2].map((p) => (
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

// ── Node block ────────────────────────────────────────────────────────────────

function NodeBlock({ node, isActive, wasVisited, isExpanded, onClick, popKey, badge }) {
  const { cx, cy, w, h } = node
  return (
    <div className="absolute" style={{ left: cx - w / 2, top: cy - h / 2, width: w, height: h }}>
      <motion.button
        onClick={onClick}
        className="relative w-full h-full rounded-xl border-2 overflow-hidden flex flex-col items-center justify-center gap-0.5 px-1 cursor-pointer focus:outline-none"
        animate={{
          borderColor:     isActive ? node.color : wasVisited ? `${node.color}38` : 'rgba(255,255,255,0.08)',
          backgroundColor: isActive ? `${node.color}16` : wasVisited ? `${node.color}07` : 'rgba(10,18,36,1)',
          boxShadow:       isActive ? `0 0 30px -5px ${node.glow}` : 'none',
        }}
        transition={{ duration: 0.28 }}
      >
        <motion.div
          className={`absolute top-0 left-0 right-0 h-0.5 ${node.strip}`}
          animate={{ opacity: isActive ? 1 : wasVisited ? 0.35 : 0.12 }}
        />

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

        <motion.p
          animate={{ color: isActive ? node.lc : wasVisited ? '#94a3b8' : '#475569' }}
          className="text-[10px] font-bold text-center leading-tight"
        >
          {node.label}
        </motion.p>

        <motion.p
          animate={{ color: isActive ? node.color : '#1f2937' }}
          className="text-[9px] font-mono"
        >
          {node.sub1}
        </motion.p>
        <p className="text-[8px] text-slate-700">{node.sub2}</p>

        <AnimatePresence>
          {badge && isActive && (
            <motion.span
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 360, damping: 20 }}
              className="absolute top-1 right-1 text-[7px] font-bold font-mono text-violet-300 bg-violet-500/15 border border-violet-400/30 rounded px-1 leading-tight"
            >
              {badge}
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

// ── Main component ────────────────────────────────────────────────────────────

export default function DistributedTracingDiagram({ onStepChange }) {
  const steps  = useMemo(() => buildDistributedTracingSteps(), [])
  const runner = useStepRunner(steps)
  const { step, index } = runner

  useEffect(() => { onStepChange?.(step) }, [step, onStepChange])

  const [expandedNode, setExpandedNode] = useState(null)

  const visitedNodes = useMemo(() => {
    const s = new Set()
    for (let i = 0; i <= index; i++) steps[i].activeNodes.forEach((id) => s.add(id))
    return s
  }, [steps, index])

  const showAssembled = step.type === 'full-trace' || step.type === 'bottleneck'
  const showBottleneck = step.type === 'bottleneck'

  return (
    <div className="space-y-4">

      <div>
        <h2 className="text-lg font-semibold text-white">Distributed Tracing — Span by Span</h2>
        <p className="text-sm text-slate-400">
          Follow a request through microservices, watch spans propagate, and see how Jaeger assembles the full trace.
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
                {Object.keys(EDGES).map((edgeId) => (
                  <EdgeConnection
                    key={edgeId}
                    edgeId={edgeId}
                    connections={step.connections}
                    stepKey={index}
                  />
                ))}

                {/* Span label on collector edges */}
                {(step.connections['serviceA-tracing'] || step.connections['serviceB-tracing']) && (
                  <>
                    <text x={460} y={105} style={{ fill: '#f59e0b', fontSize: 8, fontFamily: 'ui-monospace, monospace', fontWeight: 700, opacity: 0.8 }}>
                      span emit
                    </text>
                  </>
                )}
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
                  badge={node.id === 'gateway' && step.badge ? step.badge : null}
                />
              ))}
            </div>

            {/* Trace assembled / bottleneck banner */}
            <AnimatePresence mode="wait">
              {showAssembled && (
                <motion.div
                  key={step.type}
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                  className="relative mt-3 flex items-center gap-4 rounded-xl border px-4 py-3 overflow-hidden"
                  style={{
                    borderColor: showBottleneck ? 'rgba(251,191,36,0.4)' : 'rgba(16,185,129,0.4)',
                    background:  showBottleneck ? 'rgba(251,191,36,0.06)' : 'rgba(16,185,129,0.06)',
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={`br-${step.type}-${i}`}
                      className="absolute inset-0 rounded-xl pointer-events-none"
                      style={{ border: `1px solid ${showBottleneck ? 'rgba(251,191,36,0.2)' : 'rgba(16,185,129,0.2)'}` }}
                      initial={{ scale: 0.95, opacity: 0.7 }}
                      animate={{ scale: 1.5 + i * 0.3, opacity: 0 }}
                      transition={{ duration: 1.1, delay: i * 0.2, ease: 'easeOut' }}
                    />
                  ))}
                  <span className="text-xl relative z-10 select-none">{showBottleneck ? '⚠️' : '✅'}</span>
                  <div className="relative z-10">
                    {showBottleneck ? (
                      <>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Bottleneck Found</p>
                        <p className="text-sm font-mono text-white">Service B: <span className="text-amber-300 font-bold">420 ms</span> of 450 ms total — 93% of latency</p>
                      </>
                    ) : (
                      <>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Trace Assembled</p>
                        <p className="text-sm text-white">All spans correlated by trace ID — full flame graph available in Jaeger UI</p>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 mt-3 px-1 flex-wrap">
          {[
            { color: C.request.hex,  glow: C.request.glow,  label: 'request / trace propagation' },
            { color: C.response.hex, glow: C.response.glow, label: 'response'                    },
            { color: C.span.hex,     glow: C.span.glow,     label: 'span emission'               },
          ].map(({ color, glow, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-5 h-px rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 4px ${glow}` }} />
              <span className="text-[10px] text-slate-500">{label}</span>
            </div>
          ))}
          <span className="text-[10px] text-slate-600 ml-auto hidden sm:inline">tap any node for details</span>
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
