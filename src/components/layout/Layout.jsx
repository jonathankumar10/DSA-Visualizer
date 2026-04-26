import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import ChatBot from '../ui/ChatBot'

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-10">
        <Outlet />
      </main>
      <ChatBot />
    </div>
  )
}
