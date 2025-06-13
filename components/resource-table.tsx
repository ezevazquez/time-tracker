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
import { fteToPercentage, parseDateFromString, isOverallocated } from '@/lib/assignments'
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
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No se encontraron asignaciones
                </TableCell>
              </TableRow>
            ) : (
              assignments.map(a => {
                const person = people.find(p => p.id === a.person_id)
                const project = projects.find(p => p.id === a.project_id)
                
                // Calculate if person is overallocated using FTE logic
                const currentDate = new Date()
                const personCurrentAssignments = assignments.filter(assignment => {
                  const start = parseDateFromString(assignment.start_date)
                  const end = parseDateFromString(assignment.end_date)
                  return assignment.person_id === a.person_id && start <= currentDate && end >= currentDate
                })
                
                const totalFte = personCurrentAssignments.reduce((sum, assignment) => sum + assignment.allocation, 0)
                const isPersonOverallocated = isOverallocated(totalFte)

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
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {isPersonOverallocated && (
                          <Badge variant="destructive" className="text-xs w-fit">
                            Sobreasignado
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs w-fit">
                          {project?.status || 'N/A'}
                        </Badge>
                      </div>
                    </TableCell>
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
