import { useMemo, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { buildConcatenationSteps } from './steps'
import { useStepRunner } from '../../../hooks/useStepRunner'
import StepControls from '../../../components/ui/StepControls'

const DEFAULT_NUMS = [1, 2, 1]

// ── Track geometry — must stay in sync with w-10 + gap-2 ─────────────────────
const CELL_W        = 40   // Tailwind w-10
const CELL_GAP      = 8    // Tailwind gap-2
const STRIDE        = CELL_W + CELL_GAP
const MARKER_W      = 28
const MARKER_OFFSET = (CELL_W - MARKER_W) / 2

// ── Input (podium) cell ───────────────────────────────────────────────────────

const INPUT_STYLES = {
  idle:    'bg-slate-700/60  border-slate-600    text-slate-400',
  current: 'bg-amber-500     border-amber-300    text-white',
  past:    'bg-slate-800/60  border-slate-700/40 text-slate-500',
}

function InputCell({ value, state, pressing }) {
  return (
    <div className="relative">
      {/* Press-glow — spreads downward as stamp hits */}
      {pressing && (
        <motion.div
          key={`glow-${value}-${state}`}
          initial={{ opacity: 0.8, scaleX: 1.4, scaleY: 0.4, y: 36 }}
          animate={{ opacity: 0, scaleX: 2.2, scaleY: 0,    y: 44 }}
          transition={{ duration: 0.45 }}
          className="absolute left-1/2 -translate-x-1/2 w-10 h-3 bg-amber-400/50 rounded-full blur-sm pointer-events-none"
        />
      )}
      <motion.div
        animate={{ scale: state === 'current' ? 1.08 : 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 22 }}
        className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center
          text-sm font-bold select-none transition-colors duration-200
          ${INPUT_STYLES[state] ?? INPUT_STYLES.idle}`}
      >
        {value}
      </motion.div>
    </div>
  )
}

// ── Result cell ───────────────────────────────────────────────────────────────
// Drops in from above when first stamped — both halves animate simultaneously.

const RESULT_STYLES = {
  empty:   'bg-slate-800/60  border-slate-700/40 text-slate-600',
  stamped: 'bg-violet-500    border-violet-300    text-white',
  filled:  'bg-violet-600/50 border-violet-500    text-violet-200',
  done:    'bg-violet-700/40 border-violet-600    text-violet-300',
}

function ResultCell({ value, state, cellKey }) {
  const display = value === null ? '·' : value
  const isStamp = state === 'stamped'

  return (
    <div className="relative flex-shrink-0" style={{ width: CELL_W, height: CELL_W }}>
      {/* Impact ripple when the value lands */}
      {isStamp && (
        <motion.div
          key={`ripple-${cellKey}`}
          initial={{ opacity: 0.7, scale: 0.5 }}
          animate={{ opacity: 0, scale: 2.2 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 rounded-xl bg-violet-500/30 pointer-events-none"
        />
      )}
      <motion.div
        key={cellKey}
        initial={isStamp ? { y: -26, opacity: 0, scale: 0.5 } : false}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={isStamp
          ? { type: 'spring', stiffness: 460, damping: 22 }
          : { duration: 0.15 }
        }
        className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center
          text-sm font-bold select-none transition-colors duration-150
          ${RESULT_STYLES[state] ?? RESULT_STYLES.empty}`}
      >
        {display}
      </motion.div>
    </div>
  )
}

// ── Stamp marker — presses down on each fill ──────────────────────────────────

function StampMarker({ pos, pressing, stepKey }) {
  return (
    <motion.div
      className="absolute flex flex-col items-center pointer-events-none"
      animate={{ x: pos * STRIDE + MARKER_OFFSET }}
      transition={{ type: 'spring', stiffness: 180, damping: 22 }}
      style={{ width: MARKER_W, top: 0 }}
    >
      {/* Stamp body — bounces down when pressing */}
      <motion.div
        key={`stamp-${stepKey}`}
        animate={pressing
          ? { y: [0, 14, 0], scaleY: [1, 0.8, 1] }
          : { y: 0, scaleY: 1 }
        }
        transition={pressing
          ? { duration: 0.38, ease: 'easeInOut' }
          : { duration: 0.2 }
        }
        className="flex flex-col items-center"
      >
        {/* Handle */}
        <div className="w-3 h-2 rounded-t-sm bg-amber-500/80" />
        {/* Stamp pad */}
        <div className="w-6 h-3 rounded-sm bg-amber-400 flex items-center justify-center">
          <div className="w-4 h-1.5 rounded-sm bg-amber-600/60" />
        </div>
      </motion.div>
      {/* Arrow pointing down */}
      <svg width="10" height="7" viewBox="0 0 10 7" fill="#f59e0b" className="mt-0.5">
        <polygon points="5,7 0,0 10,0" />
      </svg>
    </motion.div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInputState(i, step) {
  if (step.type === 'init') return 'idle'
  if (step.type === 'done') return 'past'
  if (i === step.index)     return 'current'
  if (i < step.index)       return 'past'
  return 'idle'
}

function getResultState(i, step) {
  if (step.type === 'init') return 'empty'
  if (step.type === 'done') return 'done'
  if (step.result[i] === null) return 'empty'
  const n = step.result.length / 2
  if (i === step.index || i === step.index + n) return 'stamped'
  return 'filled'
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ConcatenationVisualizer({ onStepChange }) {
  const [nums,     setNums]     = useState(DEFAULT_NUMS)
  const [draftArr, setDraftArr] = useState(DEFAULT_NUMS.join(', '))
  const [error,    setError]    = useState(null)

  const steps  = useMemo(() => buildConcatenationSteps(nums), [nums])
  const runner = useStepRunner(steps)
  const { step, reset } = runner

  useEffect(() => { onStepChange?.(step) }, [step, onStepChange])

  function handleRun() {
    const parts  = draftArr.split(',').map((s) => s.trim()).filter(Boolean)
    const parsed = parts.map((s) => parseInt(s, 10))

    if (parts.length < 1 || parts.length > 6) {
      setError('Enter 1–6 numbers.')
      return
    }
    if (parsed.some((n) => isNaN(n) || n < 0 || n > 99)) {
      setError('Values must be integers 0–99.')
      return
    }

    setError(null)
    setNums(parsed)
    setTimeout(() => reset(), 0)
  }

  const n         = nums.length
  const isDone    = step.type === 'done'
  const isFilling = step.type === 'fill'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-semibold text-white">Concatenation of Array</h2>
          <p className="text-sm text-slate-400">
            The stamp presses each value into{' '}
            <span className="text-violet-400">both halves</span> at once.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-slate-400">
          <Legend color="#f59e0b" label="Current" />
          <Legend color="#8b5cf6" label="Just stamped" />
          <Legend color="#5b21b6" label="Filled" />
        </div>
      </div>

      {/* Input */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Try your own values{' '}
          <span className="font-normal text-slate-600">(integers 0–99, up to 6)</span>
        </p>
        <div className="flex gap-2 items-start flex-wrap">
          <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
            <label className="text-[11px] text-slate-500">Array (comma-separated)</label>
            <input
              value={draftArr}
              onChange={(e) => setDraftArr(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRun()}
              placeholder="e.g. 1, 2, 1"
              className="rounded-md bg-slate-800 border border-white/10 px-3 py-1.5 text-xs font-mono text-slate-100 outline-none focus:border-violet-500 transition-colors w-full"
            />
          </div>
          <div className="flex flex-col gap-1 justify-end">
            <label className="text-[11px] text-transparent select-none">Run</label>
            <button
              onClick={handleRun}
              className="rounded-md bg-violet-600 hover:bg-violet-500 active:bg-violet-700 px-4 py-1.5 text-xs font-semibold text-white transition-colors"
            >
              Run
            </button>
          </div>
        </div>
        {error && <p className="text-[11px] text-red-400">{error}</p>}
        <p className="text-[11px] text-slate-600">
          Examples —{' '}
          <button className="text-slate-400 hover:text-white underline underline-offset-2 transition-colors"
            onClick={() => { setDraftArr('1, 2, 1'); setError(null) }}>
            [1,2,1]
          </button>{' · '}
          <button className="text-slate-400 hover:text-white underline underline-offset-2 transition-colors"
            onClick={() => { setDraftArr('1, 3, 2, 1'); setError(null) }}>
            [1,3,2,1]
          </button>{' · '}
          <button className="text-slate-400 hover:text-white underline underline-offset-2 transition-colors"
            onClick={() => { setDraftArr('5, 5, 5'); setError(null) }}>
            [5,5,5]
          </button>
        </p>
      </div>

      {/* Track */}
      <div className="rounded-2xl border border-white/10 bg-[#070d1f] px-5 pt-5 pb-4 space-y-5">
        <div className="overflow-x-auto">
          <div style={{ minWidth: n * STRIDE + CELL_W }}>

            {/* ── Input (nums) ── */}
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
              nums (input)
            </p>

            {/* Stamp marker row */}
            <div className="relative mb-1" style={{ height: 44 }}>
              {isFilling && (
                <StampMarker
                  pos={step.index}
                  pressing={isFilling}
                  stepKey={runner.index}
                />
              )}
            </div>

            {/* Input cells */}
            <div className="flex" style={{ gap: CELL_GAP }}>
              {nums.map((val, i) => (
                <div key={i} className="flex flex-col items-center gap-1 flex-shrink-0">
                  <InputCell
                    value={val}
                    state={getInputState(i, step)}
                    pressing={isFilling && i === step.index}
                  />
                  <span className="text-[10px] font-mono text-slate-600">[{i}]</span>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Down arrows showing both result slots receive the stamp */}
        <div className="overflow-x-auto">
          <div style={{ minWidth: 2 * n * STRIDE + CELL_W }}>
            <div className="flex" style={{ gap: CELL_GAP }}>
              {Array.from({ length: 2 * n }, (_, i) => (
                <div
                  key={i}
                  style={{ width: CELL_W }}
                  className="flex-shrink-0 flex justify-center"
                >
                  {isFilling && (i === step.index || i === step.index + n) ? (
                    <motion.svg
                      key={`arr-${i}-${runner.index}`}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      width="14" height="16" viewBox="0 0 14 16" fill="none"
                    >
                      <path d="M7 1v10M2 8l5 6 5-6" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </motion.svg>
                  ) : (
                    <div className="h-4" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Result (ans) ── */}
        <div className="overflow-x-auto pb-1">
          <div style={{ minWidth: 2 * n * STRIDE + CELL_W }}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
              result ({2 * n} elements)
            </p>

            <div className="relative flex" style={{ gap: CELL_GAP }}>
              {step.result.map((val, i) => {
                const state   = getResultState(i, step)
                const isStamp = state === 'stamped'
                const cellKey = isStamp ? `r-${i}-${runner.index}` : `r-${i}`
                return (
                  <div key={i} className="flex flex-col items-center gap-1 flex-shrink-0">
                    <ResultCell value={val} state={state} cellKey={cellKey} />
                    <span className="text-[10px] font-mono text-slate-600">[{i}]</span>
                  </div>
                )
              })}

              {/* Divider between first and second half */}
              <div
                className="absolute top-0 h-10 w-px bg-slate-500/50"
                style={{ left: n * STRIDE - CELL_GAP / 2 }}
              />
            </div>

            {/* Half labels */}
            <div className="flex mt-3 text-[10px] text-slate-600">
              <div style={{ width: n * STRIDE - 4 }} className="text-center">
                first copy
              </div>
              <div className="w-px" />
              <div style={{ width: n * STRIDE }} className="text-center">
                second copy
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stamp status */}
      <AnimatePresence>
        {isFilling && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-3 flex items-center justify-between"
          >
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-0.5">
                Stamping
              </p>
              <p className="text-2xl font-black font-mono text-amber-300">{step.value}</p>
            </div>
            <div className="text-right text-xs font-mono text-slate-400 space-y-1">
              <p>result[<span className="text-violet-300">{step.index}</span>] = {step.value}</p>
              <p>result[<span className="text-violet-300">{step.index + n}</span>] = {step.value}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result banner */}
      <AnimatePresence>
        {isDone && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-5 py-3 flex items-center gap-3"
          >
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 shrink-0">
              Result
            </span>
            <span className="text-sm font-mono text-violet-300">
              [{step.result.join(', ')}]
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step message */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step.message}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm text-slate-300"
        >
          {step.message}
        </motion.div>
      </AnimatePresence>

      <StepControls runner={runner} />
    </div>
  )
}

function Legend({ color, label }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}
