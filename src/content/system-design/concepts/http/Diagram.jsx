import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { buildHttpSteps } from './steps'
import { useTtsRunner } from '../../../../hooks/useTtsRunner'
import StepControls from '../../../../components/ui/StepControls'

// ── Colors ────────────────────────────────────────────────────────────────────

const CLIENT_CLR = { hex: '#0ea5e9', glow: 'rgba(14,165,233,0.6)',  strip: 'bg-sky-500',    label: '#38bdf8' }
const SERVER_CLR = { hex: '#8b5cf6', glow: 'rgba(139,92,246,0.6)',  strip: 'bg-violet-500', label: '#c4b5fd' }

const CONN_LABEL = {
  connecting: { text: 'TCP + TLS Handshake',   color: '#f59e0b' },
  http11:     { text: 'HTTP/1.1 · keep-alive', color: '#0ea5e9' },
  http2:      { text: 'HTTP/2 · multiplexed',  color: '#8b5cf6' },
}

const STATUS_COLOR = {
  200: '#10b981', 201: '#10b981', 204: '#10b981',
  301: '#f59e0b', 302: '#f59e0b', 304: '#64748b',
  400: '#f43f5e', 401: '#f43f5e', 403: '#f43f5e', 404: '#f43f5e', 429: '#f43f5e',
  500: '#ef4444', 502: '#ef4444', 503: '#ef4444',
}

const LANE_LEN = 170

// ── Reusable node card ────────────────────────────────────────────────────────

function EndpointCard({ label, icon, sub, clr, isActive, wasVisited, isExpanded, onClick, popKey, desc, example }) {
  return (
    <div className="relative flex flex-col items-center shrink-0">
      <motion.button
        onClick={onClick}
        animate={{
          borderColor:     isActive ? clr.hex : wasVisited ? `${clr.hex}45` : 'rgba(255,255,255,0.08)',
          backgroundColor: isActive ? `${clr.hex}18` : wasVisited ? `${clr.hex}08` : 'rgb(15,23,42)',
          boxShadow:       isActive ? `0 0 32px -4px ${clr.glow}` : 'none',
        }}
        transition={{ duration: 0.28 }}
        className="relative flex flex-col items-center gap-1.5 rounded-2xl border-2 overflow-hidden px-3 py-3 w-28 cursor-pointer focus:outline-none"
      >
        <motion.div
          className={`absolute top-0 left-0 right-0 h-1 ${clr.strip}`}
          animate={{ opacity: isActive ? 1 : wasVisited ? 0.5 : 0.18 }}
          transition={{ duration: 0.3 }}
        />

        {[0, 1, 2].map((i) => (
          <motion.div
            key={`${popKey ?? 'init'}-ripple-${i}`}
            className="absolute inset-0 rounded-xl border-2 pointer-events-none"
            style={{ borderColor: clr.hex }}
            initial={{ scale: 1, opacity: popKey != null ? 0.75 : 0 }}
            animate={{ scale: 2.4 + i * 0.45, opacity: 0 }}
            transition={{ duration: 0.75, delay: i * 0.14, ease: 'easeOut' }}
          />
        ))}

        <motion.span
          key={`icon-${popKey ?? 'init'}`}
          animate={popKey != null ? { scale: [1, 1.35, 0.85, 1.1, 1] } : { scale: 1 }}
          transition={{ type: 'spring', stiffness: 430, damping: 13 }}
          className="text-2xl leading-none mt-0.5 select-none"
        >
          {icon}
        </motion.span>

        <motion.span
          animate={{ color: isActive ? clr.label : wasVisited ? '#94a3b8' : '#475569' }}
          className="text-[11px] font-semibold text-center leading-tight"
        >
          {label}
        </motion.span>
        <motion.span
          animate={{ color: isActive ? clr.hex : '#1e293b' }}
          className="text-[9px] font-mono text-center"
        >
          {sub}
        </motion.span>
        <span className="text-[8px] text-slate-700">tap for info</span>
      </motion.button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            className="absolute top-full mt-2 w-52 z-30 rounded-xl border bg-slate-900/95 backdrop-blur shadow-2xl p-3 space-y-1.5"
            style={{ borderColor: `${clr.hex}45` }}
          >
            <p className="text-[11px] font-bold" style={{ color: clr.label }}>{label}</p>
            <p className="text-[10px] text-slate-400 leading-relaxed">{desc}</p>
            <p className="text-[10px] font-mono" style={{ color: clr.hex }}>{example}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Flying message badge ──────────────────────────────────────────────────────

function FlyingMessage({ msg, trackX, stepKey, trackIndex }) {
  const isForward = msg.dir === 'forward'
  return (
    <motion.div
      key={`${stepKey}-track-${trackIndex}`}
      className="absolute flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-bold whitespace-nowrap select-none pointer-events-none"
      style={{
        left:            trackX,
        top:             0,
        transform:       'translateX(-50%)',
        color:           msg.color,
        border:          `1px solid ${msg.color}60`,
        backgroundColor: `${msg.color}15`,
        boxShadow:       `0 0 10px 2px ${msg.glow}`,
      }}
      animate={{ y: isForward ? [0, LANE_LEN - 26] : [LANE_LEN - 26, 0] }}
      transition={{
        duration:    0.9,
        ease:        'easeInOut',
        repeat:      Infinity,
        repeatDelay: 0.4,
        delay:       trackIndex * 0.25,
      }}
    >
      {msg.stream && (
        <span
          className="rounded-sm px-1 text-[7px] font-black leading-none"
          style={{ backgroundColor: `${msg.color}30`, color: msg.color }}
        >
          s{msg.stream}
        </span>
      )}
      {msg.label}
    </motion.div>
  )
}

// ── Connection lane ───────────────────────────────────────────────────────────

function ConnectionLane({ connection, messages, stepKey }) {
  const isHttp2    = connection === 'http2'
  const connMeta   = connection ? CONN_LABEL[connection] : null
  const laneW      = isHttp2 ? 130 : 90

  const trackPositions = isHttp2
    ? [22, 65, 108]
    : [laneW / 2]

  return (
    <div className="flex flex-col items-center gap-2 shrink-0">

      {/* Connection status bar */}
      <AnimatePresence>
        {connMeta && (
          <motion.div
            key={connection}
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="flex items-center gap-2 px-2.5 py-1 rounded-lg border whitespace-nowrap"
            style={{
              borderColor:     `${connMeta.color}40`,
              backgroundColor: `${connMeta.color}0a`,
            }}
          >
            <motion.div
              className="w-1.5 h-1.5 rounded-full shrink-0"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              style={{ backgroundColor: connMeta.color, boxShadow: `0 0 5px 1px ${connMeta.color}` }}
            />
            <span className="text-[9px] font-semibold" style={{ color: connMeta.color }}>
              {connMeta.text}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message tracks */}
      <div className="relative rounded-xl border border-white/[0.06] bg-black/20" style={{ width: laneW, height: LANE_LEN }}>

        {/* Rail lines for each track */}
        {messages.map((_, ti) => (
          <div
            key={ti}
            className="absolute top-0 bottom-0 w-px"
            style={{ left: trackPositions[ti], backgroundColor: `${messages[ti].color}18` }}
          />
        ))}

        {/* Idle hint */}
        {!messages.length && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[8px] text-slate-700 font-mono">idle</span>
          </div>
        )}

        {/* Flying badges */}
        <AnimatePresence mode="popLayout">
          {messages.map((msg, ti) => (
            <FlyingMessage
              key={`${stepKey}-${ti}`}
              msg={msg}
              trackX={trackPositions[ti]}
              stepKey={stepKey}
              trackIndex={ti}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── HTTP anatomy panel ────────────────────────────────────────────────────────

function HttpPanel({ panel }) {
  if (!panel) return null
  const isReq   = panel.type === 'request'
  const accent  = isReq ? '#6366f1' : (STATUS_COLOR[panel.statusCode] ?? '#10b981')
  const label   = isReq ? 'Request' : 'Response'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.25 }}
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: `${accent}35`, backgroundColor: `${accent}07` }}
    >
      <div
        className="flex items-center gap-2 px-4 py-2 border-b"
        style={{ borderColor: `${accent}25` }}
      >
        <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: accent }}>
          HTTP {label}
        </span>
        {!isReq && panel.statusCode && (
          <span
            className="ml-auto rounded-full px-2 py-0.5 text-[9px] font-black"
            style={{ backgroundColor: `${accent}25`, color: accent }}
          >
            {panel.statusCode}
          </span>
        )}
      </div>

      <div className="px-4 py-3 font-mono text-[10px] space-y-0.5">
        {/* First line (request line or status line) */}
        <p className="font-bold text-white mb-1.5">{panel.first}</p>

        {/* Headers */}
        {panel.headers.map(([k, v]) => (
          <div key={k} className="flex gap-2">
            <span style={{ color: accent }} className="shrink-0">{k}:</span>
            <span className="text-slate-400 break-all">{v}</span>
          </div>
        ))}

        {/* Body */}
        {panel.body && (
          <>
            <div className="h-px my-2" style={{ backgroundColor: `${accent}20` }} />
            <p className="text-slate-500 truncate">{panel.body}</p>
          </>
        )}
      </div>
    </motion.div>
  )
}

// ── Main diagram ──────────────────────────────────────────────────────────────

export default function HttpDiagram() {
  const steps  = useMemo(() => buildHttpSteps(), [])
  const runner = useTtsRunner(steps, (s) => `${s.message}. ${s.detail}`)
  const { step, index } = runner

  const [expandedNode, setExpandedNode] = useState(null)
  const popKey = step.messages.length ? index : null

  const clientActive = !!step.messages.find((m) => m.dir === 'forward') || step.connection === 'connecting'
  const serverActive = !!step.messages.find((m) => m.dir === 'backward') || step.connection === 'connecting'
  const anyActive    = clientActive || serverActive

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">HTTP Request-Response Cycle</h2>
        <p className="text-sm text-slate-400">
          Step through a full HTTP exchange — from TCP connection to HTTP/2 multiplexing.
        </p>
      </div>

      <div
        className="rounded-2xl border border-white/10 p-4 sm:p-5 space-y-4"
        style={{
          background:      '#070d1f',
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.065) 1px, transparent 1px)',
          backgroundSize:  '22px 22px',
        }}
      >
        {/* Client ↕ lane ↕ Server */}
        <div className="flex flex-col items-center gap-3">
          <EndpointCard
            label="Client"
            icon="🌐"
            sub="browser · app"
            clr={CLIENT_CLR}
            isActive={clientActive}
            wasVisited={anyActive && !clientActive}
            isExpanded={expandedNode === 'client'}
            onClick={() => setExpandedNode((p) => p === 'client' ? null : 'client')}
            popKey={popKey}
            desc="The initiator of every HTTP exchange. Sends a request and waits for a response. Can be a browser, mobile app, CLI tool, or another service."
            example="curl, fetch(), axios"
          />

          <ConnectionLane
            connection={step.connection}
            messages={step.messages}
            stepKey={index}
          />

          <EndpointCard
            label="Server"
            icon="🖥️"
            sub="nginx · express · etc."
            clr={SERVER_CLR}
            isActive={serverActive}
            wasVisited={anyActive && !serverActive}
            isExpanded={expandedNode === 'server'}
            onClick={() => setExpandedNode((p) => p === 'server' ? null : 'server')}
            popKey={popKey}
            desc="Listens on a port, parses the request, executes application logic, and writes a response. Can serve multiple clients simultaneously through threading or async I/O."
            example=":443 (HTTPS)"
          />
        </div>

        {/* HTTP anatomy panel */}
        <AnimatePresence mode="wait">
          {step.panel && <HttpPanel key={step.type} panel={step.panel} />}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 px-1 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-8 h-px rounded-full bg-indigo-500" style={{ boxShadow: '0 0 5px rgba(99,102,241,0.8)' }} />
          <span className="text-[10px] text-slate-500">Request (client → server)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-px rounded-full bg-emerald-500" style={{ boxShadow: '0 0 5px rgba(16,185,129,0.8)' }} />
          <span className="text-[10px] text-slate-500">Response (server → client)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-sm px-1.5 py-0.5 text-[8px] font-black bg-violet-500/20 text-violet-400 border border-violet-500/30">s1</span>
          <span className="text-[10px] text-slate-500">HTTP/2 stream ID</span>
        </div>
        <span className="text-[10px] text-slate-600 ml-auto hidden sm:inline">tap either node for details</span>
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
