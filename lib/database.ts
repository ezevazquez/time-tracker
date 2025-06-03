import { supabase, isSupabaseConfigured } from "./supabase"
import { mockPeople, mockProjects, mockAssignments } from "./mock-data"
import type { Person, Project, Assignment, AssignmentWithRelations } from "./supabase"

// People Service
export const peopleService = {
  async getAll(): Promise<Person[]> {
    if (!isSupabaseConfigured()) {
      return mockPeople
    }

    try {
      const { data, error } = await supabase.from("people").select("*").order("name")

      if (error) {
        console.error("Error fetching people:", error)
        throw new Error(`Error fetching people: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error("Error in peopleService.getAll:", error)
      // Fallback to mock data if there's an error
      return mockPeople
    }
  },

  async create(person: Omit<Person, "id" | "created_at" | "updated_at">): Promise<Person> {
    const { data, error } = await supabase
      .from("people")
      .insert([person])
      .select()
      .single()

    if (error) {
      throw new Error(`Error creating person: ${error.message}`)
    }

    return data
  },

  async update(id: string, updates: Partial<Person>): Promise<Person> {
    if (!isSupabaseConfigured()) {
      throw new Error("Update not supported with mock data")
    }

    const { data, error } = await supabase
      .from("people")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      throw new Error(`Error updating person: ${error.message}`)
    }

    return data
  },

  async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error("Delete not supported with mock data")
    }

    const { error } = await supabase.from("people").delete().eq("id", id)

    if (error) {
      throw new Error(`Error deleting person: ${error.message}`)
    }
  },
}

// Projects Service
export const projectsService = {
  async getAll(): Promise<Project[]> {
    if (!isSupabaseConfigured()) {
      return mockProjects
    }

    try {
      const { data, error } = await supabase.from("projects").select("*").order("name")

      if (error) {
        console.error("Error fetching projects:", error)
        throw new Error(`Error fetching projects: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error("Error in projectsService.getAll:", error)
      // Fallback to mock data if there's an error
      return mockProjects
    }
  },

  async create(project: Omit<Project, "id" | "created_at" | "updated_at">): Promise<Project> {
    if (!isSupabaseConfigured()) {
      const newProject: Project = {
        ...project,
        id: Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      return newProject
    }

    const { data, error } = await supabase.from("projects").insert([project]).select().single()

    if (error) {
      throw new Error(`Error creating project: ${error.message}`)
    }

    return data
  },

  async update(id: string, updates: Partial<Project>): Promise<Project> {
    if (!isSupabaseConfigured()) {
      throw new Error("Update not supported with mock data")
    }

    const { data, error } = await supabase
      .from("projects")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      throw new Error(`Error updating project: ${error.message}`)
    }

    return data
  },

  async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error("Delete not supported with mock data")
    }

    const { error } = await supabase.from("projects").delete().eq("id", id)

    if (error) {
      throw new Error(`Error deleting project: ${error.message}`)
    }
  },
}

// Assignments Service
export const assignmentsService = {
  async getAll(): Promise<AssignmentWithRelations[]> {
    if (!isSupabaseConfigured()) {
      return mockAssignments
    }

    try {
      const { data, error } = await supabase
        .from("assignments")
        .select(
          `
          *,
          people:person_id (
            id,
            name,
            profile,
            type,
            status
          ),
          projects:project_id (
            id,
            name,
            client,
            status
          )
        `,
        )
        .order("start_date")

      if (error) {
        console.error("Error fetching assignments:", error)
        throw new Error(`Error fetching assignments: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error("Error in assignmentsService.getAll:", error)
      // Fallback to mock data if there's an error
      return mockAssignments
    }
  },

  async create(assignment: Omit<Assignment, "id" | "created_at" | "updated_at">): Promise<Assignment> {
    if (!isSupabaseConfigured()) {
      const newAssignment: Assignment = {
        ...assignment,
        id: Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      return newAssignment
    }

    const { data, error } = await supabase.from("assignments").insert([assignment]).select().single()

    if (error) {
      throw new Error(`Error creating assignment: ${error.message}`)
    }

    return data
  },

  async update(id: string, updates: Partial<Assignment>): Promise<Assignment> {
    if (!isSupabaseConfigured()) {
      throw new Error("Update not supported with mock data")
    }

    const { data, error } = await supabase
      .from("assignments")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      throw new Error(`Error updating assignment: ${error.message}`)
    }

    return data
  },

  async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error("Delete not supported with mock data")
    }

    const { error } = await supabase.from("assignments").delete().eq("id", id)

    if (error) {
      throw new Error(`Error deleting assignment: ${error.message}`)
    }
  },

  async checkAllocationConflicts(
    personId: string,
    startDate: string,
    endDate: string,
    excludeAssignmentId?: string,
  ): Promise<AssignmentWithRelations[]> {
    if (!isSupabaseConfigured()) {
      return []
    }

    try {
      let query = supabase
        .from("assignments")
        .select(
          `
          *,
          people:person_id (
            id,
            name,
            profile,
            type,
            status
          ),
          projects:project_id (
            id,
            name,
            client,
            status
          )
        `,
        )
        .eq("person_id", personId)
        .or(`start_date.lte.${endDate},end_date.gte.${startDate}`)

      if (excludeAssignmentId) {
        query = query.neq("id", excludeAssignmentId)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(`Error checking allocation conflicts: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error("Error checking allocation conflicts:", error)
      return []
    }
  },
}
