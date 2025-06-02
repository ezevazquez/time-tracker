import {
  supabase,
  isSupabaseConfigured,
  type Person,
  type Project,
  type Assignment,
  type AssignmentWithRelations,
} from "./supabase"
import { mockPeople, mockProjects, mockAssignments, mockAssignmentsWithRelations } from "./mock-data"

// Helper function to simulate async operations for mock data
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// People operations
export const peopleService = {
  async getAll(): Promise<Person[]> {
    if (!isSupabaseConfigured()) {
      console.log("Using mock data for people")
      await delay(500)
      return [...mockPeople]
    }

    try {
      const { data, error } = await supabase.from("people").select("*").order("name")

      if (error) {
        console.error("Error fetching people:", error)
        throw new Error(`Error loading people: ${error.message}`)
      }
      return data || []
    } catch (err) {
      console.error("Service error:", err)
      throw err
    }
  },

  async getById(id: string): Promise<Person | null> {
    if (!isSupabaseConfigured()) {
      await delay(300)
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
      await delay(800)
      const newPerson: Person = {
        ...person,
        id: Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      mockPeople.push(newPerson)
      return newPerson
    }

    try {
      const { data, error } = await supabase.from("people").insert([person]).select().single()

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
      await delay(600)
      const index = mockPeople.findIndex((p) => p.id === id)
      if (index === -1) throw new Error("Person not found")

      const updatedPerson = {
        ...mockPeople[index],
        ...updates,
        updated_at: new Date().toISOString(),
      }
      mockPeople[index] = updatedPerson
      return updatedPerson
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
      await delay(400)
      const index = mockPeople.findIndex((p) => p.id === id)
      if (index === -1) throw new Error("Person not found")
      mockPeople.splice(index, 1)
      return
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

// Projects operations
export const projectsService = {
  async getAll(): Promise<Project[]> {
    if (!isSupabaseConfigured()) {
      console.log("Using mock data for projects")
      await delay(500)
      return [...mockProjects]
    }

    try {
      const { data, error } = await supabase.from("projects").select("*").order("name")

      if (error) {
        console.error("Error fetching projects:", error)
        throw new Error(`Error loading projects: ${error.message}`)
      }
      return data || []
    } catch (err) {
      console.error("Service error:", err)
      throw err
    }
  },

  async getById(id: string): Promise<Project | null> {
    if (!isSupabaseConfigured()) {
      await delay(300)
      return mockProjects.find((p) => p.id === id) || null
    }

    try {
      const { data, error } = await supabase.from("projects").select("*").eq("id", id).single()

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
      await delay(800)
      const newProject: Project = {
        ...project,
        id: Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      mockProjects.push(newProject)
      return newProject
    }

    try {
      const { data, error } = await supabase.from("projects").insert([project]).select().single()

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
      await delay(600)
      const index = mockProjects.findIndex((p) => p.id === id)
      if (index === -1) throw new Error("Project not found")

      const updatedProject = {
        ...mockProjects[index],
        ...updates,
        updated_at: new Date().toISOString(),
      }
      mockProjects[index] = updatedProject
      return updatedProject
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
      await delay(400)
      const index = mockProjects.findIndex((p) => p.id === id)
      if (index === -1) throw new Error("Project not found")
      mockProjects.splice(index, 1)
      return
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

// Assignments operations
export const assignmentsService = {
  async getAll(): Promise<AssignmentWithRelations[]> {
    if (!isSupabaseConfigured()) {
      console.log("Using mock data for assignments")
      await delay(500)
      return [...mockAssignmentsWithRelations]
    }

    try {
      const { data, error } = await supabase
        .from("assignments")
        .select(`
          *,
          people:person_id(*),
          projects:project_id(*)
        `)
        .order("start_date", { ascending: false })

      if (error) {
        console.error("Error fetching assignments:", error)
        throw new Error(`Error loading assignments: ${error.message}`)
      }
      return data || []
    } catch (err) {
      console.error("Service error:", err)
      throw err
    }
  },

  async getById(id: string): Promise<AssignmentWithRelations | null> {
    if (!isSupabaseConfigured()) {
      await delay(300)
      return mockAssignmentsWithRelations.find((a) => a.id === id) || null
    }

    try {
      const { data, error } = await supabase
        .from("assignments")
        .select(`
          *,
          people:person_id(*),
          projects:project_id(*)
        `)
        .eq("id", id)
        .single()

      if (error) {
        console.error("Error fetching assignment:", error)
        throw new Error(`Error loading assignment: ${error.message}`)
      }
      return data
    } catch (err) {
      console.error("Service error:", err)
      throw err
    }
  },

  async getByPersonId(personId: string): Promise<Assignment[]> {
    if (!isSupabaseConfigured()) {
      await delay(300)
      return mockAssignments.filter((a) => a.person_id === personId)
    }

    try {
      const { data, error } = await supabase
        .from("assignments")
        .select("*")
        .eq("person_id", personId)
        .order("start_date")

      if (error) {
        console.error("Error fetching assignments by person:", error)
        throw new Error(`Error loading assignments: ${error.message}`)
      }
      return data || []
    } catch (err) {
      console.error("Service error:", err)
      throw err
    }
  },

  async getByProjectId(projectId: string): Promise<Assignment[]> {
    if (!isSupabaseConfigured()) {
      await delay(300)
      return mockAssignments.filter((a) => a.project_id === projectId)
    }

    try {
      const { data, error } = await supabase
        .from("assignments")
        .select("*")
        .eq("project_id", projectId)
        .order("start_date")

      if (error) {
        console.error("Error fetching assignments by project:", error)
        throw new Error(`Error loading assignments: ${error.message}`)
      }
      return data || []
    } catch (err) {
      console.error("Service error:", err)
      throw err
    }
  },

  async create(assignment: Omit<Assignment, "id" | "created_at" | "updated_at">): Promise<Assignment> {
    if (!isSupabaseConfigured()) {
      await delay(800)
      const newAssignment: Assignment = {
        ...assignment,
        id: Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      mockAssignments.push(newAssignment)

      // Update the relations array
      const assignmentWithRelations: AssignmentWithRelations = {
        ...newAssignment,
        people: mockPeople.find((p) => p.id === assignment.person_id),
        projects: mockProjects.find((p) => p.id === assignment.project_id),
      }
      mockAssignmentsWithRelations.push(assignmentWithRelations)

      return newAssignment
    }

    try {
      const { data, error } = await supabase.from("assignments").insert([assignment]).select().single()

      if (error) {
        console.error("Error creating assignment:", error)
        throw new Error(`Error creating assignment: ${error.message}`)
      }
      return data
    } catch (err) {
      console.error("Service error:", err)
      throw err
    }
  },

  async update(id: string, updates: Partial<Assignment>): Promise<Assignment> {
    if (!isSupabaseConfigured()) {
      await delay(600)
      const index = mockAssignments.findIndex((a) => a.id === id)
      if (index === -1) throw new Error("Assignment not found")

      const updatedAssignment = {
        ...mockAssignments[index],
        ...updates,
        updated_at: new Date().toISOString(),
      }
      mockAssignments[index] = updatedAssignment

      // Update the relations array
      const relationsIndex = mockAssignmentsWithRelations.findIndex((a) => a.id === id)
      if (relationsIndex !== -1) {
        mockAssignmentsWithRelations[relationsIndex] = {
          ...updatedAssignment,
          people: mockPeople.find((p) => p.id === updatedAssignment.person_id),
          projects: mockProjects.find((p) => p.id === updatedAssignment.project_id),
        }
      }

      return updatedAssignment
    }

    try {
      const { data, error } = await supabase
        .from("assignments")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()

      if (error) {
        console.error("Error updating assignment:", error)
        throw new Error(`Error updating assignment: ${error.message}`)
      }
      return data
    } catch (err) {
      console.error("Service error:", err)
      throw err
    }
  },

  async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      await delay(400)
      const index = mockAssignments.findIndex((a) => a.id === id)
      if (index === -1) throw new Error("Assignment not found")
      mockAssignments.splice(index, 1)

      const relationsIndex = mockAssignmentsWithRelations.findIndex((a) => a.id === id)
      if (relationsIndex !== -1) {
        mockAssignmentsWithRelations.splice(relationsIndex, 1)
      }
      return
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
  ): Promise<{ hasConflict: boolean; totalAllocation: number }> {
    if (!isSupabaseConfigured()) {
      await delay(300)
      const conflictingAssignments = mockAssignments.filter((assignment) => {
        if (excludeAssignmentId && assignment.id === excludeAssignmentId) return false
        if (assignment.person_id !== personId) return false

        // Check for date overlap
        const assignmentStart = new Date(assignment.start_date)
        const assignmentEnd = new Date(assignment.end_date)
        const checkStart = new Date(startDate)
        const checkEnd = new Date(endDate)

        return (
          (checkStart <= assignmentEnd && checkEnd >= assignmentStart) ||
          (assignmentStart <= checkEnd && assignmentEnd >= checkStart)
        )
      })

      const totalAllocation = conflictingAssignments.reduce((sum, assignment) => sum + assignment.allocation, 0)

      return {
        hasConflict: totalAllocation >= 1,
        totalAllocation,
      }
    }

    try {
      let query = supabase
        .from("assignments")
        .select("allocation")
        .eq("person_id", personId)
        .or(`start_date.lte.${endDate},end_date.gte.${startDate}`)

      if (excludeAssignmentId) {
        query = query.neq("id", excludeAssignmentId)
      }

      const { data, error } = await query

      if (error) {
        console.error("Error checking allocation conflicts:", error)
        throw new Error(`Error checking conflicts: ${error.message}`)
      }

      const totalAllocation = (data || []).reduce((sum, assignment) => sum + assignment.allocation, 0)

      return {
        hasConflict: totalAllocation >= 1,
        totalAllocation,
      }
    } catch (err) {
      console.error("Service error:", err)
      throw err
    }
  },
}
