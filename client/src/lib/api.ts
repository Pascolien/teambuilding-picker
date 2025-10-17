import type { Activity } from '../types'
const API_BASE = '/api'
export async function fetchActivities(): Promise<Activity[]> {
  const r = await fetch(`${API_BASE}/activities`); if (!r.ok) throw new Error('fetch failed'); return r.json()
}
export async function addActivity(a: Omit<Activity,'id'|'votes'>): Promise<Activity> {
  const r = await fetch(`${API_BASE}/activities`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(a) })
  if (!r.ok) throw new Error('add failed'); return r.json()
}
export async function vote(activityId: string, previousActivityId?: string | null): Promise<Activity[]> {
  const r = await fetch(`${API_BASE}/vote`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ activityId, previousActivityId: previousActivityId || null }) })
  if (!r.ok) throw new Error('vote failed'); return r.json()
}
export function wsUrl(){ const isHttps = window.location.protocol === 'https:'; return `${isHttps ? 'wss' : 'ws'}://${window.location.host}/ws` }
