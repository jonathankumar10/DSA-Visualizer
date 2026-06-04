import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTtsRunner } from '../../../hooks/useTtsRunner'
import StepControls from '../../../components/ui/StepControls'

const TOKENS = ['The', 'cat', 'sat', '→?']

const STEPS = [
  { tokenActive: [], embedActive: false, posActive: false, attnActive: false, attnArrows: false, ffnActive: false, outputActive: false, message: 'The Transformer Architecture', detail: 'The Transformer processes an entire token sequence at once using self-attention — no recurrence required. This parallel design is why it scales so effectively on modern GPUs.' },
  { tokenActive: [0,1,2,3], embedActive: false, posActive: false, attnActive: false, attnArrows: false, ffnActive: false, outputActive: false, message: 'Step 1 — Tokenisation', detail: 'Input text is split into tokens (words, subwords, or characters). Each token gets a unique integer ID. Here "The cat sat" becomes three tokens, and the model must predict the next one.' },
  { tokenActive: [0,1,2,3], embedActive: true, posActive: false, attnActive: false, attnArrows: false, ffnActive: false, outputActive: false, message: 'Step 2 — Token embeddings', detail: 'Each token ID is looked up in an embedding table, producing a dense vector (e.g. 512 or 768 dimensions). Similar tokens have similar vectors. These are the raw inputs to the Transformer.' },
  { tokenActive: [0,1,2,3], embedActive: true, posActive: true, attnActive: false, attnArrows: false, ffnActive: false, outputActive: false, message: 'Step 3 — Positional encoding', detail: 'Since self-attention is permutation-invariant, positional encodings are added to tell the model where each token sits in the sequence. Without this, "cat sat" and "sat cat" would look identical.' },
  { tokenActive: [0,1,2,3], embedActive: true, posActive: true, attnActive: true, attnArrows: false, ffnActive: false, outputActive: false, message: 'Step 4 — Multi-head self-attention', detail: 'The Attention block runs simultaneously for all tokens. Each token computes Query, Key, and Value vectors. Attention scores decide how much each token should "borrow" context from every other token.' },
  { tokenActive: [0,1,2,3], embedActive: true, posActive: true, attnActive: true, attnArrows: true, ffnActive: false, outputActive: false, message: 'Step 5 — Tokens attend to each other', detail: 'Every token attends to every other token in a single parallel operation. "sat" attends strongly to "cat" (its subject). This is how the model builds contextual representations.' },
  { tokenActive: [0,1,2,3], embedActive: true, posActive: true, attnActive: false, attnArrows: false, ffnActive: true, outputActive: false, message: 'Step 6 — Feed-forward network', detail: 'After attention, each token\'s representation is passed independently through a two-layer feed-forward network (with ReLU). This is where the model refines per-token features.' },
  { tokenActive: [0,1,2,3], embedActive: true, posActive: true, attnActive: false, attnArrows: false, ffnActive: false, outputActive: true, message: 'Step 7 — Predict next token', detail: 'A final linear layer projects the last token\'s representation into vocabulary-sized scores, then softmax converts them to probabilities. The token with the highest probability is predicted.' },
]

const TOKEN_COLORS = [
  { base: 'border-sky-500/40 bg-sky-500/10 text-sky-300', dim: 'border-white/10 bg-white/[0.03] text-slate-500' },
  { base: 'border-violet-500/40 bg-violet-500/10 text-violet-300', dim: 'border-white/10 bg-white/[0.03] text-slate-500' },
  { base: 'border-teal-500/40 bg-teal-500/10 text-teal-300', dim: 'border-white/10 bg-white/[0.03] text-slate-500' },
  { base: 'border-amber-500/40 bg-amber-500/10 text-amber-300', dim: 'border-white/10 bg-white/[0.03] text-slate-500' },
]

function TokenRow({ active }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {TOKENS.map((tok, i) => {
        const on = active.includes(i)
        const c  = TOKEN_COLORS[i]
        return (
          <motion.div key={tok}
            animate={{ borderColor: on ? undefined : undefined }}
            className={`rounded-lg border px-3 py-1.5 text-xs font-mono font-bold transition-all duration-300 ${on ? c.base : c.dim}`}>
            {tok}
          </motion.div>
        )
      })}
    </div>
  )
}

function Block({ label, sublabel, active, color }) {
  return (
    <motion.div
      animate={{
        borderColor: active ? color + '66' : 'rgba(255,255,255,0.08)',
        backgroundColor: active ? color + '12' : 'rgba(255,255,255,0.02)',
      }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border px-4 py-3 text-center"
    >
      <motion.p className="text-xs font-semibold" animate={{ color: active ? color : '#475569' }} transition={{ duration: 0.3 }}>
        {label}
      </motion.p>
      {sublabel && <p className="text-[10px] text-slate-600 mt-0.5">{sublabel}</p>}
    </motion.div>
  )
}

export default function TransformerAnimation() {
  const steps  = useMemo(() => STEPS, [])
  const runner = useTtsRunner(steps, (s) => `${s.message}. ${s.detail}`)
  const { step } = runner

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 p-4 space-y-3"
        style={{ background: '#060d1a', backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.04) 1px,transparent 1px)', backgroundSize: '20px 20px' }}>

        {/* Token row */}
        <div className="space-y-1">
          <p className="text-[9px] text-slate-600 text-center uppercase tracking-widest font-semibold">Tokens</p>
          <TokenRow active={step.tokenActive} />
        </div>

        {/* Arrow down */}
        <div className="flex justify-center">
          <motion.div animate={{ opacity: step.embedActive ? 1 : 0.15 }} className="w-px h-5 bg-slate-600" />
        </div>

        {/* Embedding + Positional */}
        <div className="grid grid-cols-2 gap-2">
          <Block label="Token Embeddings" sublabel="lookup table → dense vector" active={step.embedActive} color="#3b82f6" />
          <Block label="Positional Encoding" sublabel="adds order information" active={step.posActive} color="#8b5cf6" />
        </div>

        {/* Arrow down */}
        <div className="flex justify-center">
          <motion.div animate={{ opacity: (step.attnActive || step.ffnActive) ? 1 : 0.15 }} className="w-px h-5 bg-slate-600" />
        </div>

        {/* Transformer Block */}
        <div className="rounded-2xl border border-white/10 p-3 space-y-2">
          <p className="text-[9px] text-slate-600 text-center uppercase tracking-widest font-semibold">Transformer Block (×N)</p>
          <Block label="Multi-Head Self-Attention" sublabel="every token attends to every token" active={step.attnActive} color="#6366f1" />

          {/* Attention arrows */}
          <AnimatePresence>
            {step.attnArrows && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-1 py-1">
                {TOKENS.slice(0, 3).map((t, i) => (
                  <div key={t} className="flex flex-col items-center gap-0.5">
                    {TOKENS.slice(0, 3).map((_, j) => (
                      <motion.div key={j}
                        initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                        transition={{ delay: (i * 3 + j) * 0.04 }}
                        className={`h-px rounded-full ${i === j ? 'w-3 bg-indigo-400' : 'w-6 bg-indigo-400/40'}`} />
                    ))}
                  </div>
                ))}
                <p className="text-[9px] text-indigo-400 ml-2">all ↔ all</p>
              </motion.div>
            )}
          </AnimatePresence>

          <Block label="Feed-Forward Network" sublabel="per-token transformation" active={step.ffnActive} color="#14b8a6" />
        </div>

        {/* Arrow down */}
        <div className="flex justify-center">
          <motion.div animate={{ opacity: step.outputActive ? 1 : 0.15 }} className="w-px h-5 bg-slate-600" />
        </div>

        {/* Output */}
        <Block label="Output — Next Token Probabilities" sublabel={step.outputActive ? '"on" (42%)  "the" (18%)  "." (14%) …' : 'softmax over vocabulary'} active={step.outputActive} color="#f59e0b" />
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
