'use client'

import { useState, useEffect } from 'react'
import { projectsService } from '@/lib/services/projects.service'
import type { Project } from '@/types/project'

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    projectsService.getAll()
      .then(setProjects)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const createProject = async (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => {
    const newProject = await projectsService.create(project)
    setProjects(prev => [...prev, newProject])
    return newProject
  }

  const updateProject = async (id: string, updates: Partial<Project>) => {
    const updated = await projectsService.update(id, updates)
    setProjects(prev => prev.map(p => (p.id === id ? updated : p)))
    return updated
  }

  const deleteProject = async (id: string) => {
    await projectsService.delete(id)
    setProjects(prev => prev.filter(p => p.id !== id))
  }

  return { projects, loading, error, createProject, updateProject, deleteProject }
}
