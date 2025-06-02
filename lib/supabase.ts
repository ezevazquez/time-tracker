import { createClient } from "@supabase/supabase-js"

// For client-side access, we need to use NEXT_PUBLIC_ prefix
// But since we have DB_URL and API_KEY, let's try both approaches
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.DB_URL || ""

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.API_KEY || ""

// Debug logging to see what we have
console.log("Supabase Configuration Debug:")
console.log("DB_URL available:", !!process.env.DB_URL)
console.log("API_KEY available:", !!process.env.API_KEY)
console.log("NEXT_PUBLIC_SUPABASE_URL available:", !!process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY available:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
console.log("Final supabaseUrl:", supabaseUrl ? "Present" : "Missing")
console.log("Final supabaseAnonKey:", supabaseAnonKey ? "Present" : "Missing")

let supabase // Declare supabase here

// Validate that we have the required values
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase configuration:")
  console.error("supabaseUrl:", supabaseUrl || "MISSING")
  console.error("supabaseAnonKey:", supabaseAnonKey ? "Present" : "MISSING")

  // Create a dummy client to prevent crashes
  const dummyClient = createClient("https://placeholder.supabase.co", "placeholder-key")
  supabase = dummyClient
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
}

export { supabase }

// Types based on your database schema
export interface Person {
  id: string
  name: string
  profile: string
  start_date: string
  end_date: string | null
  status: "activo" | "pausado" | "fuera"
  type: "interno" | "externo"
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  name: string
  description: string | null
  start_date: string
  end_date: string | null
  status: "activo" | "cerrado" | "en pausa"
  created_at: string
  updated_at: string
}

export interface Assignment {
  id: string
  project_id: string
  person_id: string
  start_date: string
  end_date: string
  allocation: number
  created_at: string
  updated_at: string
}

// Extended types with relations
export interface AssignmentWithRelations extends Assignment {
  people?: Person
  projects?: Project
}

// Helper function to check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
  return !!(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== "https://placeholder.supabase.co" &&
    supabaseAnonKey !== "placeholder-key"
  )
}
