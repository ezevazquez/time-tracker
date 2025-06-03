"use client"

import { useState, useEffect } from "react"
import { peopleService, projectsService, assignmentsService } from "@/lib/database"
import type { Person, Project, AssignmentWithRelations } from "@/lib/supabase"

// People hook
export function usePeople() {
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPeople = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("Fetching people...")
      const data = await peopleService.getAll()
      console.log("People fetched:", data.length, "items")
      setPeople(data)
    } catch (err) {
      console.error("Error in usePeople:", err)
      setError(err instanceof Error ? err.message : "Error loading people")
    } finally {
      setLoading(false)
    }
  }

  const createPerson = async (person: Omit<Person, "id" | "created_at" | "updated_at">) => {
    try {
      const newPerson = await peopleService.create(person)
      setPeople((prev) => [...prev, newPerson])
      return newPerson
    } catch (err) {
      throw err
    }
  }

  const updatePerson = async (id: string, updates: Partial<Person>) => {
    try {
      const updatedPerson = await peopleService.update(id, updates)
      setPeople((prev) => prev.map((p) => (p.id === id ? updatedPerson : p)))
      return updatedPerson
    } catch (err) {
      throw err
    }
  }

  const deletePerson = async (id: string) => {
    try {
      await peopleService.delete(id)
      setPeople((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      throw err
    }
  }

  useEffect(() => {
    fetchPeople()
  }, [])

  return {
    people,
    loading,
    error,
    refetch: fetchPeople,
    createPerson,
    updatePerson,
    deletePerson,
  }
}

// Projects hook
export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("Fetching projects...")
      const data = await projectsService.getAll()
      console.log("Projects fetched:", data.length, "items")
      setProjects(data)
    } catch (err) {
      console.error("Error in useProjects:", err)
      setError(err instanceof Error ? err.message : "Error loading projects")
    } finally {
      setLoading(false)
    }
  }

  const createProject = async (project: Omit<Project, "id" | "created_at" | "updated_at">) => {
    try {
      const newProject = await projectsService.create(project)
      setProjects((prev) => [...prev, newProject])
      return newProject
    } catch (err) {
      throw err
    }
  }

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      const updatedProject = await projectsService.update(id, updates)
      setProjects((prev) => prev.map((p) => (p.id === id ? updatedProject : p)))
      return updatedProject
    } catch (err) {
      throw err
    }
  }

  const deleteProject = async (id: string) => {
    try {
      await projectsService.delete(id)
      setProjects((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      throw err
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  return {
    projects,
    loading,
    error,
    refetch: fetchProjects,
    createProject,
    updateProject,
    deleteProject,
  }
}

// Assignments hook
export function useAssignments() {
  const [assignments, setAssignments] = useState<AssignmentWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAssignments = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("Fetching assignments...")
      const data = await assignmentsService.getAll()
      console.log("Assignments fetched:", data.length, "items")
      setAssignments(data)
    } catch (err) {
      console.error("Error in useAssignments:", err)
      setError(err instanceof Error ? err.message : "Error loading assignments")
    } finally {
      setLoading(false)
    }
  }

  const createAssignment = async (
    assignment: Omit<AssignmentWithRelations, "id" | "created_at" | "updated_at" | "people" | "projects">,
  ) => {
    try {
      const newAssignment = await assignmentsService.create(assignment)
      await fetchAssignments() // Refetch to get the relations
      return newAssignment
    } catch (err) {
      throw err
    }
  }

  const updateAssignment = async (id: string, updates: Partial<AssignmentWithRelations>) => {
    try {
      const updatedAssignment = await assignmentsService.update(id, updates)
      await fetchAssignments() // Refetch to get the relations
      return updatedAssignment
    } catch (err) {
      throw err
    }
  }

  const deleteAssignment = async (id: string) => {
    try {
      await assignmentsService.delete(id)
      setAssignments((prev) => prev.filter((a) => a.id !== id))
    } catch (err) {
      throw err
    }
  }

  useEffect(() => {
    fetchAssignments()
  }, [])

  return {
    assignments,
    loading,
    error,
    refetch: fetchAssignments,
    createAssignment,
    updateAssignment,
    deleteAssignment,
  }
}
