import React, { Suspense, useMemo } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { SYSTEM_DESIGN, TYPE_COLOR, TYPE_LABEL } from '../constants/systemDesignRegistry'

// Vite resolves this glob at build time — covers both concepts and designs.
// To add a new topic: drop Diagram.jsx in its folder. Done.
const DIAGRAMS = import.meta.glob('../content/system-design/**/Diagram.jsx')

export default function SystemDesignPage() {
  const { id }  = useParams()
  const item    = SYSTEM_DESIGN.find((s) => s.id === id)

  const DiagramComponent = useMemo(() => {
    if (!item) return null
    // type='concept' → 'concepts', type='design' → 'designs'
    const folder = `${item.type}s`
    const loader = DIAGRAMS[`../content/system-design/${folder}/${id}/Diagram.jsx`]
    return loader ? React.lazy(loader) : null
  }, [id, item])

  if (!item) return <Navigate to="/system-design" replace />

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500">
        <Link to="/" className="hover:text-slate-300 transition-colors">Home</Link>
        <span>/</span>
        <Link to="/system-design" className="hover:text-slate-300 transition-colors">System Design</Link>
        <span>/</span>
        <span className="text-slate-300">{item.title}</span>
      </nav>

      {/* Title + type badge */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-white">{item.title}</h1>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${TYPE_COLOR[item.type]}`}>
          {TYPE_LABEL[item.type]}
        </span>
      </div>

      {/* Description + metaphor */}
      <div className="space-y-3">
        {item.description && (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] px-5 py-4 space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Overview</p>
            <p className="text-sm text-slate-300 leading-relaxed">{item.description}</p>
          </div>
        )}

        {item.metaphor && (
          <div className="flex gap-3 rounded-xl border border-violet-500/20 bg-violet-500/[0.05] px-5 py-4">
            <div className="mt-0.5 w-0.5 shrink-0 self-stretch rounded-full bg-violet-500/50" />
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-400">
                Mental model
              </p>
              <p className="text-sm text-slate-300 leading-relaxed">{item.metaphor}</p>
            </div>
          </div>
        )}
      </div>

      {/* Diagram */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3 sm:p-5">
        <Suspense fallback={
          <div className="py-20 text-center text-slate-500 text-sm">Loading diagram…</div>
        }>
          {DiagramComponent
            ? <DiagramComponent />
            : <p className="text-slate-500 text-center py-10">Diagram coming soon.</p>
          }
        </Suspense>
      </div>

      {/* Key points */}
      {item.keyPoints?.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] px-5 py-4 space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Key takeaways</p>
          <ul className="space-y-2">
            {item.keyPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                <span className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-violet-500/20 border border-violet-500/40 flex items-center justify-center text-[9px] text-violet-400 font-bold">
                  {i + 1}
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tags */}
      {item.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-white/5 border border-white/10 px-2.5 py-1 text-xs text-slate-400"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

    </motion.div>
  )
}
