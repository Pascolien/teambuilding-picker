import type { Activity } from '../types'

export function buildSnapshot(activities: Activity[]) {
  const slim = activities.map(a => ({ title: a.title, url: a.url, description: a.description, tags: a.tags, votes: a.votes }))
  return { createdAt: Date.now(), activities: slim }
}

export function encodeSnapshot(obj: unknown) {
  const json = JSON.stringify(obj)
  const b64 = btoa(unescape(encodeURIComponent(json)))
  return b64
}

export function decodeSnapshot(b64: string) {
  try {
    const json = decodeURIComponent(escape(atob(b64)))
    return JSON.parse(json)
  } catch { return null }
}

export function buildResultsUrl(baseHref: string, activities: Activity[]) {
  const snap = buildSnapshot(activities)
  const encoded = encodeSnapshot(snap)
  const url = new URL(baseHref)
  url.pathname = '/results'
  url.searchParams.set('data', encoded)
  return url.toString()
}