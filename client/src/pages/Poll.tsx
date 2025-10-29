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

  // id client anonyme (persisté par navigateur)
  const [clientId] = useState(() => {
    const k = "tb_client_id"
    const v = localStorage.getItem(k)
    if (v) return v
    const n = nanoid()
    localStorage.setItem(k, n)
    return n
  })

  // multi-choix : identifiants des activités sélectionnées par CE client
  const [myVotes, setMyVotes] = useState<Set<string>>(new Set())

  useEffect(() => {
    let alive = true

    ;(async () => {
      // 1) chargement initial
      const list = (await listActivities()) as Row[]
      if (!alive) return
      setActivities(list)

      // 2) mes votes
      const mine = await listMyVotes(clientId)
      if (alive) setMyVotes(new Set(mine))

      // 3) realtime activities (INSERT/UPDATE/DELETE)
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

      // 4) realtime sur MES votes (pour surligner “Mon choix” en live)
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

      // 5) filet de sécurité : si votes changent, on recharge la liste
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

  // recherche
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return activities
    return activities.filter((a) =>
      [a.title, a.description, a.tags?.join(" ")].filter(Boolean).join(" ").toLowerCase().includes(query)
    )
  }, [activities, q])

  // leader
  const leader = useMemo(() => {
    if (!activities.length) return null
    const max = Math.max(...activities.map((a) => a.votes_count ?? 0))
    if (max <= 0) return null
    const top = activities.filter((a) => (a.votes_count ?? 0) === max)
    return { max, top }
  }, [activities])

  // toggle multi-choix
  async function onToggle(id: string) {
    const selected = myVotes.has(id) // true => déjà voté => DELETE
    await toggleVote(id, clientId, selected)
    setMyVotes((prev) => {
      const copy = new Set(prev)
      if (selected) copy.delete(id)
      else copy.add(id)
      return copy
    })
  }

  async function removeActivity(id: string) {
    try {
      await deleteActivity(id) // RLS: policy DELETE sur activities requise
      // UI mise à jour par Realtime (DELETE activities)
    } catch (e) {
      console.error(e)
      alert("Suppression impossible.")
    }
  }

  async function addActivity(input: Omit<Activity, "id" | "votes_count" | "created_at">) {
    try {
      await apiAdd(input) // UI mise à jour par Realtime (INSERT activities)
    } catch (e) {
      console.error(e)
      alert("Ajout impossible.")
    }
  }

  async function resetMyVotes() {
    const ids = Array.from(myVotes)
    await Promise.all(ids.map((id) => toggleVote(id, clientId, true)))
    setMyVotes(new Set())
  }

  return (
    <div className="space-y-6">
      {/* Bandeau état temps réel + actions hautes */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <span className="px-2 py-1 rounded text-xs bg-slate-100">
          {wsStatus === "connected" ? "Temps réel actif" : "Connexion..."}
        </span>

        <div className="flex-1" />

        <input
          className="w-full md:w-96 px-3 py-2 rounded border"
          placeholder="Rechercher (titre, tags, description)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <AddActivityButton onAdd={addActivity} />
        <button
          onClick={resetMyVotes}
          className="px-3 py-2 rounded border bg-white hover:bg-slate-50 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Retirer tous mes votes
        </button>
      </div>

      {/* Répartition en temps réel (barre empilée + légende) */}
      <VoteProgressBar items={activities} />

      {/* En tête (pills) */}
      {leader && (
        <div className="p-4 rounded border bg-amber-50 border-amber-200">
          <div className="font-semibold mb-2">En tête :</div>
          <div className="flex flex-wrap gap-2">
            {leader.top.map((a) => (
              <span key={a.id} className="px-2 py-1 rounded bg-white border text-sm">
                {a.title} — {(a.votes_count ?? 0)} votes
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Grille d’activités */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((a) => {
          const selected = myVotes.has(a.id)
          return (
            <div key={a.id} className="relative h-full rounded border bg-white">
              {/* Badge compact en haut-droite */}
              <div className="absolute top-2 right-3 text-xs">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border">
                  {(a.votes_count ?? 0)} <span aria-hidden>🗳️</span>
                </span>
              </div>

              <div className="p-4 flex items-start justify-between gap-3">
                <div className="text-lg font-semibold leading-tight">{a.title}</div>
              </div>

              <div className="px-4 pb-4 space-y-4">
                {a.description && <p className="text-sm text-slate-700">{a.description}</p>}

                {a.tags && a.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {a.tags.map((t, i) => (
                      <span key={i} className="px-2 py-0.5 rounded border text-xs bg-slate-50">
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <a
                    className="flex-1 px-3 py-2 rounded border bg-white hover:bg-slate-50 flex items-center gap-2"
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink className="w-4 h-4" /> Voir l'activité
                  </a>

                  <button
                    onClick={() => onToggle(a.id)}
                    className={`px-3 py-2 rounded border ${
                      selected ? "bg-emerald-600 text-white border-emerald-600" : "bg-white hover:bg-slate-50"
                    }`}
                    title={selected ? "Retirer mon vote" : "Ajouter mon vote"}
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
                    className="px-2 py-2 rounded hover:bg-red-50"
                    title="Supprimer (DB)"
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
        <p className="text-center text-slate-500 mt-12">Aucune activité ne correspond à la recherche.</p>
      )}
    </div>
  )
}
