import { Project } from '@/types/project'
import {
  PROJECT_STATUS,
  ACTIVE_PROJECT_STATUSES,
  INACTIVE_PROJECT_STATUSES,
} from '@/constants/projects'

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
