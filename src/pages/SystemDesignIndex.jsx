import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { SYSTEM_DESIGN } from '../constants/systemDesignRegistry'

// ── SVG animations (one per concept) ─────────────────────────────────────────

function SvgComputerArch({ c }) {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      <rect x="6" y="8" width="28" height="20" rx="2" stroke={c} strokeWidth="1.2" opacity="0.5" />
      <rect x="11" y="13" width="18" height="10" rx="1" fill={c} fillOpacity="0.1" stroke={c} strokeWidth="1" />
      {[0, 1, 2].map((i) => (
        <motion.circle key={i} cx={15 + i * 5} cy="18" r="2" fill={c}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4 }} />
      ))}
      {[14, 20, 26].map((x) => (
        <line key={x} x1={x} y1="28" x2={x} y2="32" stroke={c} strokeWidth="1" opacity="0.4" />
      ))}
      <line x1="10" y1="32" x2="30" y2="32" stroke={c} strokeWidth="1" opacity="0.4" />
    </svg>
  )
}

function SvgDesignReqs({ c }) {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      <rect x="8" y="6" width="24" height="28" rx="2" stroke={c} strokeWidth="1.2" opacity="0.5" />
      {[12, 18, 24].map((y, i) => (
        <motion.line key={y} x1="13" y1={y} x2="27" y2={y} stroke={c} strokeWidth="1.2"
          animate={{ opacity: [0.2, 0.8, 0.2] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.35 }} />
      ))}
      <motion.polyline points="12,20 15,24 22,14" stroke={c} strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round"
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, times: [0, 0.3, 0.7, 1] }} />
    </svg>
  )
}

function SvgAppArch({ c }) {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      {[8, 17, 26].map((y, i) => (
        <motion.rect key={y} x="8" y={y} width="24" height="7" rx="1.5"
          fill={c} fillOpacity="0.15" stroke={c} strokeWidth="1"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.4 }} />
      ))}
    </svg>
  )
}

function SvgNetworking({ c }) {
  const pts = [[8, 10], [32, 10], [20, 30]]
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      {pts.map(([x1, y1], i) => pts.slice(i + 1).map(([x2, y2], j) => (
        <motion.line key={`${i}${j}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="1"
          animate={{ opacity: [0.2, 0.8, 0.2] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.5 }} />
      )))}
      {pts.map(([x, y], i) => (
        <motion.g key={i} animate={{ scale: [1, 1.3, 1] }}
          style={{ transformOrigin: `${x}px ${y}px` }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.5 }}>
          <circle cx={x} cy={y} r="4" fill={c} fillOpacity="0.2" stroke={c} strokeWidth="1.2" />
        </motion.g>
      ))}
    </svg>
  )
}

function SvgTcpUdp({ c }) {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      <circle cx="8" cy="20" r="4" fill={c} fillOpacity="0.2" stroke={c} strokeWidth="1.2" />
      <circle cx="32" cy="20" r="4" fill={c} fillOpacity="0.2" stroke={c} strokeWidth="1.2" />
      <motion.path d="M14 17 L26 17 M24 14 L26 17 L24 20" stroke={c} strokeWidth="1.2"
        strokeLinecap="round" strokeLinejoin="round"
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity, times: [0, 0.2, 0.6, 1] }} />
      <motion.path d="M26 23 L14 23 M16 20 L14 23 L16 26" stroke={c} strokeWidth="1.2"
        strokeLinecap="round" strokeLinejoin="round"
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.9, times: [0, 0.2, 0.6, 1] }} />
    </svg>
  )
}

function SvgDns({ c }) {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      <circle cx="20" cy="7" r="3.5" stroke={c} strokeWidth="1.2" fill={c} fillOpacity="0.15" />
      <circle cx="10" cy="22" r="3.5" stroke={c} strokeWidth="1.2" fill={c} fillOpacity="0.15" />
      <circle cx="30" cy="22" r="3.5" stroke={c} strokeWidth="1.2" fill={c} fillOpacity="0.15" />
      <motion.circle cx="30" cy="22" r="3.5" fill={c} fillOpacity="0"
        animate={{ r: [3.5, 7, 3.5], fillOpacity: [0.4, 0, 0.4] }}
        transition={{ duration: 1.8, repeat: Infinity }} />
      <circle cx="20" cy="34" r="3.5" stroke={c} strokeWidth="1.2" fill={c} fillOpacity="0.15" />
      <line x1="20" y1="10.5" x2="10" y2="18.5" stroke={c} strokeWidth="1" opacity="0.5" />
      <line x1="20" y1="10.5" x2="30" y2="18.5" stroke={c} strokeWidth="1" opacity="0.5" />
      <motion.line x1="30" y1="25.5" x2="20" y2="30.5" stroke={c} strokeWidth="1.2"
        animate={{ opacity: [0.2, 1, 0.2] }}
        transition={{ duration: 1.8, repeat: Infinity }} />
    </svg>
  )
}

function SvgHttp({ c }) {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      <rect x="4" y="13" width="12" height="8" rx="1.5" stroke={c} strokeWidth="1.2" fill={c} fillOpacity="0.1" />
      <rect x="24" y="13" width="12" height="8" rx="1.5" stroke={c} strokeWidth="1.2" fill={c} fillOpacity="0.1" />
      <motion.path d="M16 16 L24 16 M22 13.5 L24 16 L22 18.5" stroke={c} strokeWidth="1.2"
        strokeLinecap="round" strokeLinejoin="round"
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, times: [0, 0.1, 0.5, 0.6] }} />
      <motion.path d="M24 24 L16 24 M18 21.5 L16 24 L18 26.5" stroke={c} strokeWidth="1.2"
        strokeLinecap="round" strokeLinejoin="round"
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, delay: 1.1, times: [0, 0.1, 0.5, 0.6] }} />
    </svg>
  )
}

function SvgWebSockets({ c }) {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      <rect x="4" y="13" width="12" height="14" rx="1.5" stroke={c} strokeWidth="1.2" fill={c} fillOpacity="0.1" />
      <rect x="24" y="13" width="12" height="14" rx="1.5" stroke={c} strokeWidth="1.2" fill={c} fillOpacity="0.1" />
      <motion.path d="M16 16 L24 16 M22 13.5 L24 16 L22 18.5" stroke={c} strokeWidth="1.2"
        strokeLinecap="round" strokeLinejoin="round"
        animate={{ x: [0, 3, 0, -3, 0] }}
        transition={{ duration: 1.4, repeat: Infinity }} />
      <motion.path d="M24 24 L16 24 M18 21.5 L16 24 L18 26.5" stroke={c} strokeWidth="1.2"
        strokeLinecap="round" strokeLinejoin="round"
        animate={{ x: [0, -3, 0, 3, 0] }}
        transition={{ duration: 1.4, repeat: Infinity }} />
    </svg>
  )
}

function SvgApiParadigms({ c }) {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      {[10, 20, 30].map((y, i) => (
        <motion.g key={y} animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.5 }}>
          <rect x="6" y={y - 4} width="28" height="7" rx="3.5"
            stroke={c} strokeWidth="1" fill={c} fillOpacity="0.08" />
        </motion.g>
      ))}
    </svg>
  )
}

function SvgApiDesign({ c }) {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      <rect x="5" y="8" width="30" height="24" rx="2" stroke={c} strokeWidth="1.2" fill={c} fillOpacity="0.05" />
      <rect x="8" y="13" width="8" height="4" rx="1" fill={c} fillOpacity="0.35" />
      <motion.rect x="18" y="13" width="14" height="4" rx="1" fill={c} fillOpacity="0.15"
        animate={{ width: [14, 9, 14] }}
        transition={{ duration: 2, repeat: Infinity }} />
      <rect x="8" y="21" width="6" height="3" rx="1" fill={c} fillOpacity="0.35" />
      <rect x="16" y="21" width="16" height="3" rx="1" fill={c} fillOpacity="0.15" />
    </svg>
  )
}

function SvgCaching({ c }) {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      <rect x="5" y="9" width="30" height="7" rx="3.5" fill={c} fillOpacity="0.1" stroke={c} strokeWidth="1" opacity="0.7" />
      <motion.circle cy="12.5" r="3" fill={c}
        animate={{ cx: [6, 34, 6] }}
        transition={{ duration: 0.55, repeat: Infinity, repeatDelay: 1.6, ease: 'easeIn' }} />
      <rect x="5" y="22" width="30" height="7" rx="3.5" fill="rgba(6,182,212,0.1)" stroke="rgb(6,182,212)" strokeWidth="1" opacity="0.6" />
      <motion.circle cy="25.5" r="3" fill="rgb(6,182,212)"
        animate={{ cx: [6, 34, 6] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} />
    </svg>
  )
}

function SvgCdns({ c }) {
  const edgePts = [0, 72, 144, 216, 288].map((deg) => [
    20 + 13 * Math.cos(((deg - 90) * Math.PI) / 180),
    20 + 13 * Math.sin(((deg - 90) * Math.PI) / 180),
  ])
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      <circle cx="20" cy="20" r="13" stroke={c} strokeWidth="1" opacity="0.25" />
      <circle cx="20" cy="20" r="7" stroke={c} strokeWidth="1" opacity="0.35" />
      {edgePts.map(([x, y], i) => (
        <motion.circle key={i} cx={x} cy={y} r="2.5" fill={c}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }} />
      ))}
      <circle cx="20" cy="20" r="3" fill={c} opacity="0.6" />
    </svg>
  )
}

function SvgProxies({ c }) {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      <circle cx="7" cy="20" r="4" fill={c} fillOpacity="0.2" stroke={c} strokeWidth="1.2" />
      {[10, 20, 30].map((y, i) => (
        <motion.g key={y} animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4 }}>
          <line x1="11" y1="20" x2="28" y2={y} stroke={c} strokeWidth="1" />
          <circle cx="32" cy={y} r="3.5" fill={c} fillOpacity="0.15" stroke={c} strokeWidth="1" />
        </motion.g>
      ))}
    </svg>
  )
}

function SvgConsistentHashing({ c }) {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      <circle cx="20" cy="20" r="14" stroke={c} strokeWidth="1.2" fill="none" opacity="0.4" />
      {[0, 90, 180, 270].map((deg, i) => {
        const x = 20 + 14 * Math.cos(((deg - 90) * Math.PI) / 180)
        const y = 20 + 14 * Math.sin(((deg - 90) * Math.PI) / 180)
        return <rect key={i} x={x - 2.5} y={y - 2.5} width="5" height="5" rx="1" fill={c} opacity="0.7" />
      })}
      <motion.g animate={{ rotate: 360 }} style={{ transformOrigin: '20px 20px' }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}>
        <circle cx="20" cy="6" r="3" fill={c} />
      </motion.g>
    </svg>
  )
}

function SvgSql({ c }) {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      <rect x="5" y="7" width="30" height="26" rx="2" stroke={c} strokeWidth="1.2" fill={c} fillOpacity="0.05" />
      <rect x="5" y="7" width="30" height="6" rx="2" fill={c} fillOpacity="0.2" />
      <line x1="5" y1="19" x2="35" y2="19" stroke={c} strokeWidth="0.8" opacity="0.3" />
      <line x1="5" y1="26" x2="35" y2="26" stroke={c} strokeWidth="0.8" opacity="0.3" />
      <line x1="18" y1="13" x2="18" y2="33" stroke={c} strokeWidth="0.8" opacity="0.3" />
      <motion.rect x="5" y="19" width="30" height="7" fill={c} fillOpacity="0"
        animate={{ fillOpacity: [0, 0.2, 0] }}
        transition={{ duration: 2, repeat: Infinity }} />
    </svg>
  )
}

function SvgNoSql({ c }) {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      <text x="5" y="17" fontSize="11" fill={c} opacity="0.8" fontFamily="monospace">{'{'}</text>
      <text x="32" y="17" fontSize="11" fill={c} opacity="0.8" fontFamily="monospace">{'}'}</text>
      {[21, 27, 33].map((y, i) => (
        <motion.line key={y} x1="12" y1={y} x2="28" y2={y} stroke={c} strokeWidth="1.5"
          animate={{ opacity: [0.2, 0.9, 0.2] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.4 }} />
      ))}
    </svg>
  )
}

function SvgDbReplication({ c }) {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      <rect x="3" y="15" width="12" height="10" rx="1.5" fill={c} fillOpacity="0.2" stroke={c} strokeWidth="1.2" />
      {[8, 22].map((y, i) => (
        <motion.g key={y} animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.6 }}>
          <rect x="25" y={y} width="12" height="9" rx="1.5" fill={c} fillOpacity="0.12" stroke={c} strokeWidth="1" />
          <motion.line x1="15" y1="20" x2="25" y2={y + 4.5} stroke={c} strokeWidth="1"
            strokeDasharray="3 2"
            animate={{ strokeDashoffset: [0, -10] }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
        </motion.g>
      ))}
    </svg>
  )
}

function SvgDbSharding({ c }) {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      <rect x="14" y="5" width="12" height="10" rx="1.5" fill={c} fillOpacity="0.2" stroke={c} strokeWidth="1.2" />
      <motion.g animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}>
        <line x1="20" y1="15" x2="12" y2="24" stroke={c} strokeWidth="1.2" />
        <line x1="20" y1="15" x2="28" y2="24" stroke={c} strokeWidth="1.2" />
      </motion.g>
      <rect x="4" y="24" width="15" height="10" rx="1.5" fill={c} fillOpacity="0.15" stroke={c} strokeWidth="1" />
      <rect x="21" y="24" width="15" height="10" rx="1.5" fill={c} fillOpacity="0.15" stroke={c} strokeWidth="1" />
      <line x1="7" y1="29" x2="17" y2="29" stroke={c} strokeWidth="1" opacity="0.4" />
      <line x1="24" y1="29" x2="34" y2="29" stroke={c} strokeWidth="1" opacity="0.4" />
    </svg>
  )
}

function SvgDbIndexes({ c }) {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      <circle cx="20" cy="7" r="3.5" stroke={c} strokeWidth="1.2" fill={c} fillOpacity="0.2" />
      <circle cx="11" cy="20" r="3.5" stroke={c} strokeWidth="1.2" fill={c} fillOpacity="0.2" />
      <motion.circle cx="29" cy="20" r="3.5" stroke={c} strokeWidth="1.2" fill={c}
        animate={{ fillOpacity: [0.2, 0.7, 0.2] }}
        transition={{ duration: 1.8, repeat: Infinity }} />
      <circle cx="7" cy="33" r="3" stroke={c} strokeWidth="1" fill={c} fillOpacity="0.15" />
      <circle cx="15" cy="33" r="3" stroke={c} strokeWidth="1" fill={c} fillOpacity="0.15" />
      <circle cx="33" cy="33" r="3" stroke={c} strokeWidth="1" fill={c} fillOpacity="0.15" />
      <line x1="20" y1="10.5" x2="11" y2="16.5" stroke={c} strokeWidth="1" opacity="0.5" />
      <line x1="20" y1="10.5" x2="29" y2="16.5" stroke={c} strokeWidth="1" opacity="0.5" />
      <line x1="11" y1="23.5" x2="7" y2="30" stroke={c} strokeWidth="1" opacity="0.5" />
      <line x1="11" y1="23.5" x2="15" y2="30" stroke={c} strokeWidth="1" opacity="0.5" />
      <line x1="29" y1="23.5" x2="33" y2="30" stroke={c} strokeWidth="1" opacity="0.5" />
    </svg>
  )
}

function SvgAcidBase({ c }) {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      <rect x="10" y="18" width="20" height="16" rx="2" fill={c} fillOpacity="0.15" stroke={c} strokeWidth="1.2" />
      <motion.g animate={{ y: [0, -4, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
        <path d="M14 18 L14 12 Q14 6 20 6 Q26 6 26 12 L26 18" stroke={c} strokeWidth="1.5" fill="none" />
      </motion.g>
      <circle cx="20" cy="27" r="2.5" fill={c} opacity="0.6" />
      <line x1="20" y1="29.5" x2="20" y2="33" stroke={c} strokeWidth="1.5" opacity="0.6" />
    </svg>
  )
}

function SvgObjectStorage({ c }) {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      <ellipse cx="20" cy="31" rx="12" ry="4" stroke={c} strokeWidth="1.2" fill={c} fillOpacity="0.1" />
      <line x1="8" y1="17" x2="8" y2="31" stroke={c} strokeWidth="1.2" opacity="0.6" />
      <line x1="32" y1="17" x2="32" y2="31" stroke={c} strokeWidth="1.2" opacity="0.6" />
      <ellipse cx="20" cy="17" rx="12" ry="4" stroke={c} strokeWidth="1.2" fill={c} fillOpacity="0.15" />
      <motion.g animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
        <rect x="16" y="13" width="8" height="8" rx="1" fill={c} fillOpacity="0.3" stroke={c} strokeWidth="1" />
      </motion.g>
    </svg>
  )
}

function SvgCapTheorem({ c }) {
  const verts = [[20, 5], [36, 33], [4, 33]]
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      <polygon points="20,5 36,33 4,33" stroke={c} strokeWidth="1.2" fill={c} fillOpacity="0.06" opacity="0.6" />
      {verts.map(([x, y], i) => (
        <motion.g key={i} animate={{ scale: [1, 1.4, 1] }}
          style={{ transformOrigin: `${x}px ${y}px` }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.6 }}>
          <circle cx={x} cy={y} r="4" fill={c} opacity="0.8" />
        </motion.g>
      ))}
    </svg>
  )
}

function SvgConsistency({ c }) {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      <rect x="2" y="14" width="14" height="12" rx="2" stroke={c} strokeWidth="1.2" fill={c} fillOpacity="0.12" />
      <rect x="24" y="14" width="14" height="12" rx="2" stroke={c} strokeWidth="1.2" fill={c} fillOpacity="0.12" />
      <motion.path d="M16 18 L24 18 M22 15.5 L24 18 L22 20.5" stroke={c} strokeWidth="1.2"
        strokeLinecap="round" strokeLinejoin="round"
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity, times: [0, 0.1, 0.5, 0.6] }} />
      <motion.path d="M24 22 L16 22 M18 19.5 L16 22 L18 24.5" stroke={c} strokeWidth="1.2"
        strokeLinecap="round" strokeLinejoin="round"
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.9, times: [0, 0.1, 0.5, 0.6] }} />
    </svg>
  )
}

function SvgAvailability({ c }) {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      <motion.polyline
        points="4,20 9,20 12,10 15,30 18,15 21,25 24,12 27,28 30,18 36,20"
        stroke={c} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity }} />
      <motion.circle cx="21" cy="25" r="2.5" fill={c}
        animate={{ cy: [25, 12, 25] }}
        transition={{ duration: 1.5, repeat: Infinity }} />
    </svg>
  )
}

function SvgRateLimiting({ c }) {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      <rect x="10" y="10" width="20" height="22" rx="2" stroke={c} strokeWidth="1.2" fill={c} fillOpacity="0.05" />
      {[0, 1, 2].map((i) => (
        <motion.circle key={i} cx={16 + i * 4} cy="18" r="2.5" fill={c}
          animate={{ cy: [18, 30], opacity: [1, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.45 }} />
      ))}
      <motion.circle cx="20" cy="35" r="2" fill={c}
        animate={{ opacity: [0, 1, 0], cy: [33, 37] }}
        transition={{ duration: 1.4, repeat: Infinity, delay: 0.9 }} />
    </svg>
  )
}

function SvgMessageQueues({ c }) {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      <rect x="4" y="13" width="24" height="14" rx="2" stroke={c} strokeWidth="1.2" fill={c} fillOpacity="0.07" />
      {[16, 20, 24].map((y, i) => (
        <motion.rect key={y} x="7" y={y - 2} width="18" height="3.5" rx="1" fill={c}
          animate={{ x: [7, 28], opacity: [0.8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.55 }} />
      ))}
      <rect x="31" y="15" width="6" height="10" rx="1.5" stroke={c} strokeWidth="1" fill={c} fillOpacity="0.15" />
      <motion.line x1="28" y1="20" x2="31" y2="20" stroke={c} strokeWidth="1.2"
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 1, repeat: Infinity, delay: 1.2 }} />
    </svg>
  )
}

function SvgLogging({ c }) {
  const heights = [10, 20, 14, 26, 11]
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      {heights.map((h, i) => (
        <motion.rect key={i} x={5 + i * 7} y={35 - h} width="5" height={h} rx="1" fill={c}
          animate={{ height: [h, h * 1.4, h], y: [35 - h, 35 - h * 1.4, 35 - h] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }} />
      ))}
      <line x1="3" y1="35" x2="37" y2="35" stroke={c} strokeWidth="1" opacity="0.4" />
    </svg>
  )
}

function SvgDistTracing({ c }) {
  const spans = [{ x: 4, w: 32, y: 8 }, { x: 7, w: 18, y: 16 }, { x: 22, w: 14, y: 16 }, { x: 9, w: 9, y: 24 }, { x: 20, w: 16, y: 24 }]
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      {spans.map((s, i) => (
        <motion.rect key={i} x={s.x} y={s.y} width={s.w} height="5" rx="1.5"
          fill={c} fillOpacity="0.25" stroke={c} strokeWidth="0.8"
          animate={{ fillOpacity: [0.12, 0.5, 0.12] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }} />
      ))}
    </svg>
  )
}

function SvgMicroservices({ c }) {
  const svcs = [[7, 7], [33, 7], [7, 33], [33, 33], [20, 20]]
  const edges = [[0, 4], [1, 4], [2, 4], [3, 4], [0, 1], [2, 3]]
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      {edges.map(([a, b], i) => (
        <motion.line key={i} x1={svcs[a][0]} y1={svcs[a][1]} x2={svcs[b][0]} y2={svcs[b][1]} stroke={c} strokeWidth="1"
          animate={{ opacity: [0.2, 0.7, 0.2] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }} />
      ))}
      {svcs.map(([x, y], i) => (
        <motion.rect key={i} x={x - 4} y={y - 4} width="8" height="8" rx="1.5"
          fill={c} fillOpacity="0.2" stroke={c} strokeWidth="1"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.25 }} />
      ))}
    </svg>
  )
}

function SvgEventDriven({ c }) {
  const targets = [[6, 10], [34, 10], [6, 30], [34, 30]]
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      <circle cx="20" cy="20" r="5" fill={c} fillOpacity="0.2" stroke={c} strokeWidth="1.2" />
      <motion.circle cx="20" cy="20" r="5" stroke={c} strokeWidth="1" fill="none"
        animate={{ r: [5, 14, 5], opacity: [0.8, 0, 0.8] }}
        transition={{ duration: 1.5, repeat: Infinity }} />
      {targets.map(([x, y], i) => (
        <motion.g key={i} animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}>
          <line x1="20" y1="20" x2={x} y2={y} stroke={c} strokeWidth="1" strokeDasharray="3 2" />
          <circle cx={x} cy={y} r="3" fill={c} fillOpacity="0.2" stroke={c} strokeWidth="1" />
        </motion.g>
      ))}
    </svg>
  )
}

function SvgBlueprint({ c }) {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      {[10, 18, 26, 34].map((x) => <line key={`v${x}`} x1={x} y1="6" x2={x} y2="34" stroke={c} strokeWidth="0.5" opacity="0.2" />)}
      {[10, 18, 26, 34].map((y) => <line key={`h${y}`} x1="6" y1={y} x2="34" y2={y} stroke={c} strokeWidth="0.5" opacity="0.2" />)}
      <rect x="10" y="10" width="16" height="12" rx="1" stroke={c} strokeWidth="1.2" fill={c} fillOpacity="0.1" />
      <rect x="10" y="26" width="8" height="8" rx="1" stroke={c} strokeWidth="1" fill={c} fillOpacity="0.1" />
      <rect x="22" y="26" width="12" height="8" rx="1" stroke={c} strokeWidth="1" fill={c} fillOpacity="0.1" />
      <motion.rect x="6" y="6" width="28" height="2" rx="1" fill={c} opacity="0.5"
        animate={{ y: [6, 34, 6] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }} />
    </svg>
  )
}

// ── Concept id → SVG component map ────────────────────────────────────────────

const NODE_SVG = {
  'computer-architecture':      SvgComputerArch,
  'design-requirements':        SvgDesignReqs,
  'application-architecture':   SvgAppArch,
  'networking-basics':          SvgNetworking,
  'tcp-and-udp':                SvgTcpUdp,
  'dns':                        SvgDns,
  'http':                       SvgHttp,
  'websockets':                 SvgWebSockets,
  'api-paradigms':              SvgApiParadigms,
  'api-design':                 SvgApiDesign,
  'caching':                    SvgCaching,
  'cdns':                       SvgCdns,
  'proxies-and-load-balancing': SvgProxies,
  'consistent-hashing':         SvgConsistentHashing,
  'sql':                        SvgSql,
  'nosql':                      SvgNoSql,
  'database-replication':       SvgDbReplication,
  'database-sharding':          SvgDbSharding,
  'database-indexes':           SvgDbIndexes,
  'acid-and-base':              SvgAcidBase,
  'object-storage':             SvgObjectStorage,
  'cap-theorem':                SvgCapTheorem,
  'consistency-patterns':       SvgConsistency,
  'availability-patterns':      SvgAvailability,
  'rate-limiting':              SvgRateLimiting,
  'message-queues':             SvgMessageQueues,
  'logging-and-monitoring':     SvgLogging,
  'distributed-tracing':        SvgDistTracing,
  'microservices':              SvgMicroservices,
  'event-driven-architecture':  SvgEventDriven,
}

// ── Stage definitions ─────────────────────────────────────────────────────────

const STAGES = [
  {
    id: 'foundations',
    label: 'Foundations',
    description: 'Core building blocks every distributed system is built on.',
    hex: '#f59e0b',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/[0.05]',
    badge: 'bg-amber-500/15 text-amber-300',
    ids: ['computer-architecture', 'design-requirements', 'application-architecture'],
  },
  {
    id: 'networking',
    label: 'Networking',
    description: 'How bytes travel between machines across protocols and the internet.',
    hex: '#3b82f6',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/[0.05]',
    badge: 'bg-blue-500/15 text-blue-300',
    ids: ['networking-basics', 'tcp-and-udp', 'dns'],
  },
  {
    id: 'apis',
    label: 'APIs',
    description: 'How services expose and consume functionality across the network.',
    hex: '#0ea5e9',
    text: 'text-sky-400',
    border: 'border-sky-500/30',
    bg: 'bg-sky-500/[0.05]',
    badge: 'bg-sky-500/15 text-sky-300',
    ids: ['http', 'websockets', 'api-paradigms', 'api-design'],
  },
  {
    id: 'caching',
    label: 'Caching & Delivery',
    description: 'Speed up reads, reduce latency, and deliver content close to the user.',
    hex: '#f97316',
    text: 'text-orange-400',
    border: 'border-orange-500/30',
    bg: 'bg-orange-500/[0.05]',
    badge: 'bg-orange-500/15 text-orange-300',
    ids: ['caching', 'cdns', 'proxies-and-load-balancing', 'consistent-hashing'],
  },
  {
    id: 'storage',
    label: 'Storage & Databases',
    description: 'Where data lives, how it\'s structured, replicated, and retrieved at scale.',
    hex: '#06b6d4',
    text: 'text-cyan-400',
    border: 'border-cyan-500/30',
    bg: 'bg-cyan-500/[0.05]',
    badge: 'bg-cyan-500/15 text-cyan-300',
    ids: ['sql', 'nosql', 'database-replication', 'database-sharding', 'database-indexes', 'acid-and-base', 'object-storage'],
  },
  {
    id: 'reliability',
    label: 'Reliability & Scale',
    description: 'Keep systems alive, consistent, and responsive under load and partial failure.',
    hex: '#f43f5e',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    bg: 'bg-rose-500/[0.05]',
    badge: 'bg-rose-500/15 text-rose-300',
    ids: ['cap-theorem', 'consistency-patterns', 'availability-patterns', 'rate-limiting', 'message-queues'],
  },
  {
    id: 'operations',
    label: 'Architecture & Ops',
    description: 'Modern patterns for building and observing large-scale distributed systems.',
    hex: '#8b5cf6',
    text: 'text-violet-400',
    border: 'border-violet-500/30',
    bg: 'bg-violet-500/[0.05]',
    badge: 'bg-violet-500/15 text-violet-300',
    ids: ['logging-and-monitoring', 'distributed-tracing', 'microservices', 'event-driven-architecture'],
  },
]

const DESIGN_HEX = '#6366f1'

// ── Sub-components ────────────────────────────────────────────────────────────

function StageConnector({ fromHex, toHex }) {
  return (
    <div className="flex justify-center my-1">
      <svg width="24" height="40" viewBox="0 0 24 40" fill="none">
        <motion.line x1="12" y1="0" x2="12" y2="28"
          stroke={fromHex} strokeWidth="1.5" strokeDasharray="4 3"
          animate={{ strokeDashoffset: [0, -14] }}
          transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }} />
        <motion.polyline points="5,22 12,32 19,22"
          stroke={toHex} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity }} />
      </svg>
    </div>
  )
}

const nodeContainerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}
const nodeVariants = {
  hidden: { opacity: 0, scale: 0.75, y: 12 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 22 } },
}

function ConceptNode({ item, stage }) {
  const SvgComp = NODE_SVG[item.id]
  return (
    <motion.div variants={nodeVariants} className="flex flex-col items-center gap-2">
      <motion.div
        whileHover={{ y: -5, scale: 1.1 }}
        whileTap={{ scale: 0.94 }}
        transition={{ type: 'spring', stiffness: 320, damping: 20 }}
      >
        <Link
          to={item.path}
          className="flex items-center justify-center w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-2xl border bg-white/[0.03] hover:bg-white/[0.07] transition-colors"
          style={{ borderColor: `${stage.hex}55` }}
        >
          {SvgComp && <SvgComp c={stage.hex} />}
        </Link>
      </motion.div>
      <span className="text-[10px] font-medium text-slate-500 text-center leading-tight w-20 line-clamp-2">
        {item.title}
      </span>
    </motion.div>
  )
}

function StageSection({ stage, items, stageIndex }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-50px' }}
      variants={{
        hidden: { opacity: 0, y: 28 },
        show: { opacity: 1, y: 0, transition: { duration: 0.35, staggerChildren: 0.07, delayChildren: 0.1 } },
      }}
      className="rounded-2xl border px-5 py-5 sm:px-6 sm:py-6"
      style={{ borderColor: `${stage.hex}33`, background: `${stage.hex}08` }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <span className={`text-[10px] font-black font-mono tracking-widest ${stage.text} opacity-35`}>
          {String(stageIndex + 1).padStart(2, '0')}
        </span>
        <h2 className={`text-xs font-bold uppercase tracking-[0.16em] ${stage.text}`}>{stage.label}</h2>
        <div className="flex-1 h-px" style={{ background: `${stage.hex}22` }} />
        <span className={`text-[10px] rounded-full px-2 py-0.5 font-medium ${stage.badge}`}>
          {items.length} topic{items.length !== 1 ? 's' : ''}
        </span>
      </div>
      <p className="text-[11px] text-slate-500 leading-relaxed mb-5 max-w-lg">{stage.description}</p>

      {/* Nodes */}
      <motion.div variants={nodeContainerVariants} className="flex flex-wrap justify-center gap-3 sm:gap-5">
        {items.map((item) => (
          <ConceptNode key={item.id} item={item} stage={stage} />
        ))}
      </motion.div>
    </motion.div>
  )
}

function DesignNode({ item, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: index * 0.06, type: 'spring', stiffness: 260, damping: 22 }}
      whileHover={{ y: -4 }}
    >
      <Link
        to={item.path}
        className="group flex items-center gap-3 rounded-xl border border-indigo-500/25 bg-indigo-500/[0.06] hover:bg-indigo-500/[0.11] hover:border-indigo-500/45 p-3.5 transition-colors h-full"
      >
        <div className="w-10 h-10 rounded-xl border border-indigo-500/30 bg-indigo-500/10 flex items-center justify-center shrink-0">
          <SvgBlueprint c={DESIGN_HEX} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white leading-snug group-hover:text-indigo-200 transition-colors">
            {item.title}
          </p>
          {item.tagline && (
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed line-clamp-1">{item.tagline}</p>
          )}
        </div>
      </Link>
    </motion.div>
  )
}

function DesignsTier({ designs }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl border border-indigo-500/30 px-5 py-5 sm:px-6 sm:py-6"
      style={{ background: `${DESIGN_HEX}08` }}
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="text-[10px] font-black font-mono tracking-widest text-indigo-400 opacity-35">08</span>
        <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-400">System Designs</h2>
        <div className="flex-1 h-px bg-indigo-500/20" />
        <span className="text-[10px] rounded-full px-2 py-0.5 font-medium bg-indigo-500/15 text-indigo-300">
          {designs.length} designs
        </span>
      </div>
      <p className="text-[11px] text-slate-500 leading-relaxed mb-5 max-w-lg">
        Put it all together — end-to-end walkthroughs of real systems. Tackle these once you're confident with the concepts above.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {designs.map((item, i) => (
          <DesignNode key={item.id} item={item} index={i} />
        ))}
      </div>
    </motion.div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SystemDesignIndex() {
  const byId = useMemo(() => {
    const map = {}
    SYSTEM_DESIGN.forEach((item) => { map[item.id] = item })
    return map
  }, [])

  const designs = useMemo(() => SYSTEM_DESIGN.filter((i) => i.type === 'design'), [])

  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">System Design</h1>
        <p className="mt-2 text-slate-400 max-w-2xl">
          A structured learning path from first principles to full system walkthroughs.
          Follow the roadmap top-to-bottom — each stage builds on the last.
        </p>
      </div>

      {/* Roadmap */}
      <div className="space-y-1">
        {STAGES.map((stage, i) => {
          const items = stage.ids.map((id) => byId[id]).filter(Boolean)
          const nextHex = i < STAGES.length - 1 ? STAGES[i + 1].hex : DESIGN_HEX
          return (
            <div key={stage.id}>
              <StageSection stage={stage} items={items} stageIndex={i} />
              <StageConnector fromHex={stage.hex} toHex={nextHex} />
            </div>
          )
        })}
        <DesignsTier designs={designs} />
      </div>
    </div>
  )
}
