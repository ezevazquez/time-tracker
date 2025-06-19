'use client'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Edit, Trash2, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Person } from '@/types/people'
import type { Project } from '@/types/project'
import type { AssignmentWithRelations } from '@/types/assignment'
import { parseDateFromString } from '@/lib/assignments'
import { fteToPercentage, isOverallocated } from '@/lib/utils/fte-calculations'
import { getDisplayName } from '@/lib/people'

interface ResourceTableProps {
  people: Person[]
  projects: Project[]
  assignments: AssignmentWithRelations[]
  filters: {
    personProfile: string
    projectStatus: string
    dateRange: { from: Date; to: Date }
    overallocatedOnly: boolean
  }
  onFiltersChange: (filters: any) => void
  onClearFilters: () => void
  onDelete: (id: string) => void
}

export function ResourceTable({
  people,
  projects,
  assignments,
  filters,
  onFiltersChange,
  onClearFilters,
  onDelete,
}: ResourceTableProps) {
  // Calcular personas sobreasignadas en el rango
  const overallocatedPersonIds = (() => {
    const from = filters.dateRange?.from
    const to = filters.dateRange?.to
    if (!from || !to) return []
    return people.filter(person => {
      const personAssignments = assignments.filter(a => a.person_id === person.id && parseDateFromString(a.end_date) >= from && parseDateFromString(a.start_date) <= to)
      let isOver = false
      for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
        const fte = personAssignments.reduce((sum, a) => {
          const aStart = parseDateFromString(a.start_date)
          const aEnd = parseDateFromString(a.end_date)
          if (aStart <= d && aEnd >= d) return sum + a.allocation
          return sum
        }, 0)
        if (isOverallocated(fte)) {
          isOver = true
          break
        }
      }
      return isOver
    }).map(p => p.id)
  })()

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-x-auto border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Período</TableHead>
              <TableHead>Persona</TableHead>
              <TableHead>Proyecto</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead className="text-center">Asignación</TableHead>
              <TableHead className="text-center">Facturable</TableHead>
              {/* <TableHead>Estado</TableHead> */}
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No se encontraron asignaciones
                </TableCell>
              </TableRow>
            ) : (
              assignments.map(a => {
                const person = people.find(p => p.id === a.person_id)
                const project = projects.find(p => p.id === a.project_id)
                const isPersonOverallocated = overallocatedPersonIds.includes(a.person_id)
                return (
                  <TableRow key={a.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">
                          {format(parseDateFromString(a.start_date), 'dd MMM yyyy', { locale: es })}
                        </div>
                        <div className="text-muted-foreground">
                          {format(parseDateFromString(a.end_date), 'dd MMM yyyy', { locale: es })}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{person ? getDisplayName(person) : 'N/A'}</div>
                        <div className="text-sm text-muted-foreground">{person?.profile || ''}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{project?.name || 'N/A'}</div>
                        <div className="text-sm text-muted-foreground">{project?.status || ''}</div>
                      </div>
                    </TableCell>
                    <TableCell>{a.assigned_role || 'Sin especificar'}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Badge
                          variant={isPersonOverallocated ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {fteToPercentage(a.allocation)}%
                        </Badge>
                        {isPersonOverallocated && <AlertTriangle className="h-4 w-4 text-destructive" />}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={a.is_billable ? 'default' : 'secondary'} className="text-xs">
                        {a.is_billable ? 'Sí' : 'No'}
                      </Badge>
                    </TableCell>
                    {/* Estado eliminado */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
                          <Link href={`/assignments/${a.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(a.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
