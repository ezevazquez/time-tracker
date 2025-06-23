'use client'

import { useState, useEffect } from 'react'
import { projectsService } from '@/lib/services/projects.service'
import { assignmentsService } from '@/lib/services/assignments.service'
import type { Project } from '@/types/project'

interface ProjectWithFTE extends Project {
  assignedFTE?: number
  clients?: {
    id: string
    name: string
  }
}

export function useProjects() {
  const [projects, setProjects] = useState<ProjectWithFTE[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const projectsData = await projectsService.getAll()
      
      // Obtener FTE asignado para cada proyecto
      const projectsWithFTE = await Promise.all(
        projectsData.map(async (project) => {
          try {
            const assignedFTE = await projectsService.getAssignedFTE(project.id)
            return { ...project, assignedFTE }
          } catch (error) {
            console.error(`Error getting FTE for project ${project.id}:`, error)
            return { ...project, assignedFTE: 0 }
          }
        })
      )
      
      setProjects(projectsWithFTE)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar proyectos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const createProject = async (project: Omit<Project, 'created_at' | 'updated_at'>) => {
    try {
      const newProject = await projectsService.create(project)
      setProjects(prev => [{ ...newProject, assignedFTE: 0 }, ...prev])
      return newProject
    } catch (err) {
      throw err
    }
  }

  const updateProject = async (id: string, project: Partial<Project>) => {
    try {
      const updatedProject = await projectsService.update(id, project)
      setProjects(prev => prev.map(p => p.id === id ? { ...updatedProject, assignedFTE: p.assignedFTE } : p))
      return updatedProject
    } catch (err) {
      throw err
    }
  }

  const deleteProject = async (id: string) => {
    try {
      // Validar que el proyecto no tenga asignaciones asociadas
      const assignments = await assignmentsService.getAll()
      const hasAssignments = assignments.some(a => a.project_id === id)
      if (hasAssignments) {
        throw new Error('No se puede borrar el proyecto porque tiene asignaciones asociadas.')
      }
      await projectsService.delete(id)
      setProjects(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      throw err
    }
  }

  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    refetch: fetchProjects
  }
}
