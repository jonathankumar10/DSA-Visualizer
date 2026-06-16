import { useMemo, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { buildLoggingAndMonitoringSteps } from './steps'
import { useStepRunner } from '../../../../hooks/useStepRunner'
import StepControls from '../../../../components/ui/StepControls'

// ── Layout ────────────────────────────────────────────────────────────────────
// App Server (left) → Log Aggregator (top-center) → Alerting/Dashboard (right)
//                   → Metrics Collector (bottom-center) ↗

const CW = 620
const CH = 300

const NODES = [
  {
    id: 'app', label: 'App Server', icon: '🖥️', dir: 'left',
    cx: 90, cy: 150, w: 112, h: 82,
    color: '#3b82f6', glow: 'rgba(59,130,246,0.65)', lc: '#93c5fd', strip: 'bg-blue-500',
    sub1: 'emits logs + metrics', sub2: 'stdout / /metrics',
    desc: 'Your application emits two data streams: structured JSON logs to stdout, and numeric metrics on a /metrics HTTP endpoint.',
    note: 'Always include trace_id in log lines — it is the key that links logs to distributed traces.',
  },
  {
    id: 'aggregator', label: 'Fluentd', icon: '📦', dir: 'top',
    cx: 290, cy: 80, w: 120, h: 80,
    color: '#8b5cf6', glow: 'rgba(139,92,246,0.65)', lc: '#c4b5fd', strip: 'bg-violet-500',
    sub1: 'log aggregator', sub2: 'ELK / CloudWatch',
    desc: 'Fluentd (or Filebeat, Vector) tails stdout, buffers, and ships logs to Elasticsearch or CloudWatch. Never SSH into servers to read raw logs.',
    note: 'The pod may be dead when you need its logs. Centralized log storage is non-negotiable.',
  },
  {
    id: 'metrics', label: 'Prometheus', icon: '📈', dir: 'bottom',
    cx: 290, cy: 230, w: 120, h: 80,
    color: '#f59e0b', glow: 'rgba(245,158,11,0.65)', lc: '#fcd34d', strip: 'bg-amber-500',
    sub1: 'time-series DB', sub2: 'scrapes /metrics',
    desc: 'Prometheus polls each service /metrics endpoint every 15 seconds. Stores counters, gauges, and histograms as time-series. Supports PromQL for aggregation.',
    note: 'The Four Golden Signals: Latency, Traffic, Errors, Saturation. Instrument all four.',
  },
  {
    id: 'alerting', label: 'Grafana', icon: '🚨', dir: 'right',
    cx: 530, cy: 150, w: 112, h: 82,
    color: '#f43f5e', glow: 'rgba(244,63,94,0.65)', lc: '#fda4af', strip: 'bg-rose-500',
    sub1: 'dashboards + alerts', sub2: 'PagerDuty / Slack',
    desc: 'Grafana visualizes Prometheus metrics as time-series graphs. Alertmanager fires PagerDuty or Slack when a rule threshold is crossed.',
    note: 'Alert on symptoms (high error rate), not causes (high CPU). Good alerts are actionable and rare.',
  },
]

const EDGES = {
  'app-aggregator': { x1: 146, y1: 118, x2: 230, y2: 100, axis: 'd' },
  'app-metrics':    { x1: 146, y1: 182, x2: 230, y2: 210, axis: 'd' },
  'metrics-alerting':{ x1: 350, y1: 220, x2: 474, y2: 175, axis: 'd' },
  'aggregator-alerting': { x1: 350, y1: 90, x2: 474, y2: 125, axis: 'd' },
}

const C = {
  request:  { hex: '#8b5cf6', glow: 'rgba(139,92,246,0.85)'  },
  response: { hex: '#10b981', glow: 'rgba(16,185,129,0.85)'  },
  alert:    { hex: '#f43f5e', glow: 'rgba(244,63,94,0.85)'   },
  metric:   { hex: '#f59e0b', glow: 'rgba(245,158,11,0.85)'  },
}

// direction → color
const DIR_C_MAP = {
  request:  C.request,
  response: C.response,
  alert:    C.alert,
  metric:   C.metric,
}

// ── Edge connection ───────────────────────────────────────────────────────────

function EdgeConnection({ edgeId, connections, stepKey }) {
  const edge      = EDGES[edgeId]
  const direction = connections[edgeId]
  const isActive  = !!direction
  const fwdC      = isActive ? (DIR_C_MAP[direction] ?? C.request) : null
  const bwd       = direction === 'both'
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

function NodeBlock({ node, isActive, wasVisited, isExpanded, onClick, popKey, alerting }) {
  const { cx, cy, w, h } = node
  const isAlerting = node.id === 'alerting' && alerting

  return (
    <div className="absolute" style={{ left: cx - w / 2, top: cy - h / 2, width: w, height: h }}>
      <motion.button
        onClick={onClick}
        className="relative w-full h-full rounded-xl border-2 overflow-hidden flex flex-col items-center justify-center gap-0.5 px-1 cursor-pointer focus:outline-none"
        animate={{
          borderColor:     isActive ? node.color : isAlerting ? '#f43f5e' : wasVisited ? `${node.color}38` : 'rgba(255,255,255,0.08)',
          backgroundColor: isActive ? `${node.color}16` : isAlerting ? 'rgba(244,63,94,0.07)' : wasVisited ? `${node.color}07` : 'rgba(10,18,36,1)',
          boxShadow:       isActive ? `0 0 30px -5px ${node.glow}` : isAlerting ? `0 0 24px -6px rgba(244,63,94,0.7)` : 'none',
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
          animate={isAlerting
            ? { scale: [1, 1.2, 0.9, 1.15, 1], rotate: [0, -8, 8, -4, 0] }
            : popKey != null ? { scale: [1, 1.4, 0.88, 1.06, 1] }
            : { scale: 1 }
          }
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
          {isAlerting && (
            <motion.span
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: [1, 0.4, 1], scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="absolute top-1 right-1 text-[7px] font-bold text-rose-400 bg-rose-500/15 border border-rose-400/30 rounded px-1"
            >
              FIRING
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

export default function LoggingAndMonitoringDiagram({ onStepChange }) {
  const steps  = useMemo(() => buildLoggingAndMonitoringSteps(), [])
  const runner = useStepRunner(steps)
  const { step, index } = runner

  useEffect(() => { onStepChange?.(step) }, [step, onStepChange])

  const [expandedNode, setExpandedNode] = useState(null)

  const visitedNodes = useMemo(() => {
    const s = new Set()
    for (let i = 0; i <= index; i++) steps[i].activeNodes.forEach((id) => s.add(id))
    return s
  }, [steps, index])

  const isAlertFired = step.type === 'alert-fires'
  const isFullLoop   = step.type === 'correlation'

  return (
    <div className="space-y-4">

      <div>
        <h2 className="text-lg font-semibold text-white">Logging & Monitoring — Full Observability Stack</h2>
        <p className="text-sm text-slate-400">
          From app events to structured logs, metrics scraped by Prometheus, and alerts fired to Grafana.
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
                {/* Path labels */}
                <text x={168} y={82} style={{ fill: '#8b5cf6', fontSize: 8, fontFamily: 'ui-monospace, monospace', fontWeight: 600, opacity: 0.7 }}>logs</text>
                <text x={162} y={215} style={{ fill: '#f59e0b', fontSize: 8, fontFamily: 'ui-monospace, monospace', fontWeight: 600, opacity: 0.7 }}>metrics</text>
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
                  alerting={isAlertFired && node.id === 'alerting'}
                />
              ))}
            </div>

            {/* Alert / full-loop banner */}
            <AnimatePresence mode="wait">
              {(isAlertFired || isFullLoop) && (
                <motion.div
                  key={step.type}
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                  className="relative mt-3 flex items-center gap-4 rounded-xl border px-4 py-3 overflow-hidden"
                  style={{
                    borderColor: isAlertFired ? 'rgba(244,63,94,0.4)' : 'rgba(139,92,246,0.4)',
                    background:  isAlertFired ? 'rgba(244,63,94,0.06)' : 'rgba(139,92,246,0.06)',
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={`br-${step.type}-${i}`}
                      className="absolute inset-0 rounded-xl pointer-events-none"
                      style={{ border: `1px solid ${isAlertFired ? 'rgba(244,63,94,0.2)' : 'rgba(139,92,246,0.2)'}` }}
                      initial={{ scale: 0.95, opacity: 0.7 }}
                      animate={{ scale: 1.5 + i * 0.3, opacity: 0 }}
                      transition={{ duration: 1.1, delay: i * 0.2, ease: 'easeOut' }}
                    />
                  ))}
                  <span className="text-xl relative z-10 select-none">{isAlertFired ? '🚨' : '🔁'}</span>
                  <div className="relative z-10">
                    {isAlertFired ? (
                      <>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-rose-400">Alert Fired</p>
                        <p className="text-sm font-mono text-white">p99 latency <span className="text-rose-300 font-bold">&gt; 500 ms</span> for 5 min — PagerDuty notified</p>
                      </>
                    ) : (
                      <>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-violet-400">Full Observability Loop Active</p>
                        <p className="text-sm text-white">Metrics fire the alert → traces show the service → logs reveal the root cause</p>
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
            { color: C.request.hex,  glow: C.request.glow,  label: 'log / data flow'  },
            { color: C.metric.hex,   glow: C.metric.glow,   label: 'metrics scrape'   },
            { color: C.response.hex, glow: C.response.glow, label: 'query response'   },
            { color: C.alert.hex,    glow: C.alert.glow,    label: 'alert'            },
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
