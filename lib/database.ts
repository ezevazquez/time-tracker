import { supabase, isSupabaseConfigured } from "./supabase"
import { mockPeople, mockProjects, mockAssignments } from "./mock-data"
import type { Person, Project, Assignment, AssignmentWithRelations, Client, ProjectWithClient } from "./supabase"

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

  async getById(id: string): Promise<Person | null> {
    if (!isSupabaseConfigured()) {
      return mockPeople.find((p) => p.id === id) || null
    }

    try {
      const { data, error } = await supabase.from("people").select("*").eq("id", id).single()

      if (error) {
        console.error("Error fetching person:", error)
        throw new Error(`Error loading person: ${error.message}`)
      }
      return data
    } catch (err) {
      console.error("Service error:", err)
      throw err
    }
  },

  async create(person: Omit<Person, "id" | "created_at" | "updated_at">): Promise<Person> {
    if (!isSupabaseConfigured()) {
      const newPerson: Person = {
        ...person,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      return newPerson
    }

    try {
      // Generate UUID for new person
      const newId = crypto.randomUUID()

      const { data, error } = await supabase
        .from("people")
        .insert([{ ...person, id: newId }])
        .select()
        .single()

      if (error) {
        console.error("Error creating person:", error)
        throw new Error(`Error creating person: ${error.message}`)
      }
      return data
    } catch (err) {
      console.error("Service error:", err)
      throw err
    }
  },

  async update(id: string, updates: Partial<Person>): Promise<Person> {
    if (!isSupabaseConfigured()) {
      throw new Error("Update not supported with mock data")
    }

    try {
      const { data, error } = await supabase
        .from("people")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()

      if (error) {
        console.error("Error updating person:", error)
        throw new Error(`Error updating person: ${error.message}`)
      }
      return data
    } catch (err) {
      console.error("Service error:", err)
      throw err
    }
  },

  async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error("Delete not supported with mock data")
    }

    try {
      const { error } = await supabase.from("people").delete().eq("id", id)

      if (error) {
        console.error("Error deleting person:", error)
        throw new Error(`Error deleting person: ${error.message}`)
      }
    } catch (err) {
      console.error("Service error:", err)
      throw err
    }
  },
}

// Clients Service
export const clientsService = {
  async getAll(): Promise<Client[]> {
    if (!isSupabaseConfigured()) {
      return []
    }

    try {
      const { data, error } = await supabase.from("clients").select("*").order("name")

      if (error) {
        console.error("Error fetching clients:", error)
        throw new Error(`Error fetching clients: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error("Error in clientsService.getAll:", error)
      return []
    }
  },

  async getById(id: string): Promise<Client | null> {
    if (!isSupabaseConfigured()) {
      return null
    }

    try {
      const { data, error } = await supabase.from("clients").select("*").eq("id", id).single()

      if (error) {
        console.error("Error fetching client:", error)
        throw new Error(`Error loading client: ${error.message}`)
      }
      return data
    } catch (err) {
      console.error("Service error:", err)
      throw err
    }
  },
}

// Projects Service
export const projectsService = {
  async getAll(): Promise<ProjectWithClient[]> {
    if (!isSupabaseConfigured()) {
      return mockProjects
    }

    try {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          clients:client_id (*)
        `)
        .order("name")

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

  async getById(id: string): Promise<ProjectWithClient | null> {
    if (!isSupabaseConfigured()) {
      return mockProjects.find((p) => p.id === id) || null
    }

    try {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          clients:client_id (*)
        `)
        .eq("id", id)
        .single()

      if (error) {
        console.error("Error fetching project:", error)
        throw new Error(`Error loading project: ${error.message}`)
      }
      return data
    } catch (err) {
      console.error("Service error:", err)
      throw err
    }
  },

  async create(project: Omit<Project, "id" | "created_at" | "updated_at">): Promise<Project> {
    if (!isSupabaseConfigured()) {
      const newProject: Project = {
        ...project,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      return newProject
    }

    try {
      // Generate UUID for new project
      const newId = crypto.randomUUID()

      const { data, error } = await supabase
        .from("projects")
        .insert([{ ...project, id: newId }])
        .select()
        .single()

      if (error) {
        console.error("Error creating project:", error)
        throw new Error(`Error creating project: ${error.message}`)
      }
      return data
    } catch (err) {
      console.error("Service error:", err)
      throw err
    }
  },

  async update(id: string, updates: Partial<Project>): Promise<Project> {
    if (!isSupabaseConfigured()) {
      throw new Error("Update not supported with mock data")
    }

    try {
      const { data, error } = await supabase
        .from("projects")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()

      if (error) {
        console.error("Error updating project:", error)
        throw new Error(`Error updating project: ${error.message}`)
      }
      return data
    } catch (err) {
      console.error("Service error:", err)
      throw err
    }
  },

  async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error("Delete not supported with mock data")
    }

    try {
      const { error } = await supabase.from("projects").delete().eq("id", id)

      if (error) {
        console.error("Error deleting project:", error)
        throw new Error(`Error deleting project: ${error.message}`)
      }
    } catch (err) {
      console.error("Service error:", err)
      throw err
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
            status,
            client_id
          )
        `,
        )
        .order("start_date")

      if (error) {
        console.error("Error fetching assignments:", error)
        throw new Error(`Error fetching assignments: ${error.message}`)
      }

      // Convert allocation from 0-100 to 0-1 for compatibility with existing code
      const formattedData =
        data?.map((assignment) => ({
          ...assignment,
          allocation: assignment.allocation / 100,
        })) || []

      return formattedData
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
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      return newAssignment
    }

    try {
      // Generate UUID for new assignment
      const newId = crypto.randomUUID()

      // Convert allocation from 0-1 to 0-100 for database storage
      const dbAssignment = {
        ...assignment,
        id: newId,
        allocation: assignment.allocation * 100, // Convert to percentage for DB
      }

      const { data, error } = await supabase.from("assignments").insert([dbAssignment]).select().single()

      if (error) {
        console.error("Error creating assignment:", error)
        throw new Error(`Error creating assignment: ${error.message}`)
      }

      // Convert back to 0-1 scale for app use
      return {
        ...data,
        allocation: data.allocation / 100,
      }
    } catch (err) {
      console.error("Service error:", err)
      throw err
    }
  },

  async update(id: string, updates: Partial<Assignment>): Promise<Assignment> {
    if (!isSupabaseConfigured()) {
      throw new Error("Update not supported with mock data")
    }

    try {
      // Convert allocation if present
      const dbUpdates = {
        ...updates,
        allocation: updates.allocation !== undefined ? updates.allocation * 100 : undefined,
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase.from("assignments").update(dbUpdates).eq("id", id).select().single()

      if (error) {
        console.error("Error updating assignment:", error)
        throw new Error(`Error updating assignment: ${error.message}`)
      }

      // Convert back to 0-1 scale
      return {
        ...data,
        allocation: data.allocation / 100,
      }
    } catch (err) {
      console.error("Service error:", err)
      throw err
    }
  },

  async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error("Delete not supported with mock data")
    }

    try {
      const { error } = await supabase.from("assignments").delete().eq("id", id)

      if (error) {
        console.error("Error deleting assignment:", error)
        throw new Error(`Error deleting assignment: ${error.message}`)
      }
    } catch (err) {
      console.error("Service error:", err)
      throw err
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

      // Convert allocation from 0-100 to 0-1
      return (data || []).map((assignment) => ({
        ...assignment,
        allocation: assignment.allocation / 100,
      }))
    } catch (error) {
      console.error("Error checking allocation conflicts:", error)
      return []
    }
  },
}
