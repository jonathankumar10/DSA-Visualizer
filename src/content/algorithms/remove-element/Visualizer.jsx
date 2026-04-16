import { useMemo, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { buildRemoveElementSteps } from './steps'
import { useStepRunner } from '../../../hooks/useStepRunner'
import StepControls from '../../../components/ui/StepControls'

const DEFAULT_NUMS = [3, 2, 2, 3]
const DEFAULT_VAL  = 3

// ─── Track geometry — must stay in sync with w-10 + gap-2 ────────────────────
const CELL_W        = 40   // Tailwind w-10
const CELL_GAP      = 8    // Tailwind gap-2
const STRIDE        = CELL_W + CELL_GAP   // 48 px per cell
const MARKER_W      = 20
const MARKER_OFFSET = (CELL_W - MARKER_W) / 2   // centres marker over its cell

// ─── Cell state ───────────────────────────────────────────────────────────────
// step.k = write pointer AFTER this step; cells [0, k-1] = confirmed result.

function getCellState(j, step) {
  const { type, i, k } = step
  if (type === 'init') return step.nums[j] === step.val ? 'target' : 'idle'
  if (type === 'done') return j < k ? 'result' : 'consumed'
  if (j > i)   return 'idle'
  if (j === i) return type === 'skip' ? 'checking-skip' : 'checking-keep'
  if (j < k)   return 'result'
  return 'consumed'
}

const CELL_CLS = {
  idle:            'bg-slate-700/60   border-slate-600    text-slate-400',
  target:          'bg-rose-500/15    border-rose-500/50  text-rose-300',
  'checking-keep': 'bg-blue-500       border-blue-300     text-white',
  'checking-skip': 'bg-rose-500/80    border-rose-400     text-white',
  result:          'bg-emerald-600/50 border-emerald-500  text-emerald-200',
  consumed:        'bg-slate-800/60   border-slate-700/40 text-slate-600',
}

// ─── TrackCell ────────────────────────────────────────────────────────────────
// isLeaping: cell at i on a 'skip' step → bounce upward and glow rose
// isLanding: cell at k-1 on a 'keep' step → drop in from above, emerald impact

function TrackCell({ value, state, isLeaping, isLanding }) {
  return (
    <div className="relative flex-shrink-0" style={{ width: CELL_W, height: CELL_W }}>
      {/* Leap glow — expands and fades as the runner clears the tile */}
      {isLeaping && (
        <motion.div
          initial={{ opacity: 0.7, scale: 1 }}
          animate={{ opacity: 0, scale: 2.2 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 rounded-xl bg-rose-500/30 pointer-events-none"
        />
      )}

      {/* Land impact shadow — spreads under the tile as it touches down */}
      {isLanding && (
        <motion.div
          initial={{ opacity: 0.9, scaleX: 2.8, scaleY: 0.5 }}
          animate={{ opacity: 0, scaleX: 1, scaleY: 0 }}
          transition={{ duration: 0.55, delay: 0.05 }}
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-2 bg-emerald-400/45 rounded-full blur-sm pointer-events-none"
        />
      )}

      {/* The tile itself */}
      <motion.div
        initial={
          isLanding ? { y: -24, scale: 0.45, opacity: 0.4 } :
          isLeaping ? { y: 0, scale: 1 } :
          false
        }
        animate={
          isLeaping ? { y: [0, -20, 0], scale: [1, 0.78, 1] } :
          isLanding ? { y: 0, scale: 1, opacity: 1 } :
          { y: 0, scale: 1 }
        }
        transition={
          isLeaping ? { duration: 0.46, ease: 'easeInOut' } :
          isLanding ? { type: 'spring', stiffness: 430, damping: 22 } :
          { type: 'spring', stiffness: 340, damping: 28 }
        }
        className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center
          text-sm font-bold select-none transition-colors duration-150
          ${CELL_CLS[state] ?? CELL_CLS.idle}`}
      >
        {value}
      </motion.div>
    </div>
  )
}

// ─── Runner marker ────────────────────────────────────────────────────────────

function RunnerMarker({ label, color, pos, topOffset }) {
  return (
    <motion.div
      className="absolute flex flex-col items-center gap-px pointer-events-none"
      animate={{ x: pos * STRIDE + MARKER_OFFSET }}
      transition={{ type: 'spring', stiffness: 170, damping: 20 }}
      style={{ width: MARKER_W, top: topOffset }}
    >
      <span className="text-[9px] font-bold leading-none" style={{ color }}>
        {label}
      </span>
      {/* downward triangle */}
      <svg width="10" height="7" viewBox="0 0 10 7" fill={color}>
        <polygon points="5,7 0,0 10,0" />
      </svg>
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function RemoveElementVisualizer({ onStepChange }) {
  const [nums,      setNums]      = useState(DEFAULT_NUMS)
  const [val,       setVal]       = useState(DEFAULT_VAL)
  const [draftNums, setDraftNums] = useState(DEFAULT_NUMS.join(', '))
  const [draftVal,  setDraftVal]  = useState(String(DEFAULT_VAL))
  const [error,     setError]     = useState(null)

  const steps  = useMemo(() => buildRemoveElementSteps(nums, val), [nums, val])
  const runner = useStepRunner(steps)
  const { step, reset } = runner

  useEffect(() => { onStepChange?.(step) }, [step, onStepChange])

  function handleRun() {
    const parts  = draftNums.split(',').map((s) => s.trim()).filter(Boolean)
    const parsed = parts.map((s) => parseInt(s, 10))
    const v      = parseInt(draftVal.trim(), 10)

    if (parts.length < 2 || parts.length > 10) { setError('Enter 2–10 numbers.'); return }
    if (parsed.some((n) => isNaN(n) || n < 0 || n > 9)) { setError('Values must be integers 0–9.'); return }
    if (isNaN(v) || v < 0 || v > 9) { setError('val must be 0–9.'); return }

    setError(null)
    setNums(parsed)
    setVal(v)
    setTimeout(() => reset(), 0)
  }

  // Show runners only while actively scanning (not on init or done)
  const showRunners = step.i >= 0

  const isDone = step.type === 'done'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-semibold text-white">Remove Element</h2>
          <p className="text-sm text-slate-400">
            Reader <span className="text-amber-400 font-mono">i</span> sprints ahead —
            leaps over <span className="text-rose-400">val</span> tiles, hands the rest
            to writer <span className="text-violet-400 font-mono">k</span>.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-slate-400">
          <Legend color="#fca5a5" label={`val = ${step.val}`}  />
          <Legend color="#3b82f6" label="Handing off"          />
          <Legend color="#10b981" label="Placed (result)"      />
          <Legend color="#475569" label="Consumed"             />
        </div>
      </div>

      {/* Input */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Try your own values{' '}
          <span className="font-normal text-slate-600">(integers 0–9)</span>
        </p>
        <div className="flex gap-2 items-start flex-wrap">
          <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
            <label className="text-[11px] text-slate-500">Array (comma-separated)</label>
            <input
              value={draftNums}
              onChange={(e) => setDraftNums(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRun()}
              placeholder="e.g. 3, 2, 2, 3"
              className="rounded-md bg-slate-800 border border-white/10 px-3 py-1.5 text-xs font-mono text-slate-100 outline-none focus:border-violet-500 transition-colors w-full"
            />
          </div>
          <div className="flex flex-col gap-1 w-16">
            <label className="text-[11px] text-slate-500">val</label>
            <input
              value={draftVal}
              onChange={(e) => setDraftVal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRun()}
              placeholder="3"
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
            onClick={() => { setDraftNums('3, 2, 2, 3'); setDraftVal('3'); setError(null) }}>
            [3,2,2,3] val=3
          </button>{' · '}
          <button className="text-slate-400 hover:text-white underline underline-offset-2 transition-colors"
            onClick={() => { setDraftNums('0, 1, 2, 2, 3, 0, 4, 2'); setDraftVal('2'); setError(null) }}>
            [0,1,2,2,3,0,4,2] val=2
          </button>{' · '}
          <button className="text-slate-400 hover:text-white underline underline-offset-2 transition-colors"
            onClick={() => { setDraftNums('4, 5'); setDraftVal('4'); setError(null) }}>
            [4,5] val=4
          </button>
        </p>
      </div>

      {/* Track */}
      <div className="rounded-2xl border border-white/10 bg-[#070d1f] px-5 pt-5 pb-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Track
          </p>
          {showRunners && (
            <div className="flex gap-4 text-[11px] font-mono">
              <span className="text-amber-400">i = {step.i}</span>
              <span className="text-violet-400">k = {step.k}</span>
            </div>
          )}
        </div>

        {/* Scrollable so long arrays don't break layout */}
        <div className="overflow-x-auto pb-1">
          <div style={{ minWidth: nums.length * STRIDE + CELL_W }}>

            {/* Runner markers — two rows so they don't collide at same position */}
            <div className="relative mb-1" style={{ height: 40 }}>
              {showRunners && (
                <>
                  <RunnerMarker label="i" color="#f59e0b" pos={step.i} topOffset={0}  />
                  <RunnerMarker label="k" color="#8b5cf6" pos={step.k} topOffset={20} />
                </>
              )}
            </div>

            {/* Tiles on the track */}
            <div className="flex" style={{ gap: CELL_GAP }}>
              {step.nums.map((v, j) => {
                const state     = getCellState(j, step)
                const isLeaping = step.type === 'skip' && j === step.i
                const isLanding = step.type === 'keep' && j === step.k - 1
                // Changing key forces Framer Motion to replay initial→animate
                const cellKey   = isLeaping ? `${j}-lp-${runner.index}`
                                : isLanding ? `${j}-ld-${runner.index}`
                                : j
                return (
                  <TrackCell
                    key={cellKey}
                    value={v}
                    state={state}
                    isLeaping={isLeaping}
                    isLanding={isLanding}
                  />
                )
              })}
            </div>

            {/* Index labels */}
            <div className="flex mt-2" style={{ gap: CELL_GAP }}>
              {step.nums.map((_, j) => (
                <div
                  key={j}
                  style={{ width: CELL_W }}
                  className="text-center text-[10px] font-mono text-slate-600"
                >
                  [{j}]
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* k counter */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-0.5">
            Writer k
          </p>
          <p className="text-2xl font-black font-mono text-violet-300">{step.k}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-slate-500 mb-0.5">Result region</p>
          <p className="text-xs font-mono text-slate-400">
            {step.k === 0 ? 'empty' : `nums[0..${step.k - 1}]`}
          </p>
        </div>
      </div>

      {/* Result banner */}
      <AnimatePresence>
        {isDone && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 flex items-center gap-3"
          >
            <span className="text-2xl font-black font-mono text-emerald-300">
              {step.k}
            </span>
            <span className="text-sm text-slate-400">
              element{step.k === 1 ? '' : 's'} remaining — first {step.k} of the array are the answer
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
