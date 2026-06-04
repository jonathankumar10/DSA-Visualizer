import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import AlgoCard from '../components/ui/AlgoCard'
import { ALGORITHMS } from '../constants/algorithmRegistry'
import { PATTERNS, PATTERN_COLORS } from '../constants/patternsRegistry'
import { OOD_PATTERNS, OOD_QUESTIONS, OOD_COLORS } from '../constants/oodRegistry'
import { AI_ITEMS, AI_COLORS } from '../constants/aiRegistry'

// ── Animation variants ────────────────────────────────────────────────────────

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
})

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
}
const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } },
}

// ── Feature card data ─────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a7 7 0 0 1 5.8 10.9L15 17H9l-2.8-4.1A7 7 0 0 1 12 2z"/>
        <path d="M9 17v1a3 3 0 0 0 6 0v-1"/>
        <line x1="9" y1="21" x2="15" y2="21"/>
      </svg>
    ),
    title: 'Intuition-first',
    body: 'Every concept is mapped to a real-world analogy — so the "why" clicks before you ever see the code.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="5 3 19 12 5 21 5 3"/>
        <line x1="19" y1="3" x2="19" y2="21"/>
      </svg>
    ),
    title: 'Step-by-step',
    body: 'Play, pause, or step through every execution frame at your own pace. The diagram updates live with each step.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>
      </svg>
    ),
    title: 'Interview-ready',
    body: 'Every topic is framed around what interviewers actually ask — with the angles, analogies, and trade-offs that matter.',
  },
]

// ── Stat item ─────────────────────────────────────────────────────────────────

function Stat({ value, label }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-1 px-4 py-5 rounded-2xl border border-white/8 bg-white/[0.03]">
      <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">{value}</span>
      <span className="text-xs text-slate-500 uppercase tracking-wider text-center whitespace-nowrap">{label}</span>
    </div>
  )
}

const ArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
)

// ── Component ─────────────────────────────────────────────────────────────────

export default function Home() {
  const preview   = ALGORITHMS.slice(0, 3)
  const aiPreview = AI_ITEMS.slice(0, 6)

  return (
    <div className="space-y-20">

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative pt-12 pb-4 text-center overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            backgroundImage: 'radial-gradient(rgba(59,130,246,0.12) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div
          className="pointer-events-none absolute left-1/2 top-1/3 -z-10 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)', filter: 'blur(40px)' }}
        />

        <motion.div {...fadeUp(0)} className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm text-blue-300 mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
          DSA · System Design · OOD · AI
        </motion.div>

        <motion.h1 {...fadeUp(0.08)} className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight mb-5">
          Master the full{' '}
          <span className="bg-gradient-to-r from-white via-blue-300 to-blue-500 bg-clip-text text-transparent">
            SWE interview stack
          </span>
        </motion.h1>

        <motion.p {...fadeUp(0.16)} className="mx-auto max-w-xl text-lg text-slate-400 leading-relaxed mb-8">
          DevLens turns every software engineering concept — from algorithms to AI — into an interactive visual experience.
          Build the intuition interviewers are actually testing.
        </motion.p>

        <motion.div {...fadeUp(0.22)} className="flex items-center justify-center gap-3 flex-wrap">
          <Link to="/algorithms"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors shadow-lg shadow-blue-500/20">
            Algorithms <ArrowIcon />
          </Link>
          <Link to="/patterns"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white transition-colors">
            Patterns <ArrowIcon />
          </Link>
          <Link to="/system-design"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white transition-colors">
            System Design <ArrowIcon />
          </Link>
          <Link to="/ood"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white transition-colors">
            OOD <ArrowIcon />
          </Link>
          <Link to="/ai"
            className="inline-flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 px-5 py-2.5 text-sm font-medium text-violet-300 hover:text-violet-200 transition-colors">
            AI <ArrowIcon />
          </Link>
        </motion.div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────────────────── */}
      <motion.section
        variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 max-w-2xl mx-auto"
      >
        <motion.div variants={staggerItem}><Stat value={ALGORITHMS.length} label="Visualizers" /></motion.div>
        <motion.div variants={staggerItem}><Stat value={OOD_PATTERNS.length + OOD_QUESTIONS.length} label="OOD Topics" /></motion.div>
        <motion.div variants={staggerItem}><Stat value={AI_ITEMS.length} label="AI Topics" /></motion.div>
        <motion.div variants={staggerItem}><Stat value={PATTERNS.length} label="Patterns" /></motion.div>
      </motion.section>

      {/* ── Features ─────────────────────────────────────────────────────────── */}
      <section>
        <motion.h2
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="mb-8 text-center text-sm font-semibold uppercase tracking-widest text-slate-500"
        >
          Why DevLens
        </motion.h2>
        <motion.div
          variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="grid gap-5 sm:grid-cols-3"
        >
          {FEATURES.map((f) => (
            <motion.div
              key={f.title}
              variants={staggerItem}
              className="glow-card rounded-2xl border border-white/8 bg-white/[0.03] p-6 space-y-3"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-400">
                {f.icon}
              </div>
              <h3 className="font-semibold text-white">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── AI preview ───────────────────────────────────────────────────────── */}
      <section>
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">AI</h2>
            <p className="mt-1 text-sm text-slate-500">Neural networks, LLMs, transformers, and modern AI workflows</p>
          </div>
          <Link to="/ai" className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors">
            View all {AI_ITEMS.length} <ArrowIcon />
          </Link>
        </div>

        <motion.div
          variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="grid gap-3 grid-cols-2 sm:grid-cols-3"
        >
          {aiPreview.map((item) => {
            const c = AI_COLORS[item.color]
            return (
              <motion.div key={item.id} variants={staggerItem}>
                <Link
                  to={`/ai/${item.id}`}
                  className="group flex flex-col rounded-xl border border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] transition-all overflow-hidden"
                >
                  <div className={`h-[3px] w-full ${c.dot}`} />
                  <div className="p-3 sm:p-4 space-y-1">
                    <p className="text-sm font-bold text-white group-hover:text-white">{item.title}</p>
                    <p className={`text-[11px] font-medium ${c.text} leading-tight`}>{item.tagline}</p>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>
      </section>

      {/* ── OOD preview ──────────────────────────────────────────────────────── */}
      <section>
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">OOD</h2>
            <p className="mt-1 text-sm text-slate-500">{OOD_PATTERNS.length} patterns · {OOD_QUESTIONS.length} interview questions</p>
          </div>
          <Link to="/ood" className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors">
            View all <ArrowIcon />
          </Link>
        </div>

        <motion.div
          variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
        >
          {OOD_PATTERNS.slice(0, 8).map((p) => {
            const c = OOD_COLORS[p.color]
            return (
              <motion.div key={p.id} variants={staggerItem}>
                <Link
                  to={`/ood/${p.id}`}
                  className="group flex flex-col rounded-xl border border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] transition-all overflow-hidden"
                >
                  <div className={`h-[3px] w-full ${c.dot}`} />
                  <div className="p-3 sm:p-4 space-y-1">
                    <p className="text-sm font-bold text-white group-hover:text-white">{p.title}</p>
                    <p className={`text-[11px] font-medium ${c.text} leading-tight`}>{p.tagline}</p>
                    <p className="text-[11px] text-slate-600 pt-0.5 capitalize">{p.category}</p>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>
      </section>

      {/* ── Patterns preview ──────────────────────────────────────────────────── */}
      <section>
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Patterns</h2>
            <p className="mt-1 text-sm text-slate-500">The building blocks behind every problem</p>
          </div>
          <Link to="/patterns" className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors">
            View all {PATTERNS.length} <ArrowIcon />
          </Link>
        </div>

        <motion.div
          variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
        >
          {PATTERNS.map((p) => {
            const c = PATTERN_COLORS[p.color]
            return (
              <motion.div key={p.id} variants={staggerItem}>
                <Link
                  to={`/patterns/${p.id}`}
                  className="group flex flex-col rounded-xl border border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] transition-all overflow-hidden"
                >
                  <div className={`h-[3px] w-full ${c.dot}`} />
                  <div className="p-3 sm:p-4 space-y-1">
                    <p className="text-sm font-bold text-white group-hover:text-white">{p.title}</p>
                    <p className={`text-[11px] font-medium ${c.text} leading-tight`}>{p.tagline}</p>
                    <p className="text-[11px] text-slate-600 pt-0.5">
                      {p.algorithms.length} problem{p.algorithms.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>
      </section>

      {/* ── Algorithm preview ─────────────────────────────────────────────────── */}
      <section>
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Featured Algorithms</h2>
            <p className="mt-1 text-sm text-slate-500">A taste of what's inside</p>
          </div>
          <Link to="/algorithms" className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors">
            View all {ALGORITHMS.length} <ArrowIcon />
          </Link>
        </div>

        <motion.div
          variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {preview.map((algo) => (
            <motion.div key={algo.id} variants={staggerItem}>
              <AlgoCard algo={algo} />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Coming soon ───────────────────────────────────────────────────────── */}
      <section>
        <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div>
            <p className="text-sm font-semibold text-white">More sections coming soon</p>
            <p className="text-xs text-slate-500 mt-0.5">Frontend internals and Backend internals are on the roadmap — browser rendering, JS engine, databases, APIs, and more.</p>
          </div>
          <div className="flex gap-2 shrink-0">
            {['Frontend', 'Backend'].map((label) => (
              <span key={label} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-500">
                {label} <span className="text-slate-700 ml-1">soon</span>
              </span>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}
