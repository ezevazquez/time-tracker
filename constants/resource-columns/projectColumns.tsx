import { Badge } from '@/components/ui/badge'
import { getStatusBadge } from '@/utils/getStatusBadge'
import { getStatusLabel } from '@/utils/getStatusLabel'
import type { Project } from '@/types/project'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, Search, MoreHorizontal, Edit, Trash2, Calendar, Eye } from 'lucide-react'

interface ProjectWithFTE extends Project {
  assignedFTE?: number
}

export const projectColumns = [
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
      
      const percentage = Math.round((assigned / total) * 100)
      const isOverallocated = assigned > total
      
      return (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {assigned.toFixed(1)}/{total.toFixed(1)}
          </span>
          <Badge 
            variant={isOverallocated ? 'destructive' : assigned === total ? 'default' : 'secondary'}
            className="text-xs"
          >
            {percentage}%
          </Badge>
        </div>
      )
    },
  },
]
