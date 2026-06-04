import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const NAV_LINKS = [
  { label: 'Home',          to: '/' },
  { label: 'Algorithms',    to: '/algorithms' },
  { label: 'Patterns',      to: '/patterns' },
  { label: 'System Design', to: '/system-design' },
  { label: 'OOD',           to: '/ood' },
  { label: 'AI',            to: '/ai' },
]

export default function Navbar() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)

  const isActive = (to) => pathname === to || (to !== '/' && pathname.startsWith(to))

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#09090b]/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
        <Link to="/" onClick={() => setOpen(false)} className="flex items-center gap-2">
          <span className="text-lg sm:text-xl font-bold tracking-tight text-white">
            Dev<span className="text-blue-400">Lens</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden sm:flex items-center gap-0.5 sm:gap-1">
          {NAV_LINKS.map(({ label, to }) => {
            const active = isActive(to)
            return (
              <li key={to}>
                <Link
                  to={to}
                  className={`relative rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors ${
                    active ? 'text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-lg bg-white/10"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                  <span className="relative">{label}</span>
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="sm:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Toggle menu"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            {open ? (
              <>
                <line x1="4" y1="4" x2="16" y2="16" />
                <line x1="16" y1="4" x2="4" y2="16" />
              </>
            ) : (
              <>
                <line x1="3" y1="5" x2="17" y2="5" />
                <line x1="3" y1="10" x2="17" y2="10" />
                <line x1="3" y1="15" x2="17" y2="15" />
              </>
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="sm:hidden overflow-hidden border-t border-white/10"
          >
            <ul className="px-4 py-3 space-y-1">
              {NAV_LINKS.map(({ label, to }) => {
                const active = isActive(to)
                return (
                  <li key={to}>
                    <Link
                      to={to}
                      onClick={() => setOpen(false)}
                      className={`block rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                        active
                          ? 'bg-blue-500/15 text-blue-300'
                          : 'text-slate-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
