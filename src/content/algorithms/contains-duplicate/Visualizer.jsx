import { useMemo, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { buildContainsDuplicateSteps } from './steps'
import { useStepRunner } from '../../../hooks/useStepRunner'
import StepControls from '../../../components/ui/StepControls'

const DEFAULT_NUMS = [3, 1, 4, 1, 5]

// ── Coin geometry ─────────────────────────────────────────────────────────────
// Values are restricted to 1–9 so stacks stay visible and readable.

const CX      = 31    // SVG centre x
const COIN_RX = 26    // x-radius (coin width)
const COIN_RY = 8     // y-radius (flat perspective)
const DEPTH   = 5     // side stub below face
const COIN_H  = 12    // vertical gap between consecutive face centres
const BASE_Y  = 143   // y of bottom-most coin face
const SVG_W   = 62
const SVG_H   = 158

const COIN_COLORS = {
  idle:      { face: '#fbbf24', side: '#92400e', rim: '#b45309', shine: '#fef3c7', text: '#1c0a00' },
  checking:  { face: '#fde68a', side: '#78350f', rim: '#fbbf24', shine: '#fffbeb', text: '#1c0a00' },
  seen:      { face: '#818cf8', side: '#312e81', rim: '#6366f1', shine: '#e0e7ff', text: '#eef2ff' },
  duplicate: { face: '#f87171', side: '#7f1d1d', rim: '#ef4444', shine: '#fee2e2', text: '#fff1f2' },
}

// ── Single coin stack ─────────────────────────────────────────────────────────

function CoinStack({ value, status, idx }) {
  const colors  = COIN_COLORS[status] ?? COIN_COLORS.idle
  const count   = Math.min(Math.max(value, 1), 9)
  const coinYs  = Array.from({ length: count }, (_, i) => BASE_Y - i * COIN_H)
  const topY    = coinYs[count - 1]
  const isDup   = status === 'duplicate'
  const isCheck = status === 'checking'

  return (
    <motion.div
      className="relative flex flex-col items-center gap-1"
      animate={isDup ? { y: [0, -7, 0] } : { y: 0 }}
      transition={isDup ? { duration: 0.45, repeat: Infinity, ease: 'easeInOut' } : {}}
    >
      {/* Checking glow */}
      {isCheck && (
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: 20, left: '50%', transform: 'translateX(-50%)',
            width: 64, height: 56,
            background: 'radial-gradient(ellipse at 50% 100%, rgba(251,191,36,0.55) 0%, transparent 72%)',
            filter: 'blur(10px)',
          }}
        />
      )}

      {/* Duplicate glow */}
      {isDup && (
        <motion.div
          className="absolute pointer-events-none"
          style={{
            bottom: 20, left: '50%', transform: 'translateX(-50%)',
            width: 72, height: 64,
            background: 'radial-gradient(ellipse at 50% 100%, rgba(248,113,113,0.65) 0%, transparent 70%)',
            filter: 'blur(13px)',
          }}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 0.75, repeat: Infinity }}
        />
      )}

      <svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`}>
        {/*
          Draw in two phases so no side ever appears in front of a face:
          Phase 1 — all sides (behind every face)
          Phase 2 — all faces + details, bottom-to-top (upper = drawn later = in front)
        */}

        {/* Phase 1: sides */}
        {coinYs.map((y, i) => (
          <ellipse key={`s${i}`}
            cx={CX} cy={y + DEPTH} rx={COIN_RX} ry={COIN_RY}
            fill={colors.side}
          />
        ))}

        {/* Phase 2: faces */}
        {coinYs.map((y, i) => (
          <g key={`f${i}`}>
            <ellipse cx={CX} cy={y} rx={COIN_RX} ry={COIN_RY} fill={colors.face} />
            <ellipse cx={CX} cy={y} rx={COIN_RX} ry={COIN_RY}
              fill="none" stroke={colors.rim} strokeWidth={0.8} opacity={0.65} />
            <ellipse cx={CX - 8} cy={y - 2.5} rx={8} ry={2.5}
              fill={colors.shine} opacity={0.5} />
          </g>
        ))}

        {/* Value label on the top coin face */}
        <text
          x={CX} y={topY + 4.5}
          textAnchor="middle" fontSize="11" fontWeight="800"
          fill={colors.text}
          className="select-none pointer-events-none"
        >
          {value}
        </text>
      </svg>

      <span className="text-[10px] font-mono text-slate-600">[{idx}]</span>
    </motion.div>
  )
}

// ── Set coin chip (top-down view) ─────────────────────────────────────────────

function SetCoin({ value, isMatch }) {
  return (
    <motion.div
      initial={{ scale: 0.3, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 22 }}
      className="relative flex items-center justify-center flex-shrink-0"
      style={{ width: 38, height: 38 }}
    >
      <svg width={38} height={38} viewBox="0 0 38 38">
        {/* Side stub */}
        <ellipse cx={19} cy={22} rx={15} ry={6} fill={isMatch ? '#7f1d1d' : '#92400e'} />
        {/* Face */}
        <ellipse cx={19} cy={17} rx={15} ry={8} fill={isMatch ? '#f87171' : '#fbbf24'} />
        {/* Rim */}
        <ellipse cx={19} cy={17} rx={15} ry={8}
          fill="none" stroke={isMatch ? '#ef4444' : '#d97706'} strokeWidth={1} opacity={0.7} />
        {/* Shine */}
        <ellipse cx={13} cy={13} rx={5} ry={2.5} fill="white" opacity={0.32} />
      </svg>
      <span
        className="absolute font-bold font-mono text-xs select-none"
        style={{ color: isMatch ? '#fee2e2' : '#1c0a00', top: 9, left: '50%', transform: 'translateX(-50%)' }}
      >
        {value}
      </span>
    </motion.div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ContainsDuplicateVisualizer({ onStepChange }) {
  const [nums,      setNums]      = useState(DEFAULT_NUMS)
  const [draftNums, setDraftNums] = useState(DEFAULT_NUMS.join(', '))
  const [error,     setError]     = useState(null)

  const steps  = useMemo(() => buildContainsDuplicateSteps(nums), [nums])
  const runner = useStepRunner(steps)
  const { step, reset } = runner

  useEffect(() => { onStepChange?.(step) }, [step, onStepChange])

  function handleRun() {
    const parts  = draftNums.split(',').map((s) => s.trim()).filter(Boolean)
    const parsed = parts.map((s) => parseInt(s, 10))

    if (parts.length < 2 || parts.length > 9) {
      setError('Enter 2–9 numbers.')
      return
    }
    if (parsed.some((n) => isNaN(n) || n < 1 || n > 9)) {
      setError('Values must be integers between 1 and 9.')
      return
    }

    setError(null)
    setNums(parsed)
    setTimeout(() => reset(), 0)
  }

  function getStatus(i) {
    const { type, currentIndex, set, duplicateValue } = step
    if (type === 'duplicate' && nums[i] === duplicateValue) return 'duplicate'
    if (i === currentIndex && type === 'check')             return 'checking'
    if (set?.has(nums[i]))                                  return 'seen'
    return 'idle'
  }

  const isDone     = step.type === 'done' || step.type === 'duplicate'
  const resultTrue = step.result === true

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-semibold text-white">Contains Duplicate</h2>
          <p className="text-sm text-slate-400">
            Each pile has as many coins as its value — do any two piles match?
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-slate-400">
          <Legend color="#fbbf24" label="Unchecked"  />
          <Legend color="#fde68a" label="Checking"   />
          <Legend color="#818cf8" label="In set"     />
          <Legend color="#f87171" label="Duplicate!" />
        </div>
      </div>

      {/* Input */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Try your own values{' '}
          <span className="font-normal text-slate-600">(integers 1–9)</span>
        </p>
        <div className="flex gap-2 items-start">
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <label className="text-[11px] text-slate-500">Array (comma-separated)</label>
            <input
              value={draftNums}
              onChange={(e) => setDraftNums(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRun()}
              placeholder="e.g. 3, 1, 4, 1, 5"
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
            onClick={() => { setDraftNums('3, 1, 4, 1, 5'); setError(null) }}>
            has duplicate
          </button>{' · '}
          <button className="text-slate-400 hover:text-white underline underline-offset-2 transition-colors"
            onClick={() => { setDraftNums('1, 2, 3, 4, 5'); setError(null) }}>
            no duplicate
          </button>{' · '}
          <button className="text-slate-400 hover:text-white underline underline-offset-2 transition-colors"
            onClick={() => { setDraftNums('5, 3, 1, 2, 4, 6, 7, 3'); setError(null) }}>
            longer array
          </button>
        </p>
      </div>

      {/* Coin stacks */}
      <div className="rounded-2xl border border-white/10 bg-[#070d1f] px-4 pt-4 pb-3">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Coin piles
        </p>
        <div className="flex items-end justify-around gap-1 flex-wrap" style={{ minHeight: SVG_H + 24 }}>
          {nums.map((val, i) => (
            <CoinStack key={i} value={val} status={getStatus(i)} idx={i} />
          ))}
        </div>
      </div>

      {/* HashSet panel */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          HashSet — pile heights already seen
        </p>
        <div className="flex flex-wrap gap-3 min-h-10 items-center">
          {step.set?.size === 0 ? (
            <span className="text-xs text-slate-600 italic">empty</span>
          ) : (
            [...(step.set ?? [])].map((val) => (
              <SetCoin
                key={val}
                value={val}
                isMatch={step.type === 'duplicate' && val === step.duplicateValue}
              />
            ))
          )}
        </div>
      </div>

      {/* Result banner */}
      <AnimatePresence>
        {isDone && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`rounded-xl border px-5 py-3 flex items-center gap-3 ${
              resultTrue
                ? 'bg-rose-500/10 border-rose-500/30'
                : 'bg-emerald-500/10 border-emerald-500/30'
            }`}
          >
            <span className={`text-2xl font-black font-mono ${resultTrue ? 'text-rose-400' : 'text-emerald-400'}`}>
              {resultTrue ? 'true' : 'false'}
            </span>
            <span className="text-sm text-slate-400">
              {resultTrue ? 'Two piles have the same height.' : 'All pile heights are unique.'}
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
