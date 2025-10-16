import type { Activity } from '../types'
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5228'

export async function fetchActivities(): Promise<Activity[]> {
  const r = await fetch(`${API_URL}/activities`)
  if (!r.ok) throw new Error('fetch failed')
  return r.json()
}

export async function addActivity(a: Omit<Activity,'id'|'votes'>): Promise<Activity> {
  const r = await fetch(`${API_URL}/activities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(a)
  })
  if (!r.ok) throw new Error('add failed')
  return r.json()
}

export async function vote(activityId: string, previousActivityId?: string | null): Promise<Activity[]> {
  const r = await fetch(`${API_URL}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ activityId, previousActivityId: previousActivityId || null })
  })
  if (!r.ok) throw new Error('vote failed')
  return r.json()
}

export function wsUrl() {
  const url = new URL(API_URL)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  url.pathname = '/ws'
  return url.toString()
}
