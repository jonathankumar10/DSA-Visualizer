import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

const NAV_LINKS = [
  { label: 'Home',       to: '/' },
  { label: 'Algorithms', to: '/algorithms' },
  { label: 'System Design', to: '/system-design' },
]

export default function Navbar() {
  const { pathname } = useLocation()

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-lg sm:text-xl font-bold tracking-tight text-white">
            Algo<span className="text-violet-400">Viz</span>
          </span>
        </Link>

        <ul className="flex items-center gap-0.5 sm:gap-1">
          {NAV_LINKS.map(({ label, to }) => {
            const active = pathname === to || (to !== '/' && pathname.startsWith(to))
            return (
              <li key={to}>
                <Link
                  to={to}
                  className={`relative rounded-lg px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors ${
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
      </nav>
    </header>
  )
}
