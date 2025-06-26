import { Badge } from '@/components/ui/badge'
import type { Project } from '@/types/project'
import { calculateFTEUtilization, isProjectOverallocated, calculateOverallocationPercentage } from '@/lib/utils/fte-calculations'
import { getStatusBadge, getStatusLabel } from '@/lib/projects'
import { renderDate } from '@/utils/renderDate'
import calculateMonths from '@/utils/calculateMonths'

interface ProjectWithFTE extends Project {
  assignedFTE?: number
}

export const projectColumns = [
  {
    title: 'Código',
    key: 'codigo',
    render: (project: ProjectWithFTE) => (
      <div className="font-mono text-sm">
        {project.project_code || <span className="text-muted-foreground">-</span>}
      </div>
    ),
  },
  {
    title: 'Nombre',
    key: 'nombre',
    render: (project: ProjectWithFTE) => project.name,
  },
  {
    title: 'Cliente',
    key: 'cliente',
    render: (project: ProjectWithFTE & { clients?: { name: string } }) =>
      project.clients?.name || <span className="text-muted-foreground">Sin cliente</span>,
  },
  {
    title: 'Estado',
    key: 'estado',
    render: (project: ProjectWithFTE) => (
      <Badge className={getStatusBadge(project.status)}>{getStatusLabel(project.status)}</Badge>
    ),
  },
  {
    title: 'Fechas (duración)',
    key: 'fechas',
    render: (project: ProjectWithFTE) => {
      const { start_date, end_date } = project
      if (!start_date || !end_date) return <span className="text-muted-foreground">-</span>
      const months = calculateMonths(start_date, end_date)
      return (
        <div className="flex flex-col text-sm">
          <span>{renderDate(start_date)} - {renderDate(end_date)}</span>
          <span className="text-xs text-muted-foreground">({months} meses)</span>
        </div>
      )
    },
  },
  {
    title: 'FTE',
    key: 'fte',
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
