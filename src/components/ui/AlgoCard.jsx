import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { DIFFICULTY_COLOR } from '../../constants/algorithmRegistry'
import { getAlgoPatternGlows } from '../../constants/patternsRegistry'

export default function AlgoCard({ algo, number }) {
  const glows = getAlgoPatternGlows(algo.id)

  const topBarStyle = glows.length === 0
    ? {}
    : { background: glows.length === 1 ? glows[0] : `linear-gradient(90deg, ${glows.join(', ')})` }

  return (
    <motion.div
      className="glow-card rounded-2xl"
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Link
        to={algo.path}
        className="block rounded-2xl border border-white/10 bg-white/5 hover:border-blue-500/40 hover:bg-blue-500/5 transition-colors overflow-hidden"
      >
        {/* Pattern colour bar */}
        {glows.length > 0 && (
          <div className="h-[3px] w-full" style={topBarStyle} />
        )}

        <div className="p-4 sm:p-6">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              {number && (
                <span className="inline-block rounded border border-white/10 bg-white/[0.06] px-1.5 py-0.5 text-[11px] font-mono font-medium text-slate-400 mb-1">#{number}</span>
              )}
              <h3 className="font-semibold text-white">{algo.title}</h3>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${DIFFICULTY_COLOR[algo.difficulty]}`}>
              {algo.difficulty}
            </span>
          </div>

          <p className="mb-4 text-sm text-slate-400 leading-relaxed">
            {algo.metaphor}
          </p>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-md bg-blue-500/15 px-2 py-0.5 text-xs text-blue-300">
              {algo.pattern}
            </span>
            {algo.tags.map((tag) => (
              <span key={tag} className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-slate-400">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
