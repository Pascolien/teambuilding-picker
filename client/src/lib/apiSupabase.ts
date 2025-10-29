import { supabase } from "./supabase"
import type { Activity } from "../types"

export async function listActivities(): Promise<Activity[]> {
  const { data, error } = await supabase.from("activities").select("*")
  if (error) throw error
  return data as Activity[]
}

export async function addActivity(a: Omit<Activity, "id" | "votes_count" | "created_at">) {
  const payload = {
    title: a.title?.trim(),
    url: a.url?.trim(),
    description: a.description ?? null,
    tags: Array.isArray(a.tags) ? a.tags : [],
  }
  const { data, error } = await supabase
    .from("activities")
    .insert(payload)
    .select()
    .single()
  if (error) {
    console.error("[addActivity] error", error, "payload", payload)
    throw error
  }
  return data
}

/** multi-choix : selected=true => retirer le vote, selected=false => ajouter */
export async function toggleVote(activityId: string, clientId: string, selected: boolean) {
  if (!selected) {
    const { error } = await supabase
      .from("votes")
      .insert({ activity_id: activityId, client_id: clientId })
    if (error) { console.error("[toggleVote insert]", error); throw error }
  } else {
    const { error } = await supabase
      .from("votes")
      .delete()
      .eq("activity_id", activityId)
      .eq("client_id", clientId)
    if (error) { console.error("[toggleVote delete]", error); throw error }
  }
}

export async function listMyVotes(clientId: string): Promise<string[]> {
  type VoteRow = { activity_id: string }
  const { data, error } = await supabase
    .from("votes")
    .select("activity_id")
    .eq("client_id", clientId)
  if (error) throw error
  return ((data ?? []) as VoteRow[]).map(r => r.activity_id)
}

/** (optionnel) suppression d’une activité côté DB */
export async function deleteActivity(activityId: string) {
  const { error } = await supabase.from("activities").delete().eq("id", activityId)
  if (error) throw error
}
