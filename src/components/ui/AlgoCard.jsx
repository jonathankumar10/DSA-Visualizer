import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { DIFFICULTY_COLOR } from '../../constants/algorithmRegistry'

export default function AlgoCard({ algo }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Link
        to={algo.path}
        className="block rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6 hover:border-violet-500/50 hover:bg-violet-500/5 transition-colors"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="font-semibold text-white">{algo.title}</h3>
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              DIFFICULTY_COLOR[algo.difficulty]
            }`}
          >
            {algo.difficulty}
          </span>
        </div>

        <p className="mb-4 text-sm text-slate-400 leading-relaxed">
          {algo.metaphor}
        </p>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-md bg-violet-500/15 px-2 py-0.5 text-xs text-violet-300">
            {algo.pattern}
          </span>
          {algo.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-slate-400"
            >
              {tag}
            </span>
          ))}
        </div>
      </Link>
    </motion.div>
  )
}
