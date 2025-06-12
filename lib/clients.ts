import type { Client } from '@/types/client'
import type { Project } from '@/types/project'

/**
 * Agrupa proyectos por cliente.
 */
export function groupProjectsByClient(projects: Project[]): Record<string, Project[]> {
  return projects.reduce((acc, project) => {
    const clientId = project.client_id ?? 'unknown'
    if (!acc[clientId]) acc[clientId] = []
    acc[clientId].push(project)
    return acc
  }, {} as Record<string, Project[]>)
}

/**
 * Cuenta cuántos proyectos tiene cada cliente.
 */
export function countProjectsPerClient(projects: Project[]): Record<string, number> {
  return projects.reduce((acc, project) => {
    const clientId = project.client_id ?? 'unknown'
    acc[clientId] = (acc[clientId] || 0) + 1
    return acc
  }, {} as Record<string, number>)
}

/**
 * Devuelve los N clientes con más proyectos.
 */
export function getTopClients(clients: Client[], projectCounts: Record<string, number>, topN = 5): Client[] {
  return [...clients]
    .sort((a, b) => (projectCounts[b.id] || 0) - (projectCounts[a.id] || 0))
    .slice(0, topN)
}
