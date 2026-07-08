import { motion, AnimatePresence } from 'framer-motion'

// Accent colors used by system-design Diagram callouts — Tailwind needs
// static class names, so dynamic `${color}` interpolation isn't safe here.
const ACCENT = {
  red:    { border: 'border-red-500/40',    bg: 'bg-red-500/[0.07]',    title: 'text-red-400' },
  amber:  { border: 'border-amber-500/40',  bg: 'bg-amber-500/[0.07]',  title: 'text-amber-400' },
  violet: { border: 'border-violet-500/40', bg: 'bg-violet-500/[0.07]', title: 'text-violet-400' },
  rose:   { border: 'border-rose-500/40',   bg: 'bg-rose-500/[0.07]',   title: 'text-rose-400' },
}

// Renders a step's callout banner (icon + title + note). `banner` comes from
// the step data in steps.js — pass undefined/null to render nothing.
export default function StepBanner({ banner }) {
  const accent = banner && ACCENT[banner.color]

  return (
    <AnimatePresence>
      {banner && (
        <motion.div
          key={banner.title}
          initial={{ opacity: 0, y: 8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 24 }}
          className={`relative mt-3 flex items-center gap-3 rounded-xl border ${accent.border} ${accent.bg} px-4 py-3`}
        >
          <span className="text-xl select-none">{banner.icon}</span>
          <div>
            <p className={`text-[11px] font-bold uppercase tracking-wider ${accent.title}`}>{banner.title}</p>
            <p className="text-sm text-white">{banner.text}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
