import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import AlgoCard from '../components/ui/AlgoCard'
import { ALGORITHMS } from '../constants/algorithmRegistry'

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
    title: 'Metaphor-first',
    body: 'Every algorithm is mapped to a concrete real-world scene — bottles, city maps, glowing trees — so the intuition sticks.',
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
    body: 'Play, pause, step forward or back through every execution frame. The code panel highlights the exact line running.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9"/>
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
      </svg>
    ),
    title: 'Interactive input',
    body: 'Swap in your own arrays, graphs, or trees and watch the algorithm adapt instantly. No page reload required.',
  },
]

// ── Stat item ─────────────────────────────────────────────────────────────────

function Stat({ value, label }) {
  return (
    <div className="flex flex-col items-center gap-1 px-8 py-5 rounded-2xl border border-white/8 bg-white/[0.03]">
      <span className="text-3xl font-extrabold text-white font-mono tracking-tight">{value}</span>
      <span className="text-xs text-slate-500 uppercase tracking-wider">{label}</span>
    </div>
  )
}

// ── Unique categories helper ──────────────────────────────────────────────────

const uniqueCategories = [...new Set(ALGORITHMS.map((a) => a.category))].length

// ── Component ─────────────────────────────────────────────────────────────────

export default function Home() {
  const preview = ALGORITHMS.slice(0, 3)

  return (
    <div className="space-y-20">

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative pt-12 pb-4 text-center overflow-hidden">
        {/* Subtle dot-grid background */}
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            backgroundImage: 'radial-gradient(rgba(139,92,246,0.12) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        {/* Radial glow behind headline */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/3 -z-10 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)', filter: 'blur(40px)' }}
        />

        <motion.div {...fadeUp(0)} className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-300 mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
          Visual · Interactive · Metaphor-driven
        </motion.div>

        <motion.h1 {...fadeUp(0.08)} className="text-5xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight mb-5">
          Algorithms you can{' '}
          <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
            see and feel
          </span>
        </motion.h1>

        <motion.p {...fadeUp(0.16)} className="mx-auto max-w-lg text-lg text-slate-400 leading-relaxed mb-8">
          AlgoViz maps every data structure and algorithm to a real-world scene.
          Step through each one at your own pace and watch the intuition click.
        </motion.p>

        <motion.div {...fadeUp(0.22)} className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            to="/algorithms"
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 active:bg-violet-700 px-6 py-3 text-sm font-semibold text-white transition-colors shadow-lg shadow-violet-500/20"
          >
            Explore algorithms
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </Link>
          <Link
            to="/system-design"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-6 py-3 text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            System Design
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-400">soon</span>
          </Link>
        </motion.div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────────────────── */}
      <motion.section
        variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
        className="grid grid-cols-3 gap-4 max-w-lg mx-auto"
      >
        <motion.div variants={staggerItem}><Stat value={ALGORITHMS.length} label="Visualizers" /></motion.div>
        <motion.div variants={staggerItem}><Stat value={uniqueCategories} label="Categories" /></motion.div>
        <motion.div variants={staggerItem}><Stat value="150" label="NC Target" /></motion.div>
      </motion.section>

      {/* ── Features ─────────────────────────────────────────────────────────── */}
      <section>
        <motion.h2
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="mb-8 text-center text-sm font-semibold uppercase tracking-widest text-slate-500"
        >
          Why AlgoViz
        </motion.h2>
        <motion.div
          variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="grid gap-5 sm:grid-cols-3"
        >
          {FEATURES.map((f) => (
            <motion.div
              key={f.title}
              variants={staggerItem}
              className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 space-y-3"
            >
              <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center text-violet-400">
                {f.icon}
              </div>
              <h3 className="font-semibold text-white">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Algorithm preview ─────────────────────────────────────────────────── */}
      <section>
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Featured</h2>
            <p className="mt-1 text-sm text-slate-500">A taste of what's inside</p>
          </div>
          <Link
            to="/algorithms"
            className="flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300 transition-colors"
          >
            View all {ALGORITHMS.length}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
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

    </div>
  )
}
