import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

const LONG_URL  = 'https://www.example.com/products/category/electronics/item-12345?ref=campaign&source=newsletter'
const SHORT_URL = 'https://short.ly/aB3xK9z'

export default function ConceptIllustration() {
  const [phase, setPhase] = useState('idle') // idle → shortening → done → idle

  useEffect(() => {
    let alive = true

    const cycle = () => {
      if (!alive) return
      setPhase('shortening')
      setTimeout(() => { if (alive) setPhase('done') }, 1400)
      setTimeout(() => { if (alive) { setPhase('idle'); setTimeout(cycle, 600) } }, 4200)
    }

    const t = setTimeout(cycle, 900)
    return () => { alive = false; clearTimeout(t) }
  }, [])

  const shortening = phase === 'shortening'
  const done       = phase === 'done'
  const active     = shortening || done

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-5 space-y-5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Concept</p>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">

        {/* Long URL box */}
        <motion.div
          className="flex-1 rounded-xl border px-4 py-3.5 space-y-2"
          animate={{
            borderColor:     active ? 'rgba(239,68,68,0.45)' : 'rgba(239,68,68,0.2)',
            backgroundColor: 'rgba(239,68,68,0.04)',
          }}
          transition={{ duration: 0.35 }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-red-400">Long URL</p>
          <p className="font-mono text-[11px] text-slate-400 break-all leading-relaxed">{LONG_URL}</p>
        </motion.div>

        {/* Middle: button + animated arrow */}
        <div className="flex sm:flex-col items-center gap-2 sm:gap-2 shrink-0 py-1">
          <motion.div
            className="rounded-lg border px-3.5 py-1.5 text-[11px] font-bold whitespace-nowrap order-2 sm:order-1"
            animate={{
              borderColor:     shortening ? 'rgba(59,130,246,0.9)' : 'rgba(59,130,246,0.25)',
              backgroundColor: shortening ? 'rgba(59,130,246,0.2)'  : 'rgba(59,130,246,0.06)',
              color:           shortening ? '#93c5fd' : '#475569',
              boxShadow:       shortening ? '0 0 18px 3px rgba(59,130,246,0.3)' : 'none',
            }}
            transition={{ duration: 0.3 }}
          >
            Shorten
          </motion.div>

          {/* Arrow — horizontal on sm+, vertical on mobile */}
          <div className="relative flex items-center justify-center order-1 sm:order-2">
            {/* Horizontal track (sm+) */}
            <div className="hidden sm:block w-20 h-px bg-white/[0.07] relative overflow-hidden rounded-full">
              <motion.div
                className="absolute inset-y-0 left-0 bg-blue-500 rounded-full"
                animate={{ width: active ? '100%' : '0%' }}
                transition={{ duration: 0.55, ease: 'easeInOut' }}
              />
            </div>
            {/* Vertical track (mobile) */}
            <div className="sm:hidden w-px h-10 bg-white/[0.07] relative overflow-hidden rounded-full">
              <motion.div
                className="absolute inset-x-0 top-0 bg-blue-500 rounded-full"
                animate={{ height: active ? '100%' : '0%' }}
                transition={{ duration: 0.55, ease: 'easeInOut' }}
              />
            </div>

            {/* Arrowhead — right on sm+, down on mobile */}
            <motion.svg
              viewBox="0 0 8 12"
              className="hidden sm:block absolute -right-1.5 w-2 h-3 text-blue-500"
              fill="none"
              animate={{ opacity: active ? 1 : 0.15, x: active ? 0 : -2 }}
              transition={{ duration: 0.3 }}
            >
              <path d="M1 1l6 5-6 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </motion.svg>

            <motion.svg
              viewBox="0 0 12 8"
              className="sm:hidden absolute -bottom-1.5 w-3 h-2 text-blue-500"
              fill="none"
              animate={{ opacity: active ? 1 : 0.15, y: active ? 0 : -2 }}
              transition={{ duration: 0.3 }}
            >
              <path d="M1 1l5 6 5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </motion.svg>
          </div>
        </div>

        {/* Short URL box */}
        <motion.div
          className="flex-none sm:w-56 rounded-xl border px-4 py-3.5 space-y-2"
          animate={{
            borderColor:     done ? 'rgba(34,197,94,0.45)' : 'rgba(255,255,255,0.08)',
            backgroundColor: done ? 'rgba(34,197,94,0.05)'  : 'rgba(255,255,255,0.02)',
            boxShadow:       done ? '0 0 24px 4px rgba(34,197,94,0.1)' : 'none',
          }}
          transition={{ duration: 0.4 }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Short URL</p>
          <div className="min-h-[1.25rem]">
            <AnimatePresence mode="wait">
              {done ? (
                <motion.p
                  key="url"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -3 }}
                  transition={{ duration: 0.3 }}
                  className="font-mono text-xs text-emerald-300"
                >
                  {SHORT_URL}
                </motion.p>
              ) : (
                <motion.p
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="font-mono text-xs text-slate-600 tracking-widest"
                >
                  · · ·
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

      </div>
    </div>
  )
}
