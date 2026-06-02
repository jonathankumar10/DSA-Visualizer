import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PATTERNS, PATTERN_COLORS } from '../constants/patternsRegistry'

const grid = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}
const card = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } },
}

export default function PatternsIndex() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Patterns</h1>
        <p className="mt-2 text-slate-400 max-w-xl">
          The building blocks behind every interview problem — each with a live interactive illustration, full explanation, and linked problems.
        </p>
      </div>

      <motion.div
        variants={grid}
        initial="hidden"
        animate="show"
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        {PATTERNS.map((p) => {
          const c = PATTERN_COLORS[p.color]
          return (
            <motion.div key={p.id} variants={card} className="glow-card rounded-2xl">
              <Link
                to={`/patterns/${p.id}`}
                className="group block rounded-2xl border border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] transition-all duration-200 overflow-hidden"
              >
                <div className={`h-1 w-full ${c.dot}`} />

                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h2 className="text-base font-bold text-white">{p.title}</h2>
                      <p className={`text-xs font-medium ${c.text}`}>{p.tagline}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold border ${c.badgeBg} ${c.badgeBorder} ${c.text}`}>
                      {p.algorithms.length} problem{p.algorithms.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                    {p.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {p.algorithms.slice(0, 4).map((a) => (
                      <span key={a.id} className="rounded-md bg-white/5 border border-white/8 px-2 py-0.5 text-[10px] text-slate-500">
                        {a.title}
                      </span>
                    ))}
                    {p.algorithms.length > 4 && (
                      <span className="rounded-md bg-white/5 border border-white/8 px-2 py-0.5 text-[10px] text-slate-600">
                        +{p.algorithms.length - 4} more
                      </span>
                    )}
                  </div>

                  <div className={`flex items-center gap-1.5 text-xs font-medium ${c.text} opacity-0 group-hover:opacity-100 transition-opacity`}>
                    Explore pattern
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                    </svg>
                  </div>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
