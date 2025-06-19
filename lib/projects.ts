import type { Project } from '@/types/project'
import { PROJECT_STATUS, ACTIVE_PROJECT_STATUSES, INACTIVE_PROJECT_STATUSES } from '@/constants/projects'

export function getActiveProjects(projects: Project[]) {
  return projects.filter(p =>
    ACTIVE_PROJECT_STATUSES.includes(p.status as (typeof ACTIVE_PROJECT_STATUSES)[number])
  )
}

export function getInactiveProjects(projects: Project[]) {
  return projects.filter(p =>
    INACTIVE_PROJECT_STATUSES.includes(p.status as (typeof INACTIVE_PROJECT_STATUSES)[number])
  )
}

export function getProjectStatusBadge(
  status: string
): 'default' | 'success' | 'warning' | 'destructive' {
  switch (status) {
    case PROJECT_STATUS.IN_PROGRESS:
      return 'success'
    case PROJECT_STATUS.FINISHED:
      return 'default'
    case PROJECT_STATUS.ON_HOLD:
      return 'warning'
    case PROJECT_STATUS.NOT_STARTED:
      return 'destructive'
    default:
      return 'default'
  }
}

/**
 * Get CSS classes for project status badge
 */
export function getStatusBadge(status?: string) {
  const variants = {
    'In Progress': 'bg-green-100 text-green-800',
    'On Hold': 'bg-yellow-100 text-yellow-800',
    Finished: 'bg-gray-100 text-gray-800',
    'Not Started': 'bg-blue-100 text-blue-800',
  }

  if (!status) {
    return 'bg-gray-100 text-gray-800' // Default case if status is undefined
  }

  return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'
}

/**
 * Get localized label for project status
 */
export function getStatusLabel(status?: string) {
  const labels = {
    'In Progress': 'En Progreso',
    'On Hold': 'En Pausa',
    Finished: 'Finalizado',
    'Not Started': 'No Iniciado',
  }

  return labels[status as keyof typeof labels] || status
}

/**
 * Calculate duration between two dates
 */
export function getDuration(startDate: string, endDate: string | null) {
  if (!endDate) return 'En curso'

  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  const months = Math.floor(diffDays / 30)
  const days = diffDays % 30

  if (months > 0) {
    return `${months}m ${days}d`
  }
  return `${days}d`
}
