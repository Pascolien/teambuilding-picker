import React, { useEffect, useState } from 'react'
import type { Activity } from '../types'
import { fetchActivities } from '../lib/api'
import { makeSocket, type ServerMessage } from '../lib/ws'
export default function Results(){
  const [live,setLive]=useState<Activity[]|null>(null)
  useEffect(()=>{ fetchActivities().then(setLive).catch(console.error)
    const close = makeSocket((msg: ServerMessage)=>{ if(msg.type==='activities'){ setLive(msg.payload) } })
    return ()=> close() },[])
  if(!live) return <p className='text-center text-slate-600'>Chargement des résultats en direct…</p>
  const sorted = [...live].sort((a,b)=> b.votes - a.votes)
  const totalVotes = sorted.reduce((acc,a)=> acc + a.votes, 0)
  return (<div className="max-w-3xl mx-auto"><h2 className="text-xl font-semibold mb-1">Résultats (temps réel)</h2>
    <p className="text-sm text-slate-600 mb-6">{totalVotes} vote{totalVotes>1?'s':''}</p>
    <ol className="space-y-3">{sorted.map((a,idx)=>(<li key={a.id} className="rounded border bg-white p-4"><div className="flex items-start justify-between gap-3">
      <div><div className="font-semibold">{idx+1}. {a.title}</div>{a.description && <p className="text-sm text-slate-700">{a.description}</p>}
        {a.tags && a.tags.length>0 && (<div className="mt-1 flex flex-wrap gap-1">{a.tags.map((t,i)=>(<span key={i} className="px-2 py-0.5 rounded border text-xs bg-slate-50">{t}</span>))}</div>)}</div>
      <div className="shrink-0 text-right"><div className="text-2xl font-bold">{a.votes}</div><div className="text-xs text-slate-500">vote{a.votes>1?'s':''}</div><a href={a.url} target="_blank" rel="noreferrer" className="text-sm underline">voir</a></div>
    </div></li>))}</ol></div>)
}
