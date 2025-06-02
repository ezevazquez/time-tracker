"use client"

import { useState, useEffect } from "react"
import { peopleService, projectsService, assignmentsService } from "@/lib/database"
import type { Person, Project, AssignmentWithRelations } from "@/lib/supabase"

export function usePeople() {
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPeople = async () => {
    try {
      setLoading(true)
      const data = await peopleService.getAll()
      setPeople(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading people")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPeople()
  }, [])

  const createPerson = async (person: Omit<Person, "id" | "created_at" | "updated_at">) => {
    try {
      const newPerson = await peopleService.create(person)
      setPeople((prev) => [...prev, newPerson])
      return newPerson
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Error creating person")
    }
  }

  const updatePerson = async (id: string, updates: Partial<Person>) => {
    try {
      const updatedPerson = await peopleService.update(id, updates)
      setPeople((prev) => prev.map((p) => (p.id === id ? updatedPerson : p)))
      return updatedPerson
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Error updating person")
    }
  }

  const deletePerson = async (id: string) => {
    try {
      await peopleService.delete(id)
      setPeople((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Error deleting person")
    }
  }

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

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const data = await projectsService.getAll()
      setProjects(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading projects")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const createProject = async (project: Omit<Project, "id" | "created_at" | "updated_at">) => {
    try {
      const newProject = await projectsService.create(project)
      setProjects((prev) => [...prev, newProject])
      return newProject
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Error creating project")
    }
  }

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      const updatedProject = await projectsService.update(id, updates)
      setProjects((prev) => prev.map((p) => (p.id === id ? updatedProject : p)))
      return updatedProject
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Error updating project")
    }
  }

  const deleteProject = async (id: string) => {
    try {
      await projectsService.delete(id)
      setProjects((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Error deleting project")
    }
  }

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

export function useAssignments() {
  const [assignments, setAssignments] = useState<AssignmentWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAssignments = async () => {
    try {
      setLoading(true)
      const data = await assignmentsService.getAll()
      setAssignments(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading assignments")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssignments()
  }, [])

  const createAssignment = async (
    assignment: Omit<AssignmentWithRelations, "id" | "created_at" | "updated_at" | "people" | "projects">,
  ) => {
    try {
      const newAssignment = await assignmentsService.create(assignment)
      await fetchAssignments() // Refetch to get relations
      return newAssignment
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Error creating assignment")
    }
  }

  const updateAssignment = async (id: string, updates: Partial<AssignmentWithRelations>) => {
    try {
      const updatedAssignment = await assignmentsService.update(id, updates)
      await fetchAssignments() // Refetch to get relations
      return updatedAssignment
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Error updating assignment")
    }
  }

  const deleteAssignment = async (id: string) => {
    try {
      await assignmentsService.delete(id)
      setAssignments((prev) => prev.filter((a) => a.id !== id))
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Error deleting assignment")
    }
  }

  const checkAllocationConflicts = async (
    personId: string,
    startDate: string,
    endDate: string,
    excludeAssignmentId?: string,
  ) => {
    try {
      return await assignmentsService.checkAllocationConflicts(personId, startDate, endDate, excludeAssignmentId)
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Error checking allocation conflicts")
    }
  }

  return {
    assignments,
    loading,
    error,
    refetch: fetchAssignments,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    checkAllocationConflicts,
  }
}
