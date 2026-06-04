import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTtsRunner } from '../../../hooks/useTtsRunner'
import StepControls from '../../../components/ui/StepControls'

const TOKENS = ['The', 'cat', 'sat', 'on']
// Attention weights that "cat" assigns to each token (will be revealed progressively)
const ATTN_WEIGHTS = [0.08, 0.52, 0.28, 0.12]
const FOCUSED = 1 // index of "cat"

const STEPS = [
  { showTokens: true, showQKV: false, focusedToken: -1, showScores: false, showSoftmax: false, showOutput: false, message: 'The Attention Mechanism', detail: 'Attention lets every token look at every other token and decide how relevant each one is. The output for each token is a context-aware blend of all other tokens, weighted by relevance.' },
  { showTokens: true, showQKV: false, focusedToken: FOCUSED, showScores: false, showSoftmax: false, showOutput: false, message: 'Focus on one token — "cat"', detail: 'We\'ll compute attention for the token "cat". The goal: build a new representation for "cat" that incorporates context from the surrounding tokens, weighted by how relevant they are.' },
  { showTokens: true, showQKV: true, focusedToken: FOCUSED, showScores: false, showSoftmax: false, showOutput: false, message: 'Q, K, V vectors for every token', detail: 'Three learnable linear projections transform each token embedding into a Query (Q), Key (K), and Value (V) vector. Every token gets its own Q, K, and V.' },
  { showTokens: true, showQKV: true, focusedToken: FOCUSED, showScores: true, showSoftmax: false, showOutput: false, message: '"cat" queries every Key — Q · K scores', detail: '"cat\'s" Query vector is dot-producted with the Key of every token (including itself). A high score means that token is highly relevant to understanding "cat" in this context.' },
  { showTokens: true, showQKV: true, focusedToken: FOCUSED, showScores: true, showSoftmax: true, showOutput: false, message: 'Scale by √d and apply softmax', detail: 'Raw scores are divided by √d_k to prevent extreme values that would make softmax collapse to a one-hot distribution. Softmax then converts scores into probabilities that sum to 1.' },
  { showTokens: true, showQKV: true, focusedToken: FOCUSED, showScores: true, showSoftmax: true, showOutput: true, message: 'Weighted sum of Values — new representation', detail: 'Each token\'s Value vector is multiplied by the attention weight, and all are summed together. "cat" attends most to itself (0.52) and "sat" (0.28), producing a contextualised new vector.' },
]

const TOKEN_COLORS  = ['#0ea5e9', '#8b5cf6', '#14b8a6', '#f59e0b']
const TOKEN_LABELS  = TOKENS.map((t, i) => ({ t, color: TOKEN_COLORS[i] }))

const QKV_ROW_COLORS = { Q: '#6366f1', K: '#14b8a6', V: '#f97316' }

function TokenBox({ label, color, focused, dim }) {
  return (
    <motion.div
      animate={{
        borderColor: dim ? 'rgba(255,255,255,0.08)' : color + '55',
        backgroundColor: focused ? color + '20' : dim ? 'rgba(255,255,255,0.02)' : color + '0d',
        boxShadow: focused ? `0 0 16px -4px ${color}88` : 'none',
      }}
      transition={{ duration: 0.3 }}
      className="rounded-lg border px-3 py-1.5 text-center min-w-[44px]"
    >
      <motion.p className="text-xs font-mono font-bold" animate={{ color: dim ? '#334155' : color }} transition={{ duration: 0.3 }}>
        {label}
      </motion.p>
    </motion.div>
  )
}

function QKVRow({ type, step }) {
  const show  = step.showQKV
  const color = QKV_ROW_COLORS[type]
  return (
    <motion.div animate={{ opacity: show ? 1 : 0 }} transition={{ duration: 0.3 }} className="flex items-center gap-2">
      <span className="text-[10px] font-bold font-mono w-4 text-right shrink-0" style={{ color }}>{type}</span>
      <div className="flex gap-2">
        {TOKENS.map((_, i) => (
          <motion.div key={i}
            animate={{
              borderColor: show ? color + '55' : 'rgba(255,255,255,0.06)',
              backgroundColor: show ? color + '12' : 'rgba(255,255,255,0.02)',
            }}
            transition={{ duration: 0.3, delay: show ? i * 0.06 : 0 }}
            className="rounded border w-[44px] h-6 flex items-center justify-center"
          >
            {show && (
              <div className="flex gap-0.5 px-1">
                {[...Array(4)].map((_, j) => (
                  <motion.div key={j}
                    initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                    transition={{ delay: show ? (i * 4 + j) * 0.02 : 0 }}
                    className="w-px rounded-full"
                    style={{ height: `${8 + Math.sin((i * 4 + j) * 1.7) * 6}px`, background: color + '99' }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

function ScoreBar({ weight, rawScore, label, color, showSoftmax, showScore }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-mono text-slate-500 w-7 text-right shrink-0">{label}</span>
      <div className="flex-1 h-4 rounded bg-white/[0.04] border border-white/8 overflow-hidden">
        <motion.div
          className="h-full rounded"
          style={{ background: color + '99' }}
          initial={{ width: 0 }}
          animate={{ width: showScore ? `${showSoftmax ? weight * 100 : rawScore}%` : 0 }}
          transition={{ duration: 0.4 }}
        />
      </div>
      <AnimatePresence mode="wait">
        {showScore && (
          <motion.span key={showSoftmax ? 'pct' : 'raw'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-[10px] font-mono shrink-0 w-9 text-right" style={{ color }}>
            {showSoftmax ? `${Math.round(weight * 100)}%` : `${rawScore.toFixed(0)}%`}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}

const RAW_SCORES = [18, 72, 45, 22] // arbitrary raw scores before softmax

export default function AttentionAnimation() {
  const steps  = useMemo(() => STEPS, [])
  const runner = useTtsRunner(steps, (s) => `${s.message}. ${s.detail}`)
  const { step } = runner

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 p-4 space-y-4"
        style={{ background: '#060d1a', backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.04) 1px,transparent 1px)', backgroundSize: '20px 20px' }}>

        {/* Token row */}
        {step.showTokens && (
          <div className="space-y-1.5">
            <p className="text-[9px] text-slate-600 uppercase tracking-widest font-semibold">Sequence</p>
            <div className="flex gap-2">
              {TOKEN_LABELS.map(({ t, color }, i) => (
                <TokenBox key={t} label={t} color={color} focused={step.focusedToken === i} dim={step.focusedToken >= 0 && step.focusedToken !== i && !step.showQKV} />
              ))}
            </div>
          </div>
        )}

        {/* Q K V rows */}
        <AnimatePresence>
          {step.showQKV && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-2">
              <p className="text-[9px] text-slate-600 uppercase tracking-widest font-semibold">Projections</p>
              <div className="space-y-1.5">
                {['Q', 'K', 'V'].map((type) => <QKVRow key={type} type={type} step={step} />)}
              </div>
              <p className="text-[9px] text-slate-600">Each column = one token's Q / K / V vector (4 values shown)</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Attention scores */}
        <AnimatePresence>
          {step.showScores && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-2">
              <p className="text-[9px] text-slate-600 uppercase tracking-widest font-semibold">
                {step.showSoftmax ? 'Attention weights (softmax)' : '"cat" Query · each Key score'}
              </p>
              <div className="space-y-1.5">
                {TOKENS.map((t, i) => (
                  <ScoreBar key={t} label={t} color={TOKEN_COLORS[i]}
                    rawScore={RAW_SCORES[i]} weight={ATTN_WEIGHTS[i]}
                    showSoftmax={step.showSoftmax} showScore={step.showScores} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Output */}
        <AnimatePresence>
          {step.showOutput && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-2.5">
              <p className="text-[9px] text-violet-400 uppercase tracking-widest font-semibold mb-1.5">Output for "cat"</p>
              <p className="text-xs text-slate-300">
                new_cat = <span style={{ color: TOKEN_COLORS[0] }}>0.08 × V<sub>The</sub></span> + <span style={{ color: TOKEN_COLORS[1] }}>0.52 × V<sub>cat</sub></span> + <span style={{ color: TOKEN_COLORS[2] }}>0.28 × V<sub>sat</sub></span> + <span style={{ color: TOKEN_COLORS[3] }}>0.12 × V<sub>on</sub></span>
              </p>
              <p className="text-[10px] text-slate-500 mt-1">A context-aware representation of "cat" that knows it was doing the sitting.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Step message */}
      <AnimatePresence mode="wait">
        <motion.div key={step.message}
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 space-y-1">
          <p className="text-sm font-semibold text-white">{step.message}</p>
          <p className="text-xs text-slate-400 leading-relaxed">{step.detail}</p>
        </motion.div>
      </AnimatePresence>

      <StepControls runner={runner} />
    </div>
  )
}
