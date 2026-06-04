import React, { Suspense, useMemo } from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AI_ITEMS, AI_COLORS, AI_CATEGORY_LABELS } from '../constants/aiRegistry'

const AI_ANIMATIONS = import.meta.glob('../content/ai/*/Animation.jsx')

export default function AIPage() {
  const { id } = useParams()
  const item   = AI_ITEMS.find((i) => i.id === id)

  if (!item) return <Navigate to="/ai" replace />

  const c = AI_COLORS[item.color]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-8"
    >
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500">
        <Link to="/" className="hover:text-slate-300 transition-colors">Home</Link>
        <span>/</span>
        <Link to="/ai" className="hover:text-slate-300 transition-colors">AI</Link>
        <span>/</span>
        <span className="text-slate-300">{item.title}</span>
      </nav>

      {/* Hero */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{item.title}</h1>
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${c.badgeBg} ${c.badgeBorder} ${c.text}`}>
            {AI_CATEGORY_LABELS[item.category]}
          </span>
        </div>
        <p className={`text-base font-medium ${c.text}`}>{item.tagline}</p>
      </div>

      {/* Description */}
      <div className={`rounded-xl border px-5 py-4 ${c.bg} ${c.border}`}>
        <p className="text-sm text-slate-300 leading-relaxed">{item.description}</p>
      </div>

      <AIDetail item={item} c={c} />
    </motion.div>
  )
}

function AIDetail({ item, c }) {
  const AnimationComponent = useMemo(() => {
    const loader = AI_ANIMATIONS[`../content/ai/${item.id}/Animation.jsx`]
    return loader ? React.lazy(loader) : null
  }, [item.id])

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* Left: text panels */}
        <div className="space-y-5">
          <InfoPanel title="How it works" c={c}>
            <ol className="space-y-2.5">
              {item.howItWorks.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-300">
                  <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${c.badgeBg} ${c.text}`}>{i + 1}</span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </InfoPanel>

          <InfoPanel title="Interview angles" c={c}>
            <ul className="space-y-2">
              {item.interviewAngles.map((q, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-300">
                  <span className={`shrink-0 mt-0.5 ${c.text} font-bold`}>?</span>
                  <span className="leading-relaxed">{q}</span>
                </li>
              ))}
            </ul>
          </InfoPanel>
        </div>

        {/* Right: animation or key points */}
        <div className="lg:sticky lg:top-20 space-y-5">
          {AnimationComponent ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
              <div className={`border-b border-white/10 px-5 py-3 flex items-center gap-2 ${c.bg}`}>
                <div className={`w-2 h-2 rounded-full ${c.dot} animate-pulse`} />
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Interactive diagram
                </p>
              </div>
              <div className="p-4">
                <Suspense fallback={<div className="py-16 text-center text-slate-500 text-sm">Loading…</div>}>
                  <AnimationComponent />
                </Suspense>
              </div>
            </div>
          ) : (
            <KeyPointsPanel item={item} c={c} />
          )}
        </div>
      </div>

      {/* Key points — always visible below the two-column grid */}
      {AnimationComponent && <KeyPointsPanel item={item} c={c} />}
    </div>
  )
}

function KeyPointsPanel({ item, c }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
      <div className={`border-b border-white/10 px-5 py-3 flex items-center gap-2 ${c.bg}`}>
        <div className={`w-2 h-2 rounded-full ${c.dot}`} />
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Key takeaways</p>
      </div>
      <div className="p-5 space-y-4">
        {item.keyPoints.map((point, i) => (
          <div key={i} className="flex gap-3 text-sm text-slate-300">
            <span className={`shrink-0 mt-0.5 ${c.text}`}>◆</span>
            <span className="leading-relaxed">{point}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function InfoPanel({ title, c, children }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{title}</p>
      {children}
    </div>
  )
}
