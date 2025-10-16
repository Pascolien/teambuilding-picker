import React, { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { decodeSnapshot } from '../lib/share'

export default function Results() {
  const [params] = useSearchParams()
  const dataParam = params.get('data')
  const data = useMemo(() => dataParam ? decodeSnapshot(dataParam) : null, [dataParam]) as null | { createdAt:number, activities:{title:string,url:string,description?:string,tags?:string[],votes:number}[] }

  if (!data) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-xl font-semibold mb-2">Résultats (lecture seule)</h2>
        <p className="text-slate-600">Aucune donnée reçue. Depuis la page « Sondage », clique sur « Partager les résultats » pour générer un lien.</p>
      </div>
    )
  }

  const sorted = [...data.activities].sort((a,b)=> b.votes - a.votes)
  const totalVotes = sorted.reduce((acc,a)=> acc + a.votes, 0)

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-xl font-semibold mb-1">Résultats (instantané partagé)</h2>
      <p className="text-sm text-slate-600 mb-6">Généré le {new Date(data.createdAt).toLocaleString()} — {totalVotes} vote{totalVotes>1?'s':''}</p>

      <ol className="space-y-3">
        {sorted.map((a,idx)=> (
          <li key={idx} className="rounded border bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{idx+1}. {a.title}</div>
                {a.description && <p className="text-sm text-slate-700">{a.description}</p>}
                {a.tags && a.tags.length>0 && (<div className="mt-1 flex flex-wrap gap-1">{a.tags.map((t,i)=>(<span key={i} className="px-2 py-0.5 rounded border text-xs bg-slate-50">{t}</span>))}</div>)}
              </div>
              <div className="shrink-0 text-right">
                <div className="text-2xl font-bold">{a.votes}</div>
                <div className="text-xs text-slate-500">vote{a.votes>1?'s':''}</div>
                <a href={a.url} target="_blank" rel="noreferrer" className="text-sm underline">voir</a>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}