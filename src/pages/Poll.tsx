import React, { useEffect, useMemo, useState } from 'react'
import type { Activity } from '../types'
import { loadActivities, saveActivities, loadMyVote, saveMyVote } from '../lib/store'
import { buildResultsUrl } from '../lib/share'
import { ExternalLink, Plus, Trash2, CheckCircle2, RefreshCw, Link as LinkIcon, Download, Upload, Trophy } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Poll() {
  const [activities, setActivities] = useState<Activity[]>(() => loadActivities())
  const [myVote, setMyVote] = useState<string | null>(() => loadMyVote())
  const [q, setQ] = useState('')

  useEffect(() => { saveActivities(activities) }, [activities])
  useEffect(() => { saveMyVote(myVote) }, [myVote])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return activities
    return activities.filter(a => [a.title, a.description, a.tags?.join(' ')].filter(Boolean).join(' ').toLowerCase().includes(query))
  }, [activities, q])

  const leader = useMemo(() => {
    if (!activities.length) return null
    const max = Math.max(...activities.map(a => a.votes))
    if (max <= 0) return null
    const top = activities.filter(a => a.votes === max)
    return { max, top }
  }, [activities])

  function castVote(id: string) {
    setActivities(prev => {
      const copy = [...prev]
      const prevIdx = myVote ? copy.findIndex(a => a.id === myVote) : -1
      const newIdx = copy.findIndex(a => a.id === id)
      if (newIdx === -1) return prev
      if (prevIdx !== -1 && copy[prevIdx].votes > 0) copy[prevIdx] = { ...copy[prevIdx], votes: copy[prevIdx].votes - 1 }
      copy[newIdx] = { ...copy[newIdx], votes: copy[newIdx].votes + 1 }
      return copy
    })
    setMyVote(id)
  }

  function resetVotes() {
    setActivities(prev => prev.map(a => ({ ...a, votes: 0 })))
    setMyVote(null)
  }

  function removeActivity(id: string) {
    setActivities(prev => prev.filter(a => a.id !== id))
    if (myVote === id) setMyVote(null)
  }

  function addActivity(input: Omit<Activity, 'id' | 'votes'>) {
    setActivities(prev => [...prev, { id: crypto.randomUUID(), votes: 0, ...input }])
  }

  function exportJSON() {
    const payload = JSON.stringify({ activities, myVote }, null, 2)
    const blob = new Blob([payload], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `team-building-poll-${new Date().toISOString().slice(0,10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function onImport(files: FileList | null) {
    const f = files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result))
        if (!Array.isArray(data.activities)) throw new Error('invalid')
        setActivities(data.activities)
        setMyVote(data.myVote ?? null)
      } catch {
        alert('Import impossible: fichier invalide.')
      }
    }
    reader.readAsText(f)
  }

  function copyResultsLink() {
    const href = buildResultsUrl(window.location.origin, activities)
    navigator.clipboard.writeText(href)
      .then(() => alert('Lien copié dans le presse-papiers !'))
      .catch(() => prompt('Copiez ce lien :', href))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <input className="flex-1 px-3 py-2 rounded border" placeholder="Rechercher (titre, tags, description)" value={q} onChange={e => setQ(e.target.value)} />
        <AddActivityButton onAdd={addActivity} />
        <button onClick={exportJSON} className="px-3 py-2 rounded border bg-white hover:bg-slate-50 flex items-center gap-2"><Download className="w-4 h-4"/>Exporter</button>
        <label className="px-3 py-2 rounded border bg-white hover:bg-slate-50 flex items-center gap-2 cursor-pointer">
          <Upload className="w-4 h-4"/> Importer
          <input type="file" accept="application/json" className="hidden" onChange={e => onImport(e.target.files)} />
        </label>
        <button onClick={resetVotes} className="px-3 py-2 rounded border bg-white hover:bg-slate-50 flex items-center gap-2"><RefreshCw className="w-4 h-4"/> Remise à zéro</button>
        <button onClick={copyResultsLink} className="px-3 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700">Partager les résultats</button>
      </div>

      {leader && (
        <div className="p-4 rounded border bg-amber-50 border-amber-200 flex items-center gap-3">
          <Trophy className="w-5 h-5"/>
          <span className="font-medium">En tête :</span>
          <div className="flex flex-wrap gap-2">
            {leader.top.map(a => (<span key={a.id} className="px-2 py-1 rounded bg-white border text-sm">{a.title} — {a.votes} vote{a.votes>1?'s':''}</span>))}
          </div>
        </div>
      )}

      <AnimatePresence mode="popLayout">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(a => (
            <motion.div key={a.id} layout initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-12}} transition={{duration:0.2}}>
              <div className="h-full rounded border bg-white">
                <div className="p-4 flex items-start justify-between gap-3">
                  <div className="text-lg font-semibold leading-tight">{a.title}</div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-sm font-medium">{a.votes} 🗳️</span>
                </div>
                <div className="px-4 pb-4 space-y-4">
                  {a.description && <p className="text-sm text-slate-700">{a.description}</p>}
                  {a.tags && a.tags.length>0 && (<div className="flex flex-wrap gap-1">{a.tags.map((t,i)=>(<span key={i} className="px-2 py-0.5 rounded border text-xs bg-slate-50">{t}</span>))}</div>)}
                  <div className="flex items-center gap-2">
                    <a className="flex-1 px-3 py-2 rounded border bg-white hover:bg-slate-50 flex items-center gap-2" href={a.url} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4"/> Voir l'activité</a>
                    <button onClick={()=>castVote(a.id)} className={`px-3 py-2 rounded border ${myVote===a.id? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white hover:bg-slate-50'}`} title={myVote===a.id ? 'Votre vote actuel' : 'Voter pour cette activité'}>
                      {myVote===a.id? (<span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> Mon choix</span>):'Voter'}
                    </button>
                    <button onClick={()=>removeActivity(a.id)} className="px-2 py-2 rounded hover:bg-red-50" title="Supprimer"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>

      {filtered.length===0 && <p className="text-center text-slate-500 mt-12">Aucune activité ne correspond à la recherche.</p>}

      <div className="mt-10 grid gap-3 md:grid-cols-2">
        <div className="rounded border bg-white">
          <div className="p-4 font-semibold">Comment ça marche ?</div>
          <div className="px-4 pb-4 text-sm text-slate-600">
            <ul className="list-disc pl-5 space-y-1">
              <li>Ajoutez des idées via <strong>Ajouter</strong> (titre, lien, description, tags).</li>
              <li>Chaque personne choisit une seule activité : cliquez sur <strong>Voter</strong>.</li>
              <li>Partager un lien <em>résultats</em> en lecture seule pour consulter le classement.</li>
              <li>Les données restent dans votre navigateur (localStorage). Export/Import JSON pour partager la liste.</li>
            </ul>
          </div>
        </div>
        <div className="rounded border bg-white">
          <div className="p-4 font-semibold">Astuce</div>
          <div className="px-4 pb-4 text-sm text-slate-600">
            Pour un vote multi‑utilisateurs en temps réel, remplacez le stockage local par une base temps réel (ex. Supabase, Firebase) et stockez <code>activities</code> et <code>votes</code> côté serveur.
          </div>
        </div>
      </div>
    </div>
  )
}

function AddActivityButton({ onAdd }: { onAdd: (a: Omit<Activity,'id'|'votes'>) => void }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')

  function submit() {
    if (!title.trim() || !url.trim()) return alert('Titre et lien sont requis.')
    try { new URL(url) } catch { return alert('Lien invalide.') }
    onAdd({ title: title.trim(), url: url.trim(), description: description.trim() || undefined, tags: tagsFrom(tags) })
    setTitle(''); setUrl(''); setDescription(''); setTags(''); setOpen(false)
  }

  return (
    <>
      <button onClick={()=>setOpen(true)} className="px-3 py-2 rounded bg-slate-900 text-white hover:bg-slate-800 flex items-center gap-2">
        <Plus className="w-4 h-4"/>Ajouter
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={()=>setOpen(false)}>
          <div className="w-full max-w-lg rounded bg-white border" onClick={e=>e.stopPropagation()}>
            <div className="p-4 font-semibold">Proposer une activité</div>
            <div className="px-4 pb-4 grid gap-3">
              <label className="grid gap-1 text-sm">
                <span>Titre</span>
                <input className="px-3 py-2 rounded border" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Ex: Accrobranche" />
              </label>
              <label className="grid gap-1 text-sm">
                <span>Lien</span>
                <div className="flex gap-2">
                  <input className="flex-1 px-3 py-2 rounded border" value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://..." />
                  <a className="px-3 py-2 rounded border bg-white hover:bg-slate-50" href={safeURL(url)} target="_blank" rel="noreferrer" title="Tester le lien"><LinkIcon className="w-4 h-4"/></a>
                </div>
              </label>
              <label className="grid gap-1 text-sm">
                <span>Description</span>
                <textarea className="px-3 py-2 rounded border" value={description} onChange={e=>setDescription(e.target.value)} placeholder="Quelques détails..." />
              </label>
              <label className="grid gap-1 text-sm">
                <span>Tags (séparés par des virgules)</span>
                <input className="px-3 py-2 rounded border" value={tags} onChange={e=>setTags(e.target.value)} placeholder="Outdoor, Budget moyen, 2h" />
              </label>
            </div>
            <div className="p-4 flex gap-2 justify-end">
              <button className="px-3 py-2 rounded border" onClick={()=>setOpen(false)}>Annuler</button>
              <button className="px-3 py-2 rounded bg-emerald-600 text-white" onClick={submit}>Ajouter</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function tagsFrom(raw: string): string[] | undefined {
  const arr = raw.split(',').map(s=>s.trim()).filter(Boolean)
  return arr.length? arr : undefined
}
function safeURL(u: string) { try { return new URL(u).toString() } catch { return 'about:blank' } }