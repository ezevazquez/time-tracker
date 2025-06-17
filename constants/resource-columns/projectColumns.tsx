import { Badge } from '@/components/ui/badge'
import { Project } from '@/types/project'
import { getDuration } from '@/utils/getDuration'
import { getStatusBadge } from '@/utils/getStatusBadge'
import { getStatusLabel } from '@/utils/getStatusLabel'
import type { Project } from '@/types/project'
import {
  calculateFTEUtilization,
  isProjectOverallocated,
  calculateOverallocationPercentage,
} from '@/lib/utils/fte-calculations'

interface ProjectWithFTE extends Project {
  assignedFTE?: number
}

export const projectColumns = [
  {
    title: 'Código',
    render: (project: ProjectWithFTE) => (
      <div className="font-mono text-sm">
        {project.project_code || <span className="text-muted-foreground">-</span>}
      </div>
    ),
  },
  {
    title: 'Nombre',
    render: (project: ProjectWithFTE) => project.name,
  },
  {
    title: 'Descripción',
    render: (project: ProjectWithFTE) => project.description,
  },
  {
    title: 'Estado',
    render: (project: ProjectWithFTE) => (
      <Badge className={getStatusBadge(project.status)}>{getStatusLabel(project.status)}</Badge>
    ),
  },
  {
    title: 'FTE',
    render: (project: ProjectWithFTE) => {
      const assigned = project.assignedFTE || 0
      const total = project.fte || 0

      if (total === 0) {
        return <span className="text-muted-foreground">No definido</span>
      }

      const isOverallocated = isProjectOverallocated(assigned, total)
      const percentage = isOverallocated
        ? calculateOverallocationPercentage(assigned, total)
        : calculateFTEUtilization(assigned, total)

      return (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {assigned.toFixed(1)}/{total.toFixed(1)}
          </span>
          <Badge
            variant={isOverallocated ? 'destructive' : assigned === total ? 'default' : 'secondary'}
            className="text-xs"
          >
            {isOverallocated ? `+${percentage}%` : `${percentage}%`}
          </Badge>
        </div>
      )
    },
  },
]
