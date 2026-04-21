import { useMemo, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { buildMaxConsecutiveOnesSteps } from './steps'
import { useStepRunner } from '../../../hooks/useStepRunner'
import StepControls from '../../../components/ui/StepControls'

const DEFAULT_NUMS = [1, 1, 0, 1, 1, 1, 0, 1]

// ── Cell ──────────────────────────────────────────────────────────────────────
// checking-one: scale up + expand ring burst
// streak: pulsing glow border (brighter = closer to runner)
// checking-zero: brief red flash then dims

const CELL_STYLES = {
  idle:            'bg-slate-700/60  border-slate-600   text-slate-500',
  'checking-one':  'bg-blue-500      border-blue-300    text-white',
  'checking-zero': 'bg-slate-600/80  border-rose-500/60 text-rose-300',
  streak:          'bg-blue-600/60   border-blue-400    text-blue-100',
  'past-one':      'bg-blue-900/40   border-blue-800/40 text-blue-500/70',
  'past-zero':     'bg-slate-800/80  border-slate-700   text-slate-600',
}

function Cell({ value, state, runnerIndex }) {
  const isOne  = state === 'checking-one'
  const isZero = state === 'checking-zero'
  const isStreak = state === 'streak'

  return (
    <motion.div
      layout
      animate={{ scale: isOne ? 1.12 : isZero ? 0.95 : 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 24 }}
      className={`relative w-10 h-10 rounded-lg border-2 flex items-center justify-center
        text-sm font-bold select-none transition-colors duration-200
        ${CELL_STYLES[state] ?? CELL_STYLES.idle}`}
    >
      {/* Expansion burst when a 1 is checked */}
      {isOne && (
        <motion.div
          key={`burst-${runnerIndex}`}
          className="absolute inset-0 rounded-lg pointer-events-none border-2 border-blue-300/70"
          initial={{ scale: 0.85, opacity: 0.9 }}
          animate={{ scale: 2.2, opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      )}

      {/* Streak pulse glow */}
      {isStreak && (
        <motion.div
          className="absolute inset-0 rounded-lg border border-blue-400/50 pointer-events-none"
          animate={{ opacity: [0.3, 0.9, 0.3] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Zero flash */}
      {isZero && (
        <motion.div
          key={`zero-${runnerIndex}`}
          className="absolute inset-0 rounded-lg pointer-events-none bg-rose-500/40"
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        />
      )}

      {value}
    </motion.div>
  )
}

// ── Stat box ──────────────────────────────────────────────────────────────────
// "Best" box shows a ✦ NEW BEST badge when a new maximum is set.

function StatBox({ label, value, max, accent, flash }) {
  const pct    = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const base   = accent ? 'border-violet-500/30 bg-violet-500/5' : 'border-white/10 bg-white/[0.03]'
  const numCls = accent ? 'text-violet-300' : 'text-white'
  const barCls = accent ? 'bg-violet-500' : 'bg-blue-500'

  return (
    <motion.div
      animate={flash ? { scale: [1, 1.06, 1] } : { scale: 1 }}
      transition={{ duration: 0.35, type: 'spring', stiffness: 400, damping: 20 }}
      className={`rounded-xl border px-4 py-3 relative overflow-hidden ${base}`}
    >
      {/* New best flash overlay */}
      {flash && (
        <motion.div
          key={`flash-${value}`}
          className="absolute inset-0 bg-violet-400/20 pointer-events-none"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        />
      )}

      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">{label}</p>
      <p className={`text-3xl font-black font-mono mb-2 ${numCls}`}>{value}</p>
      <div className="h-1.5 bg-slate-700/80 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${barCls}`}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        />
      </div>

      {/* ✦ NEW BEST badge */}
      <AnimatePresence>
        {flash && (
          <motion.p
            key={`badge-${value}`}
            initial={{ opacity: 0, scale: 0.6, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ type: 'spring', stiffness: 520, damping: 18 }}
            className="text-[10px] font-bold text-violet-400 mt-1.5 text-center"
          >
            ✦ NEW BEST
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Cell state helper ─────────────────────────────────────────────────────────

function getCellState(cellIdx, step, nums) {
  const { type, index, count } = step
  if (type === 'init') return 'idle'
  if (type === 'done') return nums[cellIdx] === 1 ? 'past-one' : 'past-zero'
  if (cellIdx > index) return 'idle'
  if (cellIdx === index) return nums[cellIdx] === 1 ? 'checking-one' : 'checking-zero'
  if (nums[cellIdx] === 0) return 'past-zero'
  if (count > 0) {
    const streakStart = index - count + 1
    if (cellIdx >= streakStart) return 'streak'
  }
  return 'past-one'
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function MaxConsecutiveOnesVisualizer({ onStepChange }) {
  const [nums,      setNums]      = useState(DEFAULT_NUMS)
  const [draftNums, setDraftNums] = useState(DEFAULT_NUMS.join(', '))
  const [error,     setError]     = useState(null)

  const steps  = useMemo(() => buildMaxConsecutiveOnesSteps(nums), [nums])
  const runner = useStepRunner(steps)
  const { step, reset } = runner

  useEffect(() => { onStepChange?.(step) }, [step, onStepChange])

  function handleRun() {
    const parts  = draftNums.split(',').map((s) => s.trim()).filter(Boolean)
    const parsed = parts.map((s) => parseInt(s, 10))
    if (parts.length < 2 || parts.length > 12) { setError('Enter 2–12 numbers.'); return }
    if (parsed.some((n) => n !== 0 && n !== 1)) { setError('Only 0s and 1s allowed.'); return }
    setError(null)
    setNums(parsed)
    setTimeout(() => reset(), 0)
  }

  const isDone    = step.type === 'done'
  const isNewBest = step.type === 'increment' && step.newMax

  // Active index for the runner cursor
  const runnerAt  = step.index >= 0 ? step.index : null
  const isActive  = step.type !== 'init' && step.type !== 'done'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-semibold text-white">Max Consecutive Ones</h2>
          <p className="text-sm text-slate-400">
            Runner walks the tiles — counts lit ones, resets on dark zeros, remembers the best streak.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-slate-400">
          <Legend color="#3b82f6" label="Checking 1" />
          <Legend color="#60a5fa" label="Streak"     />
          <Legend color="#6366f1" label="Past 1"     />
          <Legend color="#475569" label="Zero"       />
        </div>
      </div>

      {/* Input */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Try your own values <span className="font-normal text-slate-600">(0s and 1s only)</span>
        </p>
        <div className="flex gap-2 items-start">
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <label className="text-[11px] text-slate-500">Array (comma-separated)</label>
            <input
              value={draftNums}
              onChange={(e) => setDraftNums(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRun()}
              placeholder="e.g. 1, 1, 0, 1, 1, 1"
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
          <ExBtn label="streak of 3"     onClick={() => { setDraftNums('1, 1, 0, 1, 1, 1, 0, 1'); setError(null) }} />{' · '}
          <ExBtn label="growing streaks" onClick={() => { setDraftNums('1, 0, 1, 1, 0, 0, 1, 1, 1'); setError(null) }} />{' · '}
          <ExBtn label="all ones"        onClick={() => { setDraftNums('1, 1, 1, 1, 1'); setError(null) }} />
        </p>
      </div>

      {/* Array with runner */}
      <div className="rounded-2xl border border-white/10 bg-[#070d1f] px-5 py-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Array</p>
        <div className="flex flex-wrap gap-2 justify-start">
          {nums.map((val, i) => {
            const state = getCellState(i, step, nums)
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                {/* Runner cursor — uses layoutId to animate smoothly between positions */}
                <div className="h-6 flex items-end justify-center pb-0.5">
                  <AnimatePresence>
                    {isActive && runnerAt === i && (
                      <motion.div
                        layoutId="runner-cursor"
                        className="flex flex-col items-center gap-0.5"
                        initial={{ opacity: 0, y: -6 }}
                        animate={{
                          opacity: 1, y: 0,
                          ...(state === 'checking-one' && { y: [0, -3, 0] }),
                        }}
                        exit={{ opacity: 0 }}
                        transition={{
                          layout: { type: 'spring', stiffness: 280, damping: 26 },
                          y: { duration: 0.55, repeat: state === 'checking-one' ? Infinity : 0, ease: 'easeInOut' },
                        }}
                      >
                        <div
                          className={`w-2.5 h-2.5 rounded-full shadow-lg ${
                            state === 'checking-zero'
                              ? 'bg-rose-400 shadow-rose-400/60'
                              : 'bg-white shadow-white/60'
                          }`}
                        />
                        <div style={{
                          width: 0, height: 0,
                          borderLeft: '3.5px solid transparent',
                          borderRight: '3.5px solid transparent',
                          borderTop: `4.5px solid ${state === 'checking-zero' ? '#f87171' : 'white'}`,
                        }} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <Cell value={val} state={state} runnerIndex={runner.index} />
                <span className="text-[10px] font-mono text-slate-600">[{i}]</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatBox label="Current Streak" value={step.count}    max={nums.length} />
        <StatBox label="Best"           value={step.maxCount} max={nums.length} accent flash={isNewBest} />
      </div>

      {/* Result banner */}
      <AnimatePresence>
        {isDone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1,   y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 24 }}
            className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-5 py-4 flex items-center gap-4"
          >
            <motion.span
              initial={{ scale: 0.3 }} animate={{ scale: [0.3, 1.2, 1] }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              className="text-3xl font-black font-mono text-violet-300"
            >
              {step.maxCount}
            </motion.span>
            <span className="text-sm text-slate-400">max consecutive 1s</span>
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

function ExBtn({ label, onClick }) {
  return (
    <button className="text-slate-400 hover:text-white underline underline-offset-2 transition-colors" onClick={onClick}>
      {label}
    </button>
  )
}
