import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { getFunctions, httpsCallable } from 'firebase/functions'
import app from '../../lib/firebase'

// Stable per-browser UUID for rate limiting (never tied to auth)
function getUid() {
  const key = 'algviz-uid'
  let uid = localStorage.getItem(key)
  if (!uid) {
    uid = crypto.randomUUID()
    localStorage.setItem(key, uid)
  }
  return uid
}

const functions = getFunctions(app)
const chatFn   = httpsCallable(functions, 'chat')

// ── Typing indicator ──────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-violet-400"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  )
}

// ── Lightweight markdown renderer (bold + inline code only) ──────────────────

function renderMarkdown(text) {
  // Split on **bold** and `code` tokens
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="rounded bg-white/10 px-1 py-0.5 text-[11px] font-mono">{part.slice(1, -1)}</code>
    }
    return part
  })
}

// ── Path detection ────────────────────────────────────────────────────────────

const PATH_RE = /\/(algorithms|system-design)\/[\w-]+/g

function extractPaths(text) {
  return [...new Set(text.match(PATH_RE) || [])]
}

function pathLabel(path) {
  const slug = path.split('/').pop().replace(/-/g, ' ')
  return slug.replace(/\b\w/g, (c) => c.toUpperCase())
}

// ── Message bubble ────────────────────────────────────────────────────────────

function Message({ role, content, onLinkClick }) {
  const isUser = role === 'user'
  const paths  = isUser ? [] : extractPaths(content)

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} gap-1.5`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-violet-600 text-white rounded-br-sm'
            : 'bg-slate-800 text-slate-200 border-l-2 border-violet-500/50 rounded-bl-sm'
        }`}
      >
        {isUser ? content : renderMarkdown(content)}
      </div>

      {paths.length > 0 && (
        <div className="flex flex-wrap gap-1.5 max-w-[85%]">
          {paths.map((path) => (
            <Link
              key={path}
              to={path}
              onClick={onLinkClick}
              className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600/20 border border-violet-500/40 hover:bg-violet-600/35 hover:border-violet-500/70 px-3 py-1 text-xs font-medium text-violet-300 transition-colors"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              {pathLabel(path)}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ChatBot() {
  const [isOpen,    setIsOpen]    = useState(false)
  const [messages,  setMessages]  = useState([])
  const [input,     setInput]     = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)
  const uid = useRef(getUid())

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [isOpen])

  async function send() {
    const text = input.trim()
    if (!text || isLoading) return

    const userMsg = { role: 'user', content: text }
    const next    = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setIsLoading(true)

    try {
      const { data } = await chatFn({ messages: next, uid: uid.current })

      if (data.error === 'RATE_LIMITED') {
        setMessages((m) => [
          ...m,
          {
            role: 'assistant',
            content: "You've reached today's 10-message limit. Check back tomorrow!",
          },
        ])
      } else if (data.error) {
        setMessages((m) => [
          ...m,
          {
            role: 'assistant',
            content: "Sorry, something went wrong. Try again in a moment.",
          },
        ])
      } else {
        setMessages((m) => [...m, { role: 'assistant', content: data.reply }])
      }
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: "Couldn't reach the assistant right now. Check your connection and try again.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <>
      {/* ── Chat panel ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{   opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            className="fixed bottom-20 right-6 z-50 flex flex-col w-[360px] h-[500px] rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/8 bg-slate-900/90 shrink-0">
              <motion.span
                className="w-2 h-2 rounded-full bg-violet-400"
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-sm font-semibold text-white flex-1">AlgoViz Assistant</span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-500 hover:text-slate-200 transition-colors"
                aria-label="Close chat"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6"  y2="18"/>
                  <line x1="6"  y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Message list */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4">
                  <div className="w-12 h-12 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-2xl">
                    🤖
                  </div>
                  <p className="text-sm font-medium text-slate-300">Ask me anything about DSA or System Design</p>
                  <p className="text-xs text-slate-500">I can explain concepts, suggest what to learn next, and point you to the right visualizer.</p>
                </div>
              )}

              {messages.map((m, i) => (
                <Message key={i} role={m.role} content={m.content} onLinkClick={() => setIsOpen(false)} />
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 border-l-2 border-violet-500/50 rounded-2xl rounded-bl-sm">
                    <TypingDots />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input row */}
            <div className="shrink-0 px-3 pb-3 pt-2 border-t border-white/8">
              <div className="flex items-center gap-2 bg-slate-800 rounded-xl border border-white/8 pr-1.5 pl-4 py-1.5">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKey}
                  placeholder="Ask about algorithms, patterns…"
                  disabled={isLoading}
                  className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 outline-none disabled:opacity-50"
                />
                <button
                  onClick={send}
                  disabled={!input.trim() || isLoading}
                  className="shrink-0 w-8 h-8 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                  aria-label="Send message"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bubble trigger ───────────────────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Pulse ring — only shows when closed */}
        {!isOpen && (
          <motion.span
            className="absolute inset-0 rounded-full bg-violet-500/30"
            animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
        <motion.button
          onClick={() => setIsOpen((o) => !o)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          className="relative w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-900/40 flex items-center justify-center"
          aria-label={isOpen ? 'Close assistant' : 'Open assistant'}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.svg
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0,   opacity: 1 }}
                exit={{   rotate: 90,  opacity: 0 }}
                transition={{ duration: 0.18 }}
                width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6"  y2="18"/>
                <line x1="6"  y1="6" x2="18" y2="18"/>
              </motion.svg>
            ) : (
              <motion.svg
                key="chat"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0,  opacity: 1 }}
                exit={{   rotate: -90, opacity: 0 }}
                transition={{ duration: 0.18 }}
                width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </motion.svg>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </>
  )
}
