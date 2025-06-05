import { createClient } from "@supabase/supabase-js"

// Primary environment variables (Next.js standard)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.DB_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.API_KEY || ""



// Validate that we have the required values
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing required Supabase environment variables. Please check your .env.local file.")
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: "public",
  },
})

// Test connection function
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from("people").select("count", { count: "exact", head: true })

    if (error) {
      console.error("❌ Supabase connection test failed:", error.message)
      return { success: false, error: error.message }
    }

    console.log("✅ Supabase connection successful!")
    return { success: true, count: data }
  } catch (err) {
    console.error("❌ Supabase connection error:", err)
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" }
  }
}

// Types based on your actual database schema
export interface Person {
  id: string // UUID
  name: string
  profile: string
  start_date: string
  end_date: string | null
  status: "Active" | "Paused" | "Terminated"
  type: "Internal" | "External"
  created_at: string
  updated_at: string
}

export interface Client {
  id: string // UUID
  name: string
  description: string | null
  created_at: string
}

export interface ClientContact {
  id: string // UUID
  client_id: string
  name: string
  email: string | null
  phone: string | null
  position: string | null
}

export interface Project {
  id: string // UUID
  name: string
  description: string | null
  start_date: string | null
  end_date: string | null
  status: "In Progress" | "Finished" | "On Hold" | "Not Started"
  created_at: string
  updated_at: string
  client_id: string | null
}

export interface Assignment {
  id: string // UUID
  project_id: string
  person_id: string
  start_date: string
  end_date: string
  allocation: number // 0-100 range
  created_at: string
  updated_at: string
  assigned_role: string | null
}

export interface Task {
  id: string // UUID
  assignment_id: string
  title: string
  description: string | null
  status: "pending" | "in_progress" | "completed"
  due_date: string | null
  created_at: string
}

// Extended types with relations
export interface AssignmentWithRelations extends Assignment {
  people?: Person
  projects?: Project
}

export interface ProjectWithClient extends Project {
  clients?: Client
}

// Helper function to check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
  const hasUrl = !!(supabaseUrl && supabaseUrl !== "")
  const hasKey = !!(supabaseAnonKey && supabaseAnonKey !== "")
  const isValidUrl = supabaseUrl.includes(".supabase.co") || supabaseUrl.includes("localhost")

  const isConfigured = hasUrl && hasKey && isValidUrl

  console.log("🔍 Supabase Configuration Check:")
  console.log("Has URL:", hasUrl)
  console.log("Has Key:", hasKey)
  console.log("Valid URL format:", isValidUrl)
  console.log("Is Configured:", isConfigured)

  return isConfigured
}
