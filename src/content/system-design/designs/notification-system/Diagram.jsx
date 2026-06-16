import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { buildNotificationSystemSteps } from './steps'
import { useStepRunner } from '../../../../hooks/useStepRunner'
import StepControls from '../../../../components/ui/StepControls'

// ── Layout ────────────────────────────────────────────────────────────────────
// Left:         apiServer (upstream service)
// Center-left:  notifSvc (Notification Service), prefStore (Preferences)
// Center:       mq (Message Queue / Kafka)
// Center-right: pushWorker, emailWorker, smsWorker (stacked)
// Right:        apns (APNs/FCM), sendgrid (SendGrid), twilio (Twilio) — stacked

const CW = 750
const CH = 380

const NODES = [
  {
    id: 'apiServer', label: 'API Server', icon: '⚙️', dir: 'left',
    cx: 62, cy: 160, w: 100, h: 72,
    color: '#8b5cf6', glow: 'rgba(139,92,246,0.65)', lc: '#c4b5fd', strip: 'bg-violet-500',
    sub1: 'OrderSvc etc.', sub2: 'event publisher',
    desc: 'Any upstream service that needs to notify a user. Calls the Notification Service API without knowing about delivery channels.',
    note: 'Decoupling callers from delivery details means adding a new channel (e.g. Slack) requires zero changes to callers.',
  },
  {
    id: 'notifSvc', label: 'Notif Service', icon: '📣', dir: 'top',
    cx: 210, cy: 130, w: 112, h: 74,
    color: '#6366f1', glow: 'rgba(99,102,241,0.65)', lc: '#a5b4fc', strip: 'bg-indigo-500',
    sub1: 'pref check', sub2: 'fan-out logic',
    desc: 'Central orchestrator. Validates, checks preferences, selects channels, and publishes to per-channel queues.',
    note: 'The Notification Service is stateless — all state lives in the preference store and queues.',
  },
  {
    id: 'prefStore', label: 'Pref Store', icon: '⚙️', dir: 'bottom',
    cx: 210, cy: 260, w: 112, h: 70,
    color: '#7c3aed', glow: 'rgba(124,58,237,0.65)', lc: '#c4b5fd', strip: 'bg-violet-700',
    sub1: 'Redis / Dynamo', sub2: 'opt-outs + tokens',
    desc: 'Stores per-user channel preferences, opt-outs, quiet hours, and device tokens. Cached in Redis for low-latency reads on every notification.',
    note: 'Device token hygiene: process APNs feedback and FCM canonical IDs to remove stale tokens immediately.',
  },
  {
    id: 'mq', label: 'Message Queue', icon: '📨', dir: 'top',
    cx: 370, cy: 160, w: 114, h: 74,
    color: '#0ea5e9', glow: 'rgba(14,165,233,0.65)', lc: '#7dd3fc', strip: 'bg-sky-500',
    sub1: 'Kafka / SQS', sub2: 'per-channel topics',
    desc: 'Separate queues per channel: push_queue, email_queue, sms_queue. Workers scale independently per channel. At-least-once delivery with idempotency keys prevents duplicate sends.',
    note: 'Priority queues: OTP/security alerts on a high-priority queue ahead of marketing blasts.',
  },
  {
    id: 'pushWorker', label: 'Push Worker', icon: '🔧', dir: 'top',
    cx: 535, cy: 105, w: 110, h: 68,
    color: '#a855f7', glow: 'rgba(168,85,247,0.65)', lc: '#d8b4fe', strip: 'bg-purple-500',
    sub1: 'iOS + Android', sub2: 'device tokens',
    desc: 'Dequeues push notifications, looks up device tokens, and calls APNs (iOS) or FCM (Android). Scales to thousands of workers.',
    note: 'Push is cheapest and fastest — no per-message cost, sub-second delivery when the device is online.',
  },
  {
    id: 'emailWorker', label: 'Email Worker', icon: '🔧', dir: 'top',
    cx: 535, cy: 200, w: 110, h: 68,
    color: '#06b6d4', glow: 'rgba(6,182,212,0.65)', lc: '#67e8f9', strip: 'bg-cyan-500',
    sub1: 'HTML templates', sub2: 'rate limited',
    desc: 'Renders HTML email templates and calls SendGrid or AWS SES. Higher volume but more latency tolerance than push.',
    note: 'Email deliverability depends on domain reputation, SPF/DKIM records, and bounce rate management.',
  },
  {
    id: 'smsWorker', label: 'SMS Worker', icon: '🔧', dir: 'bottom',
    cx: 535, cy: 295, w: 110, h: 68,
    color: '#10b981', glow: 'rgba(16,185,129,0.65)', lc: '#6ee7b7', strip: 'bg-emerald-500',
    sub1: 'OTP + alerts', sub2: 'expensive',
    desc: 'Calls Twilio for SMS delivery. Reserved for high-priority messages — OTP codes, fraud alerts. Rate-limited to avoid carrier blacklisting.',
    note: 'SMS costs ~$0.0075/message. Marketing SMS is expensive at scale; push is preferred for casual notifications.',
  },
  {
    id: 'apns', label: 'APNs / FCM', icon: '🍎', dir: 'right',
    cx: 682, cy: 105, w: 110, h: 68,
    color: '#8b5cf6', glow: 'rgba(139,92,246,0.65)', lc: '#c4b5fd', strip: 'bg-violet-500',
    sub1: 'Apple / Google', sub2: 'device delivery',
    desc: 'Apple Push Notification service (iOS) and Firebase Cloud Messaging (Android). Handle the last-mile delivery to devices. Return delivery receipts and feedback for invalid tokens.',
    note: 'APNs feedback service returns a list of inactive tokens daily — process it to remove stale tokens from your store.',
  },
  {
    id: 'sendgrid', label: 'SendGrid', icon: '📧', dir: 'right',
    cx: 682, cy: 200, w: 110, h: 68,
    color: '#0ea5e9', glow: 'rgba(14,165,233,0.65)', lc: '#7dd3fc', strip: 'bg-sky-500',
    sub1: 'SMTP + API', sub2: 'email delivery',
    desc: 'Managed email delivery provider. Handles SMTP relay, bounce processing, unsubscribe management, and delivery tracking via webhooks.',
    note: 'AWS SES is cheaper at high volume ($0.10/1000 emails vs SendGrid\'s tiered pricing) but requires more operational work.',
  },
  {
    id: 'twilio', label: 'Twilio', icon: '📱', dir: 'right',
    cx: 682, cy: 295, w: 110, h: 68,
    color: '#10b981', glow: 'rgba(16,185,129,0.65)', lc: '#6ee7b7', strip: 'bg-emerald-500',
    sub1: 'SMS / voice', sub2: 'global carriers',
    desc: 'SMS delivery via Twilio\'s carrier network. Provides delivery receipts, international routing, and number management.',
    note: 'Carrier filtering can block SMS that look like spam — use registered sender IDs and keep message content clean.',
  },
]

const EDGES = {
  'apiServer-notifSvc':    { x1: 112, y1: 155, x2: 154, y2: 143, axis: 'd' },
  'notifSvc-prefStore':    { x1: 210, y1: 167, x2: 210, y2: 225, axis: 'v' },
  'notifSvc-mq':           { x1: 266, y1: 158, x2: 313, y2: 161, axis: 'h' },
  'mq-pushWorker':         { x1: 427, y1: 145, x2: 480, y2: 120, axis: 'd' },
  'mq-emailWorker':        { x1: 427, y1: 165, x2: 480, y2: 200, axis: 'd' },
  'mq-smsWorker':          { x1: 427, y1: 178, x2: 480, y2: 278, axis: 'd' },
  'pushWorker-apns':       { x1: 590, y1: 112, x2: 627, y2: 112, axis: 'h' },
  'emailWorker-sendgrid':  { x1: 590, y1: 202, x2: 627, y2: 202, axis: 'h' },
  'smsWorker-twilio':      { x1: 590, y1: 295, x2: 627, y2: 295, axis: 'h' },
  'apns-pushWorker':       { x1: 627, y1: 120, x2: 590, y2: 120, axis: 'h' },
  'pushWorker-notifSvc':   { x1: 480, y1: 108, x2: 266, y2: 138, axis: 'd' },
  'pushWorker-mq':         { x1: 480, y1: 120, x2: 427, y2: 152, axis: 'd' },
}

const C = {
  request:  { hex: '#8b5cf6', glow: 'rgba(139,92,246,0.85)' },
  response: { hex: '#10b981', glow: 'rgba(16,185,129,0.85)' },
  dispatch: { hex: '#0ea5e9', glow: 'rgba(14,165,233,0.85)' },
  retry:    { hex: '#f59e0b', glow: 'rgba(245,158,11,0.85)' },
}

const DIR_MAP = {
  request:  { fwd: C.request,  bwd: null },
  response: { fwd: C.response, bwd: null },
  both:     { fwd: C.request,  bwd: C.response },
  dispatch: { fwd: C.dispatch, bwd: null },
  retry:    { fwd: C.retry,    bwd: null },
}

// ── Edge connection ───────────────────────────────────────────────────────────

function EdgeConnection({ edgeId, connections, stepKey }) {
  const edge = EDGES[edgeId]
  const dir  = connections[edgeId]
  const map  = DIR_MAP[dir]

  const { x1, y1, x2, y2, axis } = edge
  const fwdC    = map?.fwd ?? null
  const bwdC    = map?.bwd ?? null
  const isActive = !!map

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

function NodeBlock({ node, isActive, wasVisited, isExpanded, onClick, popKey }) {
  const { cx, cy, w, h } = node
  return (
    <div className="absolute" style={{ left: cx - w / 2, top: cy - h / 2, width: w, height: h }}>
      <motion.button
        onClick={onClick}
        className="relative w-full h-full rounded-xl border-2 overflow-hidden flex flex-col items-center justify-center gap-0.5 px-1 cursor-pointer focus:outline-none"
        animate={{
          borderColor:     isActive ? node.color : wasVisited ? `${node.color}38` : 'rgba(255,255,255,0.08)',
          backgroundColor: isActive ? `${node.color}16` : wasVisited ? `${node.color}07` : 'rgba(10,18,36,1)',
          boxShadow:       isActive ? `0 0 28px -5px ${node.glow}` : 'none',
        }}
        transition={{ duration: 0.28 }}
      >
        <motion.div className={`absolute top-0 left-0 right-0 h-0.5 ${node.strip}`}
          animate={{ opacity: isActive ? 1 : wasVisited ? 0.35 : 0.12 }} />

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

// ── Channel badge ─────────────────────────────────────────────────────────────

function ChannelBadge({ type }) {
  const channelMap = {
    'push-dispatch':  { label: '📱 Push — APNs / FCM', bg: 'bg-purple-500/15', text: 'text-purple-300', border: 'border-purple-500/30' },
    'email-dispatch': { label: '📧 Email — SendGrid / SES', bg: 'bg-sky-500/15', text: 'text-sky-300', border: 'border-sky-500/30' },
    'sms-dispatch':   { label: '💬 SMS — Twilio', bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/30' },
  }
  const c = channelMap[type]
  if (!c) return null
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={type}
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}
      >
        {c.label}
      </motion.div>
    </AnimatePresence>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function NotificationSystemDiagram() {
  const steps  = useMemo(() => buildNotificationSystemSteps(), [])
  const runner = useStepRunner(steps)
  const { step, index } = runner

  const [expandedNode, setExpandedNode] = useState(null)

  const visitedNodes = useMemo(() => {
    const s = new Set()
    for (let i = 0; i <= index; i++) steps[i].activeNodes.forEach((id) => s.add(id))
    return s
  }, [steps, index])

  const showRetryBanner   = step.type === 'retry'
  const showRateBanner    = step.type === 'rate-limit'

  return (
    <div className="space-y-4">

      <div>
        <h2 className="text-lg font-semibold text-white">Notification System Architecture</h2>
        <p className="text-sm text-slate-400">
          Trace how a single event fans out across push, email, and SMS — with preferences, retries, and deduplication.
        </p>
      </div>

      <ChannelBadge type={step.type} />

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
                <text x={12}  y={20} style={{ fill: '#4c1d95', fontSize: 8, fontFamily: 'monospace', fontWeight: 700, opacity: 0.7 }}>UPSTREAM</text>
                <text x={156} y={20} style={{ fill: '#312e81', fontSize: 8, fontFamily: 'monospace', fontWeight: 700, opacity: 0.7 }}>NOTIF SERVICE</text>
                <text x={326} y={20} style={{ fill: '#0c4a6e', fontSize: 8, fontFamily: 'monospace', fontWeight: 700, opacity: 0.7 }}>QUEUES</text>
                <text x={468} y={20} style={{ fill: '#4a044e', fontSize: 8, fontFamily: 'monospace', fontWeight: 700, opacity: 0.7 }}>WORKERS</text>
                <text x={624} y={20} style={{ fill: '#064e3b', fontSize: 8, fontFamily: 'monospace', fontWeight: 700, opacity: 0.7 }}>PROVIDERS</text>
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
                />
              ))}
            </div>

            <AnimatePresence>
              {showRetryBanner && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                  className="relative mt-3 flex items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-500/[0.07] px-4 py-3"
                >
                  <span className="text-xl select-none">🔁</span>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Retry — Exponential Backoff</p>
                    <p className="text-sm text-white">Provider returned 5xx. Worker retries at 1s, 2s, 4s, 8s. After max retries the message enters the dead-letter queue. Idempotency key prevents duplicate sends on retry.</p>
                  </div>
                </motion.div>
              )}
              {showRateBanner && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                  className="relative mt-3 flex items-center gap-3 rounded-xl border border-violet-500/40 bg-violet-500/[0.07] px-4 py-3"
                >
                  <span className="text-xl select-none">🛡️</span>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-violet-400">Rate Limit + Dedup Active</p>
                    <p className="text-sm text-white">10,000 events collapsed into one summary notification. Redis dedup key: user_id + type + 60s TTL. Per-user rate cap prevents notification fatigue.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-5 mt-3 px-1 flex-wrap">
          {[
            { color: C.request.hex,  glow: C.request.glow,  label: 'request / trigger' },
            { color: C.response.hex, glow: C.response.glow, label: 'receipt / response' },
            { color: C.dispatch.hex, glow: C.dispatch.glow, label: 'queue / dispatch' },
            { color: C.retry.hex,    glow: C.retry.glow,    label: 'retry / backoff' },
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
