import type { Activity } from '../types'

const STORAGE_KEY_ACTIVITIES = 'tbp_activities'
const STORAGE_KEY_MYVOTE = 'tbp_myvote'

export function loadActivities(): Activity[] {
  const defaults: Activity[] = [
    { id: crypto.randomUUID(), title: 'Escape Game en ville', url: 'https://www.escapegame.fr/', description: 'Résolvez des énigmes en équipe.', tags: ['Indoor','90 min'], votes: 0 },
    //{ id: crypto.randomUUID(), title: 'Karting Team Sprint', url: 'https://green-kart.com/', description: 'Courses en relais, sensations garanties.', tags: ['Outdoor','Adrénaline'], votes: 0 },
    { id: crypto.randomUUID(), title: 'Atelier Cuisine', url: 'https://www.atelierdeschefs.fr/', description: 'Cuisinez et dégustez ensemble.', tags: ['Gourmand','2h'], votes: 0 },
  ]
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACTIVITIES)
    if (!raw) return defaults
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : defaults
  } catch { return defaults }
}

export function saveActivities(list: Activity[]) {
  localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(list))
}

export function loadMyVote(): string | null {
  try { return localStorage.getItem(STORAGE_KEY_MYVOTE) } catch { return null }
}
export function saveMyVote(id: string | null) {
  if (id) localStorage.setItem(STORAGE_KEY_MYVOTE, id)
  else localStorage.removeItem(STORAGE_KEY_MYVOTE)
}