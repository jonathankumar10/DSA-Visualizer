import { useMemo, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { buildTwoSumSteps } from './steps'
import { useStepRunner } from '../../../hooks/useStepRunner'
import StepControls from '../../../components/ui/StepControls'

const DEFAULT_NUMS   = [2, 7, 11, 15, 3, 6]
const DEFAULT_TARGET = 9

const STATUS_COLORS = {
  idle:       { liquid: '#4f46e5', wave: '#818cf8', cap: '#312e81', border: 'rgba(99,102,241,0.35)',  glow: null      },
  stored:     { liquid: '#2563eb', wave: '#60a5fa', cap: '#1e3a8a', border: 'rgba(59,130,246,0.4)',   glow: null      },
  active:     { liquid: '#8b5cf6', wave: '#c4b5fd', cap: '#4c1d95', border: 'rgba(139,92,246,1)',     glow: '#8b5cf6' },
  complement: { liquid: '#f97316', wave: '#fcd34d', cap: '#7c2d12', border: 'rgba(249,115,22,1)',     glow: '#f97316' },
  found:      { liquid: '#22c55e', wave: '#86efac', cap: '#14532d', border: 'rgba(34,197,94,1)',      glow: '#22c55e' },
}

const VW = 72, VH = 200
const B = { x: 6,  w: 60, top: 110, bot: 172 }
const N = { x: 27, w: 18, top: 52,  bot: 110 }
const C = { x: 25, w: 22, top: 33,  bot: 52  }

function bottlePath(forClip = false) {
  const ins  = forClip ? 2 : 0
  const bL   = B.x + ins,  bR = B.x + B.w - ins
  const nL   = N.x + ins,  nR = N.x + N.w - ins
  const bot  = B.bot
  const neckTop = forClip ? 0 : N.top

  return [
    `M ${bL + 5} ${bot}`,
    `Q ${bL} ${bot} ${bL} ${bot - 5}`,
    `L ${bL} ${B.top}`,
    `L ${nL} ${N.bot}`,
    `L ${nL} ${neckTop}`,
    `L ${nR} ${neckTop}`,
    `L ${nR} ${N.bot}`,
    `L ${bR} ${B.top}`,
    `L ${bR} ${bot - 5}`,
    `Q ${bR} ${bot} ${bR - 5} ${bot}`,
    `Q ${VW / 2} ${bot + 6} ${bL + 5} ${bot}`,
    `Z`,
  ].join(' ')
}

const VISUAL_PATH = bottlePath(false)
const CLIP_PATH   = bottlePath(true)

function Bottle({ value, maxVal, status, idx }) {
  const c    = STATUS_COLORS[status] ?? STATUS_COLORS.idle
  const fill = Math.min(value / maxVal, 1)
  const surfaceY = B.bot - fill * (B.bot - N.top)
  const clipId   = `bc-${idx}`

  return (
    <motion.div
      className="relative flex-shrink-0"
      animate={status === 'found' ? { y: [0, -6, 0] } : { y: 0 }}
      transition={status === 'found' ? { duration: 0.55, repeat: Infinity } : {}}
    >
      {c.glow && (
        <div
          className="absolute pointer-events-none"
          style={{
            inset: -12,
            background: `radial-gradient(ellipse at 50% 65%, ${c.glow}45 0%, transparent 65%)`,
            filter: 'blur(10px)',
          }}
        />
      )}

      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: 58, height: 160, display: 'block' }}>
        <defs>
          <clipPath id={clipId}>
            <path d={CLIP_PATH} />
          </clipPath>
        </defs>

        <g clipPath={`url(#${clipId})`}>
          <motion.rect
            x={0} width={VW}
            initial={{ y: B.bot, height: 0 }}
            animate={{ y: surfaceY, height: VH - surfaceY }}
            transition={{ duration: 0.9, ease: [0.34, 1.1, 0.64, 1] }}
            fill={c.liquid} opacity={0.92}
          />
          {fill > 0.02 && (
            <motion.path
              key={`w-${idx}-${Math.round(surfaceY)}`}
              fill={c.wave} opacity={0.5}
              animate={{
                d: [
                  `M 0 ${surfaceY} C 18 ${surfaceY - 6} 36 ${surfaceY + 6} ${VW} ${surfaceY} L ${VW} ${VH} L 0 ${VH} Z`,
                  `M 0 ${surfaceY} C 18 ${surfaceY + 6} 36 ${surfaceY - 6} ${VW} ${surfaceY} L ${VW} ${VH} L 0 ${VH} Z`,
                ],
              }}
              transition={{ duration: 1.8, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
            />
          )}
        </g>

        <path d={VISUAL_PATH} fill="rgba(224,231,255,0.04)" stroke={c.border} strokeWidth={1.8} />
        <line x1={B.x + 9} y1={B.top + 10} x2={B.x + 9} y2={B.bot - 12}
          stroke="rgba(255,255,255,0.18)" strokeWidth={3} strokeLinecap="round" />
        <line x1={N.x + 4} y1={N.top + 6} x2={N.x + 4} y2={N.bot - 4}
          stroke="rgba(255,255,255,0.12)" strokeWidth={2} strokeLinecap="round" />
        <rect x={C.x} y={C.top} width={C.w} height={C.bot - C.top} rx={5} fill={c.cap} />
        <rect x={C.x + 4} y={C.top + 4} width={C.w - 8} height={4} rx={2} fill="rgba(255,255,255,0.18)" />
      </svg>
    </motion.div>
  )
}

export default function TwoSumVisualizer({ onStepChange }) {
  const [nums,   setNums]   = useState(DEFAULT_NUMS)
  const [target, setTarget] = useState(DEFAULT_TARGET)
  const [draftNums,   setDraftNums]   = useState(DEFAULT_NUMS.join(', '))
  const [draftTarget, setDraftTarget] = useState(String(DEFAULT_TARGET))
  const [error, setError] = useState(null)

  const steps  = useMemo(() => buildTwoSumSteps(nums, target), [nums, target])
  const runner = useStepRunner(steps)
  const { step, reset } = runner

  useEffect(() => { onStepChange?.(step) }, [step, onStepChange])

  function handleRun() {
    const parsed = draftNums
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && Number.isInteger(n))
    const t = Number(draftTarget.trim())

    if (parsed.length < 2 || parsed.length > 10) {
      setError('Enter 2–10 integers, comma-separated.')
      return
    }
    if (!Number.isFinite(t) || !Number.isInteger(t)) {
      setError('Target must be an integer.')
      return
    }
    setError(null)
    setNums(parsed)
    setTarget(t)
    setTimeout(() => reset(), 0)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleRun()
  }

  function getStatus(i) {
    if (step.foundPair?.includes(i)) return 'found'
    if (i === step.activeIndex)      return 'active'
    if (i === step.complementIndex)  return 'complement'
    if (step.map?.[nums[i]] === i)   return 'stored'
    return 'idle'
  }

  const statuses = nums.map((_, i) => getStatus(i))
  const maxVal   = Math.max(...nums, 1)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-semibold text-white">Two Sum</h2>
          <p className="text-sm text-slate-400">
            Target: <span className="font-mono text-violet-400 font-bold">{target}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-slate-400">
          <Legend color="#8b5cf6" label="Checking"   />
          <Legend color="#f97316" label="Complement" />
          <Legend color="#3b82f6" label="In table"   />
          <Legend color="#22c55e" label="Found!"     />
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Try your own values</p>
        <div className="flex flex-wrap gap-2 items-start">
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <label className="text-[11px] text-slate-500">Array (comma-separated)</label>
            <input
              value={draftNums}
              onChange={(e) => setDraftNums(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. 2, 7, 11, 15"
              className="rounded-md bg-slate-800 border border-white/10 px-3 py-1.5 text-xs font-mono text-slate-100 outline-none focus:border-violet-500 transition-colors w-full"
            />
          </div>
          <div className="flex flex-col gap-1 w-24">
            <label className="text-[11px] text-slate-500">Target</label>
            <input
              value={draftTarget}
              onChange={(e) => setDraftTarget(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. 9"
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
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#070d1f] px-4 pt-5 pb-3">
        <div className="flex items-end justify-around gap-1 flex-wrap">
          {nums.map((val, i) => {
            const c = STATUS_COLORS[statuses[i]] ?? STATUS_COLORS.idle
            return (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <Bottle value={val} maxVal={maxVal} status={statuses[i]} idx={i} />
                <span className="text-sm font-bold font-mono" style={{ color: c.glow ?? '#64748b', transition: 'color 0.3s' }}>
                  {val}
                </span>
                <span className="text-[10px] font-mono text-slate-600">[{i}]</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Hash Map</p>
        <div className="flex flex-wrap gap-2 min-h-6">
          {Object.entries(step.map ?? {}).length === 0 ? (
            <span className="text-xs text-slate-600 italic">empty</span>
          ) : (
            Object.entries(step.map).map(([val, idx]) => (
              <motion.span
                key={val}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-md bg-indigo-500/15 px-2.5 py-1 text-xs font-mono text-indigo-300 border border-indigo-500/20"
              >
                {val} <span className="text-slate-500">→</span> idx {idx}
              </motion.span>
            ))
          )}
        </div>
      </div>

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
