import { useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { buildUrlShortenerSteps } from './steps'
import { useStepRunner } from '../../../../hooks/useStepRunner'
import StepControls from '../../../../components/ui/StepControls'

// ── Node definitions ──────────────────────────────────────────────────────────

const NODE_META = {
  client: { label: 'Client',        icon: '💻', desc: 'Browser or mobile app making the request.' },
  lb:     { label: 'Load Balancer', icon: '⚖️',  desc: 'Distributes traffic across API server instances. Handles SSL termination.' },
  api:    { label: 'API Server',    icon: '⚙️',  desc: 'Validates requests, generates Base62 codes, orchestrates reads/writes.' },
  cache:  { label: 'Redis Cache',   icon: '⚡',  desc: 'In-memory key→value store. O(1) lookup, sub-millisecond reads.' },
  db:     { label: 'Database',      icon: '🗄️',  desc: 'Persistent store for all short_code → long_url mappings.' },
}

// Vertical layout order for the main path: client → lb → api
// Then storage: cache and db side-by-side below api
const MAIN_PATH = ['client', 'lb', 'api']

// ── Vertical connector arrow ──────────────────────────────────────────────────

function VerticalArrow({ isActive, direction = 'down', stepKey, delayMs = 0 }) {
  const isDown = direction === 'down'
  return (
    <div className="relative flex flex-col items-center h-8 w-6 shrink-0">
      {/* Static line */}
      <div className={`w-px flex-1 transition-colors duration-300 ${isActive ? 'bg-violet-500' : 'bg-slate-700'}`} />

      {/* Arrow head */}
      <svg
        className={`shrink-0 ${isDown ? '' : 'rotate-180'}`}
        width="10" height="6" viewBox="0 0 10 6"
        fill={isActive ? '#7c3aed' : '#334155'}
      >
        <polygon points="0,0 10,0 5,6" />
      </svg>

      {/* Traveling particle */}
      {isActive && (
        <motion.div
          key={`${stepKey}-vert-${delayMs}`}
          className="absolute left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-violet-400 shadow-lg shadow-violet-400/70 pointer-events-none"
          style={{ top: isDown ? 0 : 'calc(100% - 10px)' }}
          animate={{ y: isDown ? [0, 28] : [0, -28] }}
          transition={{
            duration: 0.6,
            delay: delayMs / 1000,
            ease: 'easeInOut',
            repeat: Infinity,
            repeatDelay: 0.5,
          }}
        />
      )}
    </div>
  )
}

// ── Horizontal connector arrow ────────────────────────────────────────────────

function HorizArrow({ isActive, direction = 'right', stepKey }) {
  const isRight = direction === 'right'
  return (
    <div className="relative flex items-center w-10 h-6 shrink-0">
      <div className={`w-full h-px transition-colors duration-300 ${isActive ? 'bg-violet-500' : 'bg-slate-700'}`} />
      <svg
        className={`absolute ${isRight ? 'right-0' : 'left-0 rotate-180'}`}
        width="6" height="10" viewBox="0 0 6 10"
        fill={isActive ? '#7c3aed' : '#334155'}
      >
        <polygon points="0,0 0,10 6,5" />
      </svg>

      {isActive && (
        <motion.div
          key={`${stepKey}-horiz`}
          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-violet-400 shadow-lg shadow-violet-400/70 pointer-events-none"
          style={{ left: 0 }}
          animate={{ x: isRight ? [0, 34] : [34, 0] }}
          transition={{
            duration: 0.6,
            ease: 'easeInOut',
            repeat: Infinity,
            repeatDelay: 0.5,
          }}
        />
      )}
    </div>
  )
}

// ── Node card ─────────────────────────────────────────────────────────────────

function NodeCard({ id, isActive, shortCode }) {
  const meta = NODE_META[id]
  const isStorage = id === 'cache' || id === 'db'

  return (
    <motion.div
      animate={{
        borderColor: isActive ? 'rgba(139,92,246,0.65)' : 'rgba(255,255,255,0.08)',
      }}
      transition={{ duration: 0.25 }}
      className="relative flex flex-col items-center gap-1.5 rounded-2xl border bg-slate-900 px-3 py-3 select-none"
      style={{
        boxShadow: isActive ? '0 0 22px -4px rgba(139,92,246,0.55)' : 'none',
        width: isStorage ? '5.5rem' : '7.5rem',
      }}
    >
      <span className="text-xl leading-none">{meta.icon}</span>
      <span className="text-[11px] font-medium text-slate-300 text-center leading-tight">{meta.label}</span>

      {/* Short code badge (appears when code is generated) */}
      <AnimatePresence>
        {shortCode && (id === 'db' || id === 'cache') && (
          <motion.span
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 360, damping: 22 }}
            className="text-[9px] font-mono text-violet-300 bg-violet-500/15 border border-violet-500/30 rounded px-1.5 py-0.5"
          >
            {shortCode}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Tooltip */}
      <span className="text-[9px] text-slate-600 leading-tight text-center">{meta.desc}</span>

      {/* Active ring */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-2xl border-2 border-violet-400/50 pointer-events-none"
          animate={{ scale: [1, 1.05, 1], opacity: [1, 0.5, 1] }}
          transition={{ repeat: Infinity, duration: 1.4 }}
        />
      )}
    </motion.div>
  )
}

// ── Phase badge ───────────────────────────────────────────────────────────────

function PhaseBadge({ phase }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={phase}
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 6 }}
        transition={{ duration: 0.2 }}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
          phase === 'write'
            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
            : 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
        }`}
      >
        <span>{phase === 'write' ? '✏️' : '↗️'}</span>
        {phase === 'write' ? 'Write Flow — Shorten a URL' : 'Read Flow — Follow the Short URL'}
      </motion.div>
    </AnimatePresence>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function UrlShortenerDiagram({ onStepChange }) {
  const steps  = useMemo(() => buildUrlShortenerSteps(), [])
  const runner = useStepRunner(steps)
  const { step, index } = runner

  useEffect(() => { onStepChange?.(step) }, [step, onStepChange])

  const active    = step.activeNodes
  const arrow     = step.activeArrow
  const shortCode = step.shortCode

  // Helper: is an arrow active between these two nodes?
  function arrowActive(from, to) {
    return arrow?.from === from && arrow?.to === to
  }
  // Arrow between api and client spans lb too (write-response / read-redirect)
  function clientApiArrow() {
    return arrowActive('api', 'client') || arrowActive('client', 'api')
  }

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-white">URL Shortener Architecture</h2>
        <p className="text-sm text-slate-400">
          Trace the write (shorten) and read (redirect) flows through the system.
        </p>
      </div>

      {/* Phase badge */}
      <PhaseBadge phase={step.phase} />

      {/* Architecture diagram */}
      <div className="rounded-2xl border border-white/10 bg-[#070d1f] p-5 sm:p-6">
        <div className="flex flex-col items-center gap-0">

          {/* Client */}
          <NodeCard id="client" isActive={active.includes('client')} shortCode={shortCode} />

          {/* client → lb */}
          <VerticalArrow
            isActive={arrowActive('client', 'lb') || arrowActive('lb', 'client') || clientApiArrow()}
            direction={arrowActive('lb', 'client') || (arrowActive('api', 'client') && step.phase === 'read') ? 'up' : 'down'}
            stepKey={index}
          />

          {/* Load Balancer */}
          <NodeCard id="lb" isActive={active.includes('lb')} shortCode={shortCode} />

          {/* lb → api */}
          <VerticalArrow
            isActive={arrowActive('lb', 'api') || arrowActive('api', 'lb')}
            direction={arrowActive('api', 'lb') ? 'up' : 'down'}
            stepKey={index}
          />

          {/* API Server */}
          <NodeCard id="api" isActive={active.includes('api')} shortCode={shortCode} />

          {/* api → cache AND api → db (horizontal row below api) */}
          <div className="flex items-start gap-0 mt-0">

            {/* Left branch: cache */}
            <div className="flex flex-col items-center">
              <VerticalArrow
                isActive={arrowActive('api', 'cache') || arrowActive('cache', 'api')}
                direction={arrowActive('cache', 'api') ? 'up' : 'down'}
                stepKey={index}
              />
              <NodeCard id="cache" isActive={active.includes('cache')} shortCode={shortCode} />
            </div>

            {/* Spacer */}
            <div className="w-8" />

            {/* Right branch: db */}
            <div className="flex flex-col items-center">
              <VerticalArrow
                isActive={arrowActive('api', 'db') || arrowActive('db', 'api')}
                direction={arrowActive('db', 'api') ? 'up' : 'down'}
                stepKey={index}
                delayMs={80}
              />
              <NodeCard id="db" isActive={active.includes('db')} shortCode={shortCode} />
            </div>
          </div>

        </div>

        {/* Short URL reveal */}
        <AnimatePresence>
          {shortCode && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              className="mt-5 flex items-center gap-3 rounded-xl border border-violet-500/30 bg-violet-500/[0.07] px-4 py-2.5"
            >
              <span className="text-violet-400 text-lg">🎫</span>
              <div>
                <p className="text-[11px] font-semibold text-violet-400 uppercase tracking-wider">Short URL</p>
                <p className="text-sm font-mono text-white">
                  short.ly/<span className="text-violet-300 font-bold">{shortCode}</span>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Step message + detail */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step.message}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.22 }}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 space-y-1.5"
        >
          <p className="text-sm font-semibold text-white">{step.message}</p>
          <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-line">{step.detail}</p>
        </motion.div>
      </AnimatePresence>

      <StepControls runner={runner} />
    </div>
  )
}
