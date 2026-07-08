import { useRef, useEffect, Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import ChatBot from '../ui/ChatBot'

function PageFallback() {
  return <div className="py-24 text-center text-slate-500 text-sm">Loading…</div>
}

export default function Layout() {
  const glowRef = useRef(null)

  useEffect(() => {
    const move = (e) => {
      if (!glowRef.current) return
      glowRef.current.style.left = e.clientX + 'px'
      glowRef.current.style.top  = e.clientY + 'px'
    }
    window.addEventListener('mousemove', move, { passive: true })
    return () => window.removeEventListener('mousemove', move)
  }, [])

  return (
    <div className="min-h-screen bg-[#09090b] text-slate-100">
      <div ref={glowRef} className="cursor-glow" />
      <Navbar />
      <main className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <ChatBot />
    </div>
  )
}
