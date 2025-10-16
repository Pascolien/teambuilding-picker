import React from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { Trophy, Share2, Radio } from 'lucide-react'

export default function App() {
  const loc = useLocation()
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 backdrop-blur bg-white/80 border-b">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <Trophy className="w-6 h-6" />
            <h1 className="text-2xl font-bold">Team Building – R&D Qoia</h1>
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <Link className={`px-3 py-1 rounded ${loc.pathname === '/' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'}`} to="/">Sondage</Link>
            <Link className={`px-3 py-1 rounded ${loc.pathname.startsWith('/results') ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'}`} to="/results">
              <Share2 className="inline w-4 h-4 mr-1"/> Résultats
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
      <footer className="mx-auto max-w-6xl px-4 py-10 text-center text-xs text-slate-500">
        <Radio className="inline w-4 h-4 mr-1"/> Node • WebSocket • React • Tailwind
      </footer>
    </div>
  )
}
