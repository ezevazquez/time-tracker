import { Badge } from '@/components/ui/badge'
import { Project } from '@/lib/supabase'
import { getDuration } from '@/utils/getDuration'
import { getStatusBadge } from '@/utils/getStatusBadge'
import { getStatusLabel } from '@/utils/getStatusLabel'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, Search, MoreHorizontal, Edit, Trash2, Calendar, Eye } from 'lucide-react'

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
