export type Activity = {
  id: string
  title: string
  url: string
  description?: string | null
  tags?: string[] | null
  votes_count?: number    // ← compteur géré par triggers SQL
  created_at?: string
}
