// src/lib/supabase.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// On évite toute confusion en n'appelant pas la constante "supabase"
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { realtime: { params: { eventsPerSecond: 10 } } }
)
