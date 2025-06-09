import { supabase } from "./supabase"
import type {
  Person,
  Project,
  Assignment,
  AssignmentWithRelations,
  Client,
  ProjectWithClient,
} from "./supabase"

export const peopleService = {
  async getAll(): Promise<Person[]> {
    const { data, error } = await supabase.from("people").select("*").order("name")
    if (error) throw new Error(`Error fetching people: ${error.message}`)
    return data || []
  },

  async getById(id: string): Promise<Person | null> {
    const { data, error } = await supabase.from("people").select("*").eq("id", id).single()
    if (error) throw new Error(`Error loading person: ${error.message}`)
    return data
  },

  async create(person: Omit<Person, "id" | "created_at" | "updated_at">): Promise<Person> {
    const newId = crypto.randomUUID()
    const { data, error } = await supabase
      .from("people")
      .insert([{ ...person, id: newId }])
      .select()
      .single()
    if (error) throw new Error(`Error creating person: ${error.message}`)
    return data
  },

  async update(id: string, updates: Partial<Person>): Promise<Person> {
    const { data, error } = await supabase
      .from("people")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()
    if (error) throw new Error(`Error updating person: ${error.message}`)
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("people").delete().eq("id", id)
    if (error) throw new Error(`Error deleting person: ${error.message}`)
  },
}

export const clientsService = {
  async getAll(): Promise<Client[]> {
    const { data, error } = await supabase.from("clients").select("*").order("name")
    if (error) throw new Error(`Error fetching clients: ${error.message}`)
    return data || []
  },

  async getById(id: string): Promise<Client | null> {
    const { data, error } = await supabase.from("clients").select("*").eq("id", id).single()
    if (error) throw new Error(`Error loading client: ${error.message}`)
    return data
  },

  async create(client: Omit<Client, "id" | "created_at">): Promise<Client> {
    const { data, error } = await supabase.from("clients").insert([client]).select().single()
    if (error) throw new Error(`Error creating client: ${error.message}`)
    if (!data) throw new Error("No data returned after creating client")
    return data
  },

  async update(id: string, updates: Partial<Omit<Client, "id" | "created_at">>): Promise<Client> {
    const { data, error } = await supabase
      .from("clients")
      .update(updates)
      .eq("id", id)
      .select()
      .single()
    if (error) throw new Error(`Error updating client: ${error.message}`)
    if (!data) throw new Error("No data returned after updating client")
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("clients").delete().eq("id", id)
    if (error) throw new Error(`Error deleting client: ${error.message}`)
  },
}

export const projectsService = {
  async getAll(): Promise<ProjectWithClient[]> {
    const { data, error } = await supabase
      .from("projects")
      .select(`*, clients:client_id (*)`)
      .order("name")
    if (error) throw new Error(`Error fetching projects: ${error.message}`)
    return data || []
  },

  async getById(id: string): Promise<ProjectWithClient | null> {
    const { data, error } = await supabase
      .from("projects")
      .select(`*, clients:client_id (*)`)
      .eq("id", id)
      .single()
    if (error) throw new Error(`Error loading project: ${error.message}`)
    return data
  },

  async create(project: Omit<Project, "id" | "created_at" | "updated_at">): Promise<Project> {
    const newId = crypto.randomUUID()
    const { data, error } = await supabase
      .from("projects")
      .insert([{ ...project, id: newId }])
      .select()
      .single()
    if (error) throw new Error(`Error creating project: ${error.message}`)
    return data
  },

  async update(id: string, updates: Partial<Project>): Promise<Project> {
    const { data, error } = await supabase
      .from("projects")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()
    if (error) throw new Error(`Error updating project: ${error.message}`)
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("projects").delete().eq("id", id)
    if (error) throw new Error(`Error deleting project: ${error.message}`)
  },
}

export const assignmentsService = {
  async getAll(): Promise<AssignmentWithRelations[]> {
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

    if (error) throw new Error(`Error fetching assignments: ${error.message}`)

    return (
      data?.map((assignment) => ({
        ...assignment,
        allocation: assignment.allocation / 100,
      })) || []
    )
  },

  async create(
    assignment: Omit<Assignment, "id" | "created_at" | "updated_at">,
  ): Promise<Assignment> {
    const newId = crypto.randomUUID()
    const allocationPercentage = Math.round(assignment.allocation * 100)
    if (![25, 50, 75, 100].includes(allocationPercentage)) {
      throw new Error("La asignación debe ser 25%, 50%, 75% o 100%")
    }

    const dbAssignment = {
      ...assignment,
      id: newId,
      allocation: allocationPercentage,
    }

    const { data, error } = await supabase
      .from("assignments")
      .insert([dbAssignment])
      .select()
      .single()

    if (error) throw new Error(`Error creating assignment: ${error.message}`)

    return {
      ...data,
      allocation: data.allocation / 100,
    }
  },

  async update(id: string, updates: Partial<Assignment>): Promise<Assignment> {
    if (updates.allocation !== undefined) {
      const allocationPercentage = Math.round(updates.allocation * 100)
      if (![25, 50, 75, 100].includes(allocationPercentage)) {
        throw new Error("La asignación debe ser 25%, 50%, 75% o 100%")
      }
    }

    const dbUpdates = {
      ...updates,
      allocation:
        updates.allocation !== undefined
          ? Math.round(updates.allocation * 100)
          : undefined,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from("assignments")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single()

    if (error) throw new Error(`Error updating assignment: ${error.message}`)

    return {
      ...data,
      allocation: data.allocation / 100,
    }
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("assignments").delete().eq("id", id)
    if (error) throw new Error(`Error deleting assignment: ${error.message}`)
  },

  async checkAllocationConflicts(
    personId: string,
    startDate: string,
    endDate: string,
    excludeAssignmentId?: string,
  ): Promise<AssignmentWithRelations[]> {
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

    if (error) throw new Error(`Error checking allocation conflicts: ${error.message}`)

    return (
      data?.map((assignment) => ({
        ...assignment,
        allocation: assignment.allocation / 100,
      })) || []
    )
  },
}
