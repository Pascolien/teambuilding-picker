import React, { useEffect, useMemo, useState } from "react"
import type { Activity } from "../types"
import {
  listActivities,
  addActivity as apiAdd,
  toggleVote,
  listMyVotes,
  deleteActivity,
} from "../lib/apiSupabase"
import { supabase } from "../lib/supabase"
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js"
import { ExternalLink, Trash2, CheckCircle2, RefreshCw } from "lucide-react"
import AddActivityButton from "../components/AddActivityButton"
import VoteProgressBar from "../components/VoteProgressBar"
import { nanoid } from "nanoid"

type Row = Activity & { votes_count: number }

export default function Poll() {
  const [activities, setActivities] = useState<Row[]>([])
  const [q, setQ] = useState("")
  const [wsStatus, setWsStatus] = useState<"connecting" | "connected">("connecting")

  // id client anonyme persistant
  const [clientId] = useState(() => {
    const key = "tb_client_id"
    const v = localStorage.getItem(key)
    if (v) return v
    const id = nanoid()
    localStorage.setItem(key, id)
    return id
  })

  // ensemble des votes de CE client
  const [myVotes, setMyVotes] = useState<Set<string>>(new Set())

  useEffect(() => {
    let alive = true

    ;(async () => {
      // 1️⃣ Charger la liste initiale
      const list = (await listActivities()) as Row[]
      if (!alive) return
      setActivities(list)

      // 2️⃣ Récupérer mes votes
      const mine = await listMyVotes(clientId)
      if (alive) setMyVotes(new Set(mine))

      // 3️⃣ Écouter les changements temps réel sur activities
      const chA = supabase
        .channel("realtime:activities")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "activities" },
          (payload: RealtimePostgresChangesPayload<Row>) => {
            setActivities((prev) => {
              const row = (payload.new ?? payload.old) as Row
              if (!row) return prev
              if (payload.eventType === "INSERT") return [...prev, row]
              if (payload.eventType === "UPDATE") return prev.map((a) => (a.id === row.id ? row : a))
              if (payload.eventType === "DELETE") return prev.filter((a) => a.id !== row.id)
              return prev
            })
            setWsStatus("connected")
          }
        )
        .subscribe()

      // 4️⃣ Écouter MES votes pour mise à jour locale
      const chV = supabase
        .channel("realtime:votes:mine")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "votes",
            filter: `client_id=eq.${clientId}`,
          },
          (payload: RealtimePostgresChangesPayload<{ activity_id: string }>) => {
            const row = (payload.new ?? payload.old) as { activity_id: string } | null
            if (!row) return
            setMyVotes((prev) => {
              const copy = new Set(prev)
              if (payload.eventType === "INSERT") copy.add(row.activity_id)
              if (payload.eventType === "DELETE") copy.delete(row.activity_id)
              return copy
            })
            setWsStatus("connected")
          }
        )
        .subscribe()

      // 5️⃣ Rafraîchir automatiquement les compteurs de votes
      const chVotesBump = supabase
        .channel("realtime:votes:bump")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "votes" },
          async () => {
            const list = (await listActivities()) as Row[]
            setActivities(list)
            setWsStatus("connected")
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(chA)
        supabase.removeChannel(chV)
        supabase.removeChannel(chVotesBump)
      }
    })()

    return () => {
      alive = false
    }
  }, [clientId])

  // 🔍 Recherche filtrée
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return activities
    return activities.filter((a) =>
      [a.title, a.description, a.tags?.join(" ")]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    )
  }, [activities, q])

  // 🏆 Calcul des leaders
  const leader = useMemo(() => {
    if (!activities.length) return null
    const max = Math.max(...activities.map((a) => a.votes_count ?? 0))
    if (max <= 0) return null
    const top = activities.filter((a) => (a.votes_count ?? 0) === max)
    return { max, top }
  }, [activities])

  // 🗳️ Voter / Retirer un vote
  async function onToggle(id: string) {
    const selected = myVotes.has(id)
    await toggleVote(id, clientId, selected)
    setMyVotes((prev) => {
      const copy = new Set(prev)
      if (selected) copy.delete(id)
      else copy.add(id)
      return copy
    })
  }

  // 🗑️ Supprimer une activité
  async function removeActivity(id: string) {
    try {
      await deleteActivity(id)
    } catch (e) {
      console.error(e)
      alert("Suppression impossible.")
    }
  }

  // ➕ Ajouter une activité
  async function addActivity(input: Omit<Activity, "id" | "votes_count" | "created_at">) {
    try {
      await apiAdd(input)
    } catch (e) {
      console.error(e)
      alert("Ajout impossible.")
    }
  }

  // 🔄 Réinitialiser mes votes
  async function resetMyVotes() {
    const ids = Array.from(myVotes)
    await Promise.all(ids.map((id) => toggleVote(id, clientId, true)))
    setMyVotes(new Set())
  }

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 space-y-6">
      {/* 🔌 Barre d’état + recherche + actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-wrap">
        <span className="px-2 py-1 rounded text-xs bg-slate-100 self-start sm:self-auto">
          {wsStatus === "connected" ? "✅ Temps réel actif" : "⏳ Connexion..."}
        </span>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <input
            className="flex-1 px-3 py-2 rounded border text-sm"
            placeholder="Rechercher une activité..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <AddActivityButton onAdd={addActivity} />
          <button
            onClick={resetMyVotes}
            className="px-3 py-2 rounded border bg-white hover:bg-slate-50 flex items-center gap-2 text-sm"
          >
            <RefreshCw className="w-4 h-4" /> Retirer mes votes
          </button>
        </div>
      </div>

      {/* 📊 Barre de progression temps réel */}
      <VoteProgressBar items={activities} />

      {/* 🥇 En-tête : activités leaders */}
      {leader && (
        <div className="p-3 sm:p-4 rounded border bg-amber-50 border-amber-200">
          <div className="font-semibold mb-2 text-sm sm:text-base">En tête :</div>
          <div className="flex flex-wrap gap-2">
            {leader.top.map((a) => (
              <span key={a.id} className="px-2 py-1 rounded bg-white border text-xs sm:text-sm">
                {a.title} — {(a.votes_count ?? 0)} votes
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 🧩 Grille responsive d’activités */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((a) => {
          const selected = myVotes.has(a.id)
          return (
            <div key={a.id} className="relative h-full rounded border bg-white shadow-sm hover:shadow-md transition">
              {/* Badge compteur */}
              <div className="absolute top-2 right-3 text-[11px] sm:text-xs">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 border">
                  {(a.votes_count ?? 0)} 🗳️
                </span>
              </div>

              <div className="p-3 sm:p-4">
                <div className="text-base sm:text-lg font-semibold mb-2">{a.title}</div>
                {a.description && (
                  <p className="text-sm text-slate-700 line-clamp-3">{a.description}</p>
                )}

                {Array.isArray(a.tags) && a.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {a.tags.map((t, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded border text-[11px] sm:text-xs bg-slate-50"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex flex-col sm:flex-row gap-2">
                  <a
                    className="flex-1 px-3 py-2 rounded border bg-white hover:bg-slate-50 flex items-center justify-center sm:justify-start gap-2 text-sm"
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink className="w-4 h-4" /> Voir
                  </a>

                  <button
                    onClick={() => onToggle(a.id)}
                    className={`px-3 py-2 rounded border text-sm ${
                      selected ? "bg-emerald-600 text-white border-emerald-600" : "bg-white hover:bg-slate-50"
                    }`}
                  >
                    {selected ? (
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Mon choix
                      </span>
                    ) : (
                      "Voter"
                    )}
                  </button>

                  <button
                    onClick={() => removeActivity(a.id)}
                    className="px-3 py-2 rounded border text-sm hover:bg-red-50"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-slate-500 mt-12 text-sm">
          Aucune activité ne correspond à la recherche.
        </p>
      )}
    </div>
  )
}
