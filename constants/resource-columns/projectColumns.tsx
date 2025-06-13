import { Badge } from '@/components/ui/badge'
import { Project } from '@/types/project'
import { getDuration } from '@/utils/getDuration'
import { getStatusBadge } from '@/utils/getStatusBadge'
import { getStatusLabel } from '@/utils/getStatusLabel'

export const projectColumns = [
  {
    title: 'Nombre',
    render: (project: Project) => project.name,
  },
  {
    title: 'Descripción',
    render: (project: Project) => project.description,
  },
  {
    title: 'Estado',
    render: (project: Project) => (
      <Badge className={getStatusBadge(project.status)}>{getStatusLabel(project.status)}</Badge>
    ),
  },
  {
    title: 'Duración',
    render: (project: Project) => {
      project.start_date && project.end_date
        ? getDuration(project.start_date, project.end_date)
        : 'No definido'
    },
  },
]
