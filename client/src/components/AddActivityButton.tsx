import React, { useState } from "react"
import type { Activity } from "../types"
import { Plus, Link as LinkIcon } from "lucide-react"

export default function AddActivityButton({
  onAdd,
}: { onAdd: (a: Omit<Activity, "id" | "votes_count" | "created_at">) => void }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [description, setDescription] = useState("")
  const [tags, setTags] = useState("")

  function submit() {
    if (!title.trim() || !url.trim()) return alert("Titre et lien sont requis.")
    try { new URL(url) } catch { return alert("Lien invalide.") }
    onAdd({
      title: title.trim(),
      url: url.trim(),
      description: description.trim() || null,
      tags: tagsFrom(tags),
    })
    setTitle(""); setUrl(""); setDescription(""); setTags(""); setOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-2 rounded bg-slate-900 text-white hover:bg-slate-800 flex items-center gap-2"
      >
        <Plus className="w-4 h-4" /> Ajouter
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-lg rounded bg-white border" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 font-semibold">Proposer une activité</div>
            <div className="px-4 pb-4 grid gap-3">
              <label className="grid gap-1 text-sm">
                <span>Titre</span>
                <input className="px-3 py-2 rounded border" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Accrobranche" />
              </label>
              <label className="grid gap-1 text-sm">
                <span>Lien</span>
                <div className="flex gap-2">
                  <input className="flex-1 px-3 py-2 rounded border" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
                  <a className="px-3 py-2 rounded border bg-white hover:bg-slate-50" href={safeURL(url)} target="_blank" rel="noreferrer" title="Tester le lien">
                    <LinkIcon className="w-4 h-4" />
                  </a>
                </div>
              </label>
              <label className="grid gap-1 text-sm">
                <span>Description</span>
                <textarea className="px-3 py-2 rounded border" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Quelques détails..." />
              </label>
              <label className="grid gap-1 text-sm">
                <span>Tags (séparés par des virgules)</span>
                <input className="px-3 py-2 rounded border" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Outdoor, Budget moyen, 2h" />
              </label>
            </div>
            <div className="p-4 flex gap-2 justify-end">
              <button className="px-3 py-2 rounded border" onClick={() => setOpen(false)}>Annuler</button>
              <button className="px-3 py-2 rounded bg-emerald-600 text-white" onClick={submit}>Ajouter</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function tagsFrom(raw: string) {
  const arr = raw.split(",").map(s => s.trim()).filter(Boolean)
  return arr.length ? arr : []
}
function safeURL(u: string) { try { return new URL(u).toString() } catch { return "about:blank" } }
