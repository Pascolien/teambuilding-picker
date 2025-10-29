// src/App.tsx
import React from "react"
import { Outlet, NavLink } from "react-router-dom"

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏆</span>
            <h1 className="text-lg sm:text-xl font-semibold">
              Team Building – <span className="text-slate-700">R&amp;D Qoia</span>
            </h1>
          </div>
          <nav className="flex items-center gap-2">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-3 py-1.5 rounded ${isActive ? "bg-slate-900 text-white" : "border bg-white hover:bg-slate-50"}`
              }
            >
              Sondage
            </NavLink>
            <NavLink
              to="/results"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded ${isActive ? "bg-slate-900 text-white" : "border bg-white hover:bg-slate-50"}`
              }
            >
              Résultats
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
