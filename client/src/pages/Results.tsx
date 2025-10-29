import React, { useEffect, useState } from "react"
import type { Activity } from "../types"
import { listActivities } from "../lib/apiSupabase"
import { supabase } from "../lib/supabase"
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js"

export default function Results() {
  const [activities, setActivities] = useState<Activity[] | null>(null)

  useEffect(() => {
    let alive = true

    async function init() {
      // 1️⃣ Charger la liste initiale
      const data = await listActivities()
      if (alive) setActivities(data)

      // 2️⃣ Écouter les mises à jour temps réel
      const channel = supabase
        .channel("realtime:activities:results")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "activities" },
          (payload: RealtimePostgresChangesPayload<Activity>) => {
            setActivities((prev) => {
              if (!prev) return prev
              const row = (payload.new ?? payload.old) as Activity
              if (!row) return prev

              if (payload.eventType === "INSERT") return [...prev, row]
              if (payload.eventType === "UPDATE")
                return prev.map((a) => (a.id === row.id ? row : a))
              if (payload.eventType === "DELETE")
                return prev.filter((a) => a.id !== row.id)
              return prev
            })
          }
        )
        .subscribe()

      return () => supabase.removeChannel(channel)
    }

    init()
    return () => {
      alive = false
    }
  }, [])

  if (!activities)
    return (
      <p className="text-center text-slate-600">
        Chargement des résultats en direct…
      </p>
    )

  // 🧮 Tri du plus voté au moins voté
  const sorted = [...activities].sort(
    (a, b) => (b.votes_count ?? 0) - (a.votes_count ?? 0)
  )
  const totalVotes = sorted.reduce(
    (acc, a) => acc + (a.votes_count ?? 0),
    0
  )

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-xl font-semibold mb-1">Résultats (temps réel)</h2>
      <p className="text-sm text-slate-600 mb-6">
        {totalVotes} vote{totalVotes > 1 ? "s" : ""}
      </p>

      <ol className="space-y-3">
        {sorted.map((a, idx) => (
          <li key={a.id} className="rounded border bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">
                  {idx + 1}. {a.title}
                </div>
                {a.description && (
                  <p className="text-sm text-slate-700">{a.description}</p>
                )}
                {a.tags && a.tags.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {a.tags.map((t, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded border text-xs bg-slate-50"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="shrink-0 text-right">
                <div className="text-2xl font-bold">{a.votes_count ?? 0}</div>
                <div className="text-xs text-slate-500">
                  vote{(a.votes_count ?? 0) > 1 ? "s" : ""}
                </div>
                <a
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm underline"
                >
                  voir
                </a>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
