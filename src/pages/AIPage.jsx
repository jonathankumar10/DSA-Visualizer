import React, { Suspense } from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AI_ITEMS, AI_COLORS, AI_CATEGORY_LABELS, LIVE_CODING_AI_GUIDE } from '../constants/aiRegistry'

const AI_ANIMATIONS = import.meta.glob('../content/ai/*/Animation.jsx')

// Lazy components must be created once, at module scope — not during render.
const AI_LAZY_ANIMATIONS = Object.fromEntries(
  Object.entries(AI_ANIMATIONS).map(([key, loader]) => [key, React.lazy(loader)])
)

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
          {item.duration && (
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-medium text-slate-400">
              {item.duration}
            </span>
          )}
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
  if (item.category === 'live-coding') return <LiveCodingDetail item={item} c={c} />

  const AnimationComponent = AI_LAZY_ANIMATIONS[`../content/ai/${item.id}/Animation.jsx`] ?? null

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

function LiveCodingDetail({ item, c }) {
  return (
    <div className="space-y-6">
      {/* Core / Bonus | Skills / Angles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-5">
          <InfoPanel title="Core requirements" c={c}>
            <ol className="space-y-2.5">
              {item.core.map((req, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-300">
                  <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${c.badgeBg} ${c.text}`}>{i + 1}</span>
                  <span className="leading-relaxed">{req}</span>
                </li>
              ))}
            </ol>
          </InfoPanel>
          <InfoPanel title="Bonus features" c={c}>
            <ul className="space-y-2">
              {item.bonus.map((f, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-300">
                  <span className={`shrink-0 mt-0.5 font-bold ${c.text}`}>+</span>
                  <span className="leading-relaxed">{f}</span>
                </li>
              ))}
            </ul>
          </InfoPanel>
        </div>
        <div className="lg:sticky lg:top-20 space-y-5">
          <InfoPanel title="Skills tested" c={c}>
            <ul className="space-y-2">
              {item.skillsTested.map((s, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-300">
                  <span className={`shrink-0 mt-0.5 ${c.text}`}>◆</span>
                  <span className="leading-relaxed">{s}</span>
                </li>
              ))}
            </ul>
          </InfoPanel>
          <InfoPanel title="Interview angles" c={c}>
            <ul className="space-y-2">
              {item.interviewAngles.map((q, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-300">
                  <span className={`shrink-0 mt-0.5 font-bold ${c.text}`}>?</span>
                  <span className="leading-relaxed">{q}</span>
                </li>
              ))}
            </ul>
          </InfoPanel>
        </div>
      </div>

      {/* Interview approach */}
      {item.interviewApproach && (
        <InfoPanel title="How to run this interview" c={c}>
          <ol className="space-y-2.5">
            {item.interviewApproach.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-slate-300">
                <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${c.badgeBg} ${c.text}`}>{i + 1}</span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </InfoPanel>
      )}

      {/* Clarifying questions + Claude workflow */}
      {(item.clarifyingQuestions || item.claudeWorkflow) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {item.clarifyingQuestions && (
            <InfoPanel title="Clarifying questions to ask" c={c}>
              <ul className="space-y-2">
                {item.clarifyingQuestions.map((q, i) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-300">
                    <span className={`shrink-0 mt-0.5 font-bold ${c.text}`}>→</span>
                    <span className="leading-relaxed">{q}</span>
                  </li>
                ))}
              </ul>
            </InfoPanel>
          )}
          {item.claudeWorkflow && (
            <InfoPanel title="Claude workflow" c={c}>
              <ul className="space-y-2">
                {item.claudeWorkflow.map((tip, i) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-300">
                    <span className={`shrink-0 mt-0.5 font-bold ${c.text}`}>⌘</span>
                    <span className="leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            </InfoPanel>
          )}
        </div>
      )}

      {/* Starter CLAUDE.md */}
      {item.claudeMdContent && <ClaudeMdPanel item={item} c={c} />}

      {/* Shared AI tools guide */}
      <AIToolsGuide c={c} />
    </div>
  )
}

function ClaudeMdPanel({ item, c }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
      <div className={`border-b border-white/10 px-5 py-3 flex items-center justify-between ${c.bg}`}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${c.dot}`} />
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Starter CLAUDE.md</p>
        </div>
        <p className="text-[10px] text-slate-500">Drop in project root before prompting Claude</p>
      </div>
      <div className="overflow-auto max-h-96 scrollbar-thin">
        <pre className="p-5 text-xs font-mono text-slate-300 leading-relaxed whitespace-pre">{item.claudeMdContent}</pre>
      </div>
    </div>
  )
}

function AIToolsGuide({ c }) {
  const sections = [
    { key: 'claudeMd', label: 'Creating CLAUDE.md' },
    { key: 'planMode', label: 'Using Plan Mode' },
    { key: 'prompting', label: 'Prompting Effectively' },
  ]
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
      <div className={`border-b border-white/10 px-5 py-3 flex items-center gap-2 ${c.bg}`}>
        <div className={`w-2 h-2 rounded-full ${c.dot} animate-pulse`} />
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">AI tooling playbook</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-white/10">
        {sections.map(({ key, label }) => (
          <div key={key} className="p-5 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
            <ul className="space-y-2.5">
              {LIVE_CODING_AI_GUIDE[key].map((tip, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-slate-300">
                  <span className={`shrink-0 mt-0.5 ${c.text}`}>◆</span>
                  <span className="leading-relaxed">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
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

function InfoPanel({ title, children }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{title}</p>
      {children}
    </div>
  )
}
