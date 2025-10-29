import React, { useMemo } from "react"
import type { Activity } from "../types"

const COLORS = [
  "bg-emerald-600","bg-indigo-600","bg-amber-500","bg-rose-600",
  "bg-cyan-600","bg-violet-600","bg-sky-600","bg-lime-600",
]

export default function VoteProgressBar({ items }: { items: Activity[] }) {
  // ordre stable pour éviter que les couleurs ne changent à chaque update
  const stable = useMemo(
    () => [...items].sort((a, b) => a.id.localeCompare(b.id)),
    [items]
  )

  const totals = stable.map(a => a.votes_count ?? 0)
  const total = totals.reduce((s, n) => s + n, 0)

  if (stable.length === 0) return null

  return (
    <div className="space-y-2">
      <div
        className="w-full h-4 rounded bg-slate-200 overflow-hidden"
        role="img"
        aria-label={`Répartition des ${total} votes`}
      >
        {stable.map((a, idx) => {
          const v = a.votes_count ?? 0
          const pct = total > 0 ? (v / total) * 100 : 0
          if (pct <= 0) return null
          return (
            <div
              key={a.id}
              className={`${COLORS[idx % COLORS.length]} h-full transition-all`}
              style={{
                // petite largeur mini pour visibilité
                width: `${Math.max(pct, 0.8)}%`,
              }}
              title={`${a.title}: ${v} vote${v > 1 ? "s" : ""} (${pct.toFixed(1)}%)`}
            />
          )
        })}
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <span className="text-slate-600">
          Total: <strong>{total}</strong> vote{total > 1 ? "s" : ""}
        </span>
        {stable.map((a, idx) => {
          const v = a.votes_count ?? 0
          const pct = total > 0 ? (v / total) * 100 : 0
          return (
            <span key={a.id} className="inline-flex items-center gap-2">
              <span className={`inline-block w-3 h-3 rounded ${COLORS[idx % COLORS.length]}`} />
              <span className="text-slate-700">
                {a.title} <span className="text-slate-500">({v} – {pct.toFixed(0)}%)</span>
              </span>
            </span>
          )
        })}
      </div>
    </div>
  )
}
