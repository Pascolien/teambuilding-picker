import React, { useEffect, useMemo, useState } from "react";
import type { Activity } from "../types";
import {
  fetchActivities,
  addActivity as apiAdd,
  vote as apiVote,
} from "../lib/api";
import { makeSocket, type ServerMessage } from "../lib/ws";
import { ExternalLink, Trash2, CheckCircle2, RefreshCw } from "lucide-react";
import AddActivityButton from "../components/AddActivityButton";
export default function Poll() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [myVote, setMyVote] = useState<string | null>(() =>
    localStorage.getItem("tbp_myvote")
  );
  const [q, setQ] = useState("");
  const [wsStatus, setWsStatus] = useState<"connecting" | "connected">(
    "connecting"
  );
  useEffect(() => {
    fetchActivities().then(setActivities).catch(console.error);
    const close = makeSocket((msg: ServerMessage) => {
      if (msg.type === "activities") {
        setActivities(msg.payload);
        setWsStatus("connected");
      }
    });
    return () => close();
  }, []);
  useEffect(() => {
    if (myVote) localStorage.setItem("tbp_myvote", myVote);
    else localStorage.removeItem("tbp_myvote");
  }, [myVote]);
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return activities;
    return activities.filter((a) =>
      [a.title, a.description, a.tags?.join(" ")]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [activities, q]);
  const leader = useMemo(() => {
    if (!activities.length) return null;
    const max = Math.max(...activities.map((a) => a.votes));
    if (max <= 0) return null;
    const top = activities.filter((a) => a.votes === max);
    return { max, top };
  }, [activities]);
  async function castVote(id: string) {
    try {
      const updated = await apiVote(id, myVote);
      setActivities(updated);
      setMyVote(id);
    } catch {
      alert("Vote impossible.");
    }
  }
  function resetLocalChoice() {
    setMyVote(null);
  }
  function removeLocal(id: string) {
    setActivities((prev) => prev.filter((a) => a.id !== id));
    if (myVote === id) setMyVote(null);
  }
  async function addActivity(input: Omit<Activity, "id" | "votes">) {
    try {
      await apiAdd(input);
    } catch {
      alert("Ajout impossible.");
    }
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <input
          className="flex-1 px-3 py-2 rounded border"
          placeholder="Rechercher (titre, tags, description)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <AddActivityButton onAdd={addActivity} />
        <button
          onClick={resetLocalChoice}
          className="px-3 py-2 rounded border bg-white hover:bg-slate-50 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Remettre mon choix à zéro
        </button>
        <span className="px-3 py-2 rounded text-xs bg-slate-100">
          {wsStatus === "connected" ? "Temps réel actif" : "Connexion..."}
        </span>
      </div>
      {leader && (
        <div className="p-4 rounded border bg-amber-50 border-amber-200 flex items-center gap-3">
          <span className="font-medium">En tête :</span>
          <div className="flex flex-wrap gap-2">
            {leader.top.map((a) => (
              <span
                key={a.id}
                className="px-2 py-1 rounded bg-white border text-sm"
              >
                {a.title} — {a.votes} vote{a.votes > 1 ? "s" : ""}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((a) => (
          <div key={a.id} className="h-full rounded border bg-white">
            <div className="p-4 flex items-start justify-between gap-3">
              <div className="text-lg font-semibold leading-tight">
                {a.title}
              </div>
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-sm font-medium">
                {a.votes} 🗳️
              </span>
            </div>
            <div className="px-4 pb-4 space-y-4">
              {a.description && (
                <p className="text-sm text-slate-700">{a.description}</p>
              )}
              {a.tags && a.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
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
                  onClick={() => castVote(a.id)}
                  className={`px-3 py-2 rounded border ${
                    myVote === a.id
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-white hover:bg-slate-50"
                  }`}
                  title={
                    myVote === a.id
                      ? "Votre vote actuel"
                      : "Voter pour cette activité"
                  }
                >
                  {myVote === a.id ? (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Mon choix
                    </span>
                  ) : (
                    "Voter"
                  )}
                </button>
                <button
                  onClick={() => removeLocal(a.id)}
                  className="px-2 py-2 rounded hover:bg-red-50"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="text-center text-slate-500 mt-12">
          Aucune activité ne correspond à la recherche.
        </p>
      )}
    </div>
  );
}
