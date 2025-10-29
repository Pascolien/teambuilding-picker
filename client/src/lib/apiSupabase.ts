import { supabase } from "./supabase"
import type { Activity } from "../types"

export async function listActivities(): Promise<Activity[]> {
  const { data, error } = await supabase.from("activities").select("*")
  if (error) throw error
  return data as Activity[]
}
export async function addActivity(a: Omit<Activity, "id"|"votes_count"|"created_at">) {
  // ⚠️ Normalise la payload par rapport au schéma SQL (tags text[] par ex.)
  const payload = {
    title: a.title?.trim(),
    url: a.url?.trim(),
    description: a.description ?? null,
    tags: Array.isArray(a.tags) ? a.tags : [], // si tags est text[]
  }

  const { data, error } = await supabase
    .from("activities")
    .insert(payload)
    .select()
    .single()

  if (error) {
    //  très utile en dev
    console.error("[addActivity] insert error:", error, "payload:", payload)
    throw error
  }

  return data
}

/** toggle vote multi-choix */
export async function toggleVote(activityId: string, clientId: string, selected: boolean) {
  if (!selected) {
    const { error } = await supabase
      .from("votes")
      .insert({ activity_id: activityId, client_id: clientId })
    if (error) throw error
  } else {
    const { error } = await supabase
      .from("votes")
      .delete()
      .eq("activity_id", activityId)
      .eq("client_id", clientId)
    if (error) throw error
  }
}

export async function listMyVotes(clientId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("votes")
    .select("activity_id")
    .eq("client_id", clientId)
  if (error) throw error
  return (data ?? []).map((r) => r.activity_id as string)
}
