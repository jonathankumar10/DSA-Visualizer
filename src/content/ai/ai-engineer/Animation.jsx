import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTtsRunner } from '../../../hooks/useTtsRunner'
import StepControls from '../../../components/ui/StepControls'

// ── Constants ──────────────────────────────────────────────────────────────────

const REQUIREMENTS = [
  'Answers grounded in company docs',
  'Refuse off-topic requests',
  'Return JSON with citation field',
]

const EVAL_METRICS = [
  { label: 'Context Recall',   score: 0.94, color: '#6366f1' },
  { label: 'Faithfulness',     score: 0.89, color: '#8b5cf6' },
  { label: 'Answer Relevance', score: 0.91, color: '#a78bfa' },
]

const QUALITY_BARS = [0.91, 0.89, 0.93, 0.87, 0.92, 0.94, 0.90, 0.95, 0.93, 0.96]

const PROMPT_OUTPUT = '{ "answer": "...", "citation": "..." }'

// Per-stage: who is involved and what the engineer's current hat is
const STEP_META = {
  idle:     { role: 'AI Engineer',       action: 'building full-stack AI products',           people: [{ label: 'AI Eng.',  color: '#6366f1' }] },
  define:   { role: 'Product Architect', action: 'defining requirements + success criteria',  people: [{ label: 'AI Eng.',  color: '#6366f1' }, { label: 'PM', color: '#94a3b8' }] },
  prompt:   { role: 'Prompt Engineer',   action: 'versioning prompts as code',                people: [{ label: 'AI Eng.',  color: '#8b5cf6' }, { label: 'Reviewer', color: '#94a3b8' }] },
  strategy: { role: 'Systems Thinker',   action: 'choosing the knowledge strategy',           people: [{ label: 'AI Eng.',  color: '#a78bfa' }] },
  eval:     { role: 'Quality Engineer',  action: 'building + running the eval suite',         people: [{ label: 'AI Eng.',  color: '#6366f1' }, { label: 'LLM Judge', color: '#8b5cf6' }] },
  ship:     { role: 'DevOps Engineer',   action: 'shipping with full observability',           people: [{ label: 'AI Eng.',  color: '#8b5cf6' }, { label: 'Ops Team', color: '#a78bfa' }] },
  monitor:  { role: 'Analyst',           action: 'watching quality drift + iterating',         people: [{ label: 'AI Eng.',  color: '#a78bfa' }, { label: 'End Users', color: '#6366f1' }] },
}

const STEPS = [
  { stage: 'idle',     message: 'The AI Engineer Workflow',             detail: 'An AI Engineer builds reliable products on top of foundation models — not training them. The job is applying, wiring, evaluating, and shipping AI in production software.' },
  { stage: 'define',   message: 'Step 1 — Define product behaviour',    detail: 'Write down exactly what the AI feature must do, what "good" looks like, and what failure modes to avoid. These requirements become the basis for your evaluation criteria.' },
  { stage: 'prompt',   message: 'Step 2 — Design & version prompts',    detail: 'Prompts are code. They live in source control, go through code review, and are tested against an eval suite before merging. A one-word change can silently break downstream quality.' },
  { stage: 'strategy', message: 'Step 3 — Choose a knowledge strategy', detail: 'Decide how the model accesses domain knowledge: RAG for dynamic or proprietary data, fine-tuning for consistent style or format, direct context injection for small stable reference material.' },
  { stage: 'eval',     message: 'Step 4 — Build the evaluation suite',  detail: 'Curate 100–500 domain-specific (input, expected output) pairs. Use LLM-as-judge for subjective scoring. Run evals on every deployment — treat them like a CI test suite.' },
  { stage: 'ship',     message: 'Step 5 — Ship with observability',     detail: 'Log every prompt, response, token count, and latency. Add cost alerts. Stream responses for perceived speed. Set up fallbacks. Never ship LLM code without tracing and monitoring in place.' },
  { stage: 'monitor',  message: 'Step 6 — Monitor & iterate',           detail: 'Watch quality metrics continuously. Model updates, prompt changes, and shifting query patterns all degrade quality silently. The eval loop never stops — it runs forever in production.' },
]

const STAGE_ORDER = ['idle', 'define', 'prompt', 'strategy', 'eval', 'ship', 'monitor']

function stageAt(stage, target) {
  return STAGE_ORDER.indexOf(stage) >= STAGE_ORDER.indexOf(target)
}

// ── SVG person figure ──────────────────────────────────────────────────────────
// Used at two sizes: large (header avatar) and small (inline badges)

function PersonSVG({ color, size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="7" r="4" fill={color + '25'} stroke={color} strokeWidth="1.3" />
      <path d="M3 19 C3 14.5 6 11.5 10 11.5 S17 14.5 17 19" stroke={color} strokeWidth="1.3" strokeLinecap="round" fill="none" />
    </svg>
  )
}

// ── Persona header ─────────────────────────────────────────────────────────────
// Shows the engineer figure + their current hat at this step

function EngineerHeader({ stage }) {
  const meta = STEP_META[stage] || STEP_META.idle
  const primaryColor = meta.people[0].color

  return (
    <div className="flex items-center gap-3 mb-3 pb-3 border-b border-white/[0.06]">
      {/* Avatar — large person figure */}
      <motion.div
        animate={{
          borderColor:     primaryColor + '55',
          backgroundColor: primaryColor + '14',
          boxShadow:        `0 0 14px -4px ${primaryColor}55`,
        }}
        transition={{ duration: 0.4 }}
        className="w-11 h-11 rounded-full border flex items-center justify-center shrink-0"
      >
        <PersonSVG color={primaryColor} size={24} />
      </motion.div>

      {/* Title + animated role */}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold text-white tracking-wide">AI Engineer</p>
        <AnimatePresence mode="wait">
          <motion.p
            key={meta.action}
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.2 }}
            className="text-[9px] text-slate-500 truncate"
          >
            {meta.action}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Animated role badge */}
      <AnimatePresence mode="wait">
        <motion.span
          key={meta.role}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold"
          style={{
            borderColor:     primaryColor + '55',
            backgroundColor: primaryColor + '15',
            color:           primaryColor,
          }}
        >
          {meta.role}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}

// ── Person badge ───────────────────────────────────────────────────────────────
// Small circular avatar shown on the right side of active pipeline boxes

function PersonBadge({ label, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, delay }}
      className="flex flex-col items-center gap-0.5"
    >
      <div
        className="w-6 h-6 rounded-full border flex items-center justify-center"
        style={{ borderColor: color + '55', backgroundColor: color + '18' }}
      >
        <PersonSVG color={color} size={14} />
      </div>
      <span className="text-[7px] font-medium whitespace-nowrap" style={{ color: color + 'bb' }}>
        {label}
      </span>
    </motion.div>
  )
}

// ── Pipeline components ────────────────────────────────────────────────────────

function PipelineArrow({ active }) {
  return (
    <motion.div
      animate={{ opacity: active ? 1 : 0.15 }}
      transition={{ duration: 0.3 }}
      className="flex justify-center py-0.5"
    >
      <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
        <line x1="6" y1="0" x2="6" y2="10" stroke={active ? '#6366f1' : '#334155'} strokeWidth="1.5" />
        <path d="M2 8 L6 13 L10 8" stroke={active ? '#6366f1' : '#334155'} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </motion.div>
  )
}

function PipelineBox({ label, sublabel, active, color, stage, children }) {
  const people = active ? (STEP_META[stage]?.people ?? []) : []

  return (
    <motion.div
      animate={{
        borderColor:     active ? color + '66' : 'rgba(255,255,255,0.08)',
        backgroundColor: active ? color + '10' : 'rgba(255,255,255,0.02)',
        boxShadow:       active ? `0 0 20px -6px ${color}66` : 'none',
      }}
      transition={{ duration: 0.35 }}
      className="rounded-xl border px-4 py-3 space-y-1"
    >
      <div className="flex items-center gap-2">
        {/* Status dot */}
        <motion.div
          animate={{ backgroundColor: active ? color : '#1e293b' }}
          transition={{ duration: 0.3 }}
          className="w-1.5 h-1.5 rounded-full shrink-0"
        />
        {/* Label */}
        <motion.p
          className="text-xs font-semibold flex-1"
          animate={{ color: active ? color : '#475569' }}
          transition={{ duration: 0.3 }}
        >
          {label}
        </motion.p>
        {/* Person badges — slide in on the right when step becomes active */}
        <AnimatePresence>
          {people.length > 0 && (
            <div className="flex items-end gap-1.5">
              {people.map((p, i) => (
                <PersonBadge key={p.label} label={p.label} color={p.color} delay={i * 0.1} />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
      {sublabel && <p className="text-[10px] text-slate-600 pl-3.5">{sublabel}</p>}
      {children}
    </motion.div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function AIEngineerAnimation() {
  const steps  = useMemo(() => STEPS, [])
  const runner = useTtsRunner(steps, (s) => `${s.message}. ${s.detail}`)
  const { step } = runner
  const s = step.stage

  return (
    <div className="space-y-4">
      <div
        className="rounded-2xl border border-white/10 p-4"
        style={{
          background:      '#060d1a',
          backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.04) 1px,transparent 1px)',
          backgroundSize:  '20px 20px',
        }}
      >
        {/* Persona header — always visible, role animates per step */}
        <EngineerHeader stage={s} />

        <div className="space-y-1">
          {/* Step 1 — Define */}
          <PipelineBox
            label="Define Product Behaviour"
            sublabel="requirements → eval criteria"
            active={stageAt(s, 'define')}
            color="#6366f1"
            stage="define"
          >
            {stageAt(s, 'define') && (
              <div className="pl-3.5 mt-1 space-y-0.5">
                {REQUIREMENTS.map((req, i) => (
                  <motion.div
                    key={req}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.12 }}
                    className="flex items-center gap-1.5"
                  >
                    <span className="text-[9px] text-indigo-400">✓</span>
                    <span className="text-[10px] text-slate-400">{req}</span>
                  </motion.div>
                ))}
              </div>
            )}
          </PipelineBox>

          <PipelineArrow active={stageAt(s, 'prompt')} />

          {/* Step 2 — Prompt */}
          <PipelineBox
            label="Prompt Engineering & Versioning"
            sublabel="reviewed, tested, versioned in source control"
            active={stageAt(s, 'prompt')}
            color="#8b5cf6"
            stage="prompt"
          >
            {stageAt(s, 'prompt') && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="pl-3.5 mt-1 rounded-lg border border-violet-500/20 bg-violet-500/8 px-2.5 py-2"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] font-mono text-violet-400">system.prompt.txt</span>
                  <span className="text-[9px] font-mono text-violet-500/60 border border-violet-500/20 rounded px-1">v2.3</span>
                </div>
                <p className="text-[9px] font-mono text-slate-500 leading-relaxed">
                  You are a helpful assistant...<br />
                  Answer only from provided context.<br />
                  Output: {PROMPT_OUTPUT}
                </p>
              </motion.div>
            )}
          </PipelineBox>

          <PipelineArrow active={stageAt(s, 'strategy')} />

          {/* Step 3 — Knowledge Strategy */}
          <PipelineBox
            label="Knowledge Strategy"
            sublabel="RAG · fine-tuning · context injection"
            active={stageAt(s, 'strategy')}
            color="#a78bfa"
            stage="strategy"
          >
            {stageAt(s, 'strategy') && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="pl-3.5 mt-1 flex items-stretch gap-2"
              >
                {[
                  { label: 'RAG',       note: 'dynamic data',   highlight: true  },
                  { label: 'Fine-tune', note: 'style/format',   highlight: false },
                  { label: 'Inject',    note: 'small + stable', highlight: false },
                ].map(({ label, note, highlight }, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className={`flex-1 rounded-lg border px-2 py-1.5 text-center ${
                      highlight
                        ? 'border-indigo-500/50 bg-indigo-500/15'
                        : 'border-white/10 bg-white/[0.02]'
                    }`}
                  >
                    <p className={`text-[10px] font-semibold ${highlight ? 'text-indigo-300' : 'text-slate-500'}`}>
                      {label}
                    </p>
                    <p className="text-[8px] text-slate-600 mt-0.5">{note}</p>
                    {highlight && (
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 0.3 }}
                        className="mt-1 h-px bg-indigo-500/60 rounded-full"
                      />
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </PipelineBox>

          <PipelineArrow active={stageAt(s, 'eval')} />

          {/* Step 4 — Evaluation */}
          <PipelineBox
            label="Evaluation Suite"
            sublabel="LLM-as-judge · domain benchmarks · CI regression"
            active={stageAt(s, 'eval')}
            color="#6366f1"
            stage="eval"
          >
            {stageAt(s, 'eval') && (
              <div className="pl-3.5 mt-1.5 space-y-1.5">
                {EVAL_METRICS.map(({ label, score, color }, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-2"
                  >
                    <span className="text-[9px] text-slate-500 w-28 shrink-0">{label}</span>
                    <div className="flex-1 h-1 rounded-full bg-white/5">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${score * 100}%` }}
                        transition={{ delay: i * 0.1 + 0.15, duration: 0.5 }}
                      />
                    </div>
                    <span className="text-[9px] font-mono text-indigo-300 w-6 text-right">
                      {Math.round(score * 100)}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </PipelineBox>

          <PipelineArrow active={stageAt(s, 'ship')} />

          {/* Step 5 — Ship */}
          <PipelineBox
            label="Production Deployment"
            sublabel="streaming · tracing · cost alerts · fallbacks"
            active={stageAt(s, 'ship')}
            color="#8b5cf6"
            stage="ship"
          >
            {stageAt(s, 'ship') && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="pl-3.5 mt-1.5 flex flex-wrap gap-1.5"
              >
                {['Streaming', 'Tracing', 'Cost alerts', 'Fallback'].map((tag, i) => (
                  <motion.span
                    key={tag}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.08 }}
                    className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[9px] font-medium text-violet-300"
                  >
                    ✓ {tag}
                  </motion.span>
                ))}
              </motion.div>
            )}
          </PipelineBox>

          <PipelineArrow active={stageAt(s, 'monitor')} />

          {/* Step 6 — Monitor */}
          <PipelineBox
            label="Monitor & Iterate"
            sublabel="quality drift · cost tracking · continuous eval"
            active={stageAt(s, 'monitor')}
            color="#a78bfa"
            stage="monitor"
          >
            {stageAt(s, 'monitor') && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="pl-3.5 mt-1.5 flex items-end gap-0.5 h-8"
              >
                {QUALITY_BARS.map((v, i) => (
                  <motion.div
                    key={i}
                    className="flex-1 rounded-sm"
                    style={{ backgroundColor: v >= 0.92 ? '#a78bfa' : '#6366f170' }}
                    initial={{ height: 0 }}
                    animate={{ height: `${v * 100}%` }}
                    transition={{ delay: i * 0.06 }}
                  />
                ))}
                <span className="text-[8px] text-slate-600 ml-1.5 self-center whitespace-nowrap">
                  quality score
                </span>
              </motion.div>
            )}
          </PipelineBox>
        </div>
      </div>

      {/* Step message */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step.message}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 space-y-1"
        >
          <p className="text-sm font-semibold text-white">{step.message}</p>
          <p className="text-xs text-slate-400 leading-relaxed">{step.detail}</p>
        </motion.div>
      </AnimatePresence>

      <StepControls runner={runner} />
    </div>
  )
}
