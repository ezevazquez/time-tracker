'use client'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Edit, Trash2, AlertTriangle, ArrowDown, ArrowUp } from 'lucide-react'
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
import React, { useState } from 'react'
import { renderDate } from '@/utils/renderDate'

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
  // Sorting state
  const [sortField, setSortField] = useState<'person' | 'profile' | 'project' | 'start' | 'end'>('start')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

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

  // Ordenar assignments por campo seleccionado
  const sortedAssignments = [...assignments].sort((a, b) => {
    let valA, valB
    if (sortField === 'person') {
      const personA = people.find(p => p.id === a.person_id)
      const personB = people.find(p => p.id === b.person_id)
      valA = personA ? `${personA.first_name} ${personA.last_name}`.toLowerCase() : ''
      valB = personB ? `${personB.first_name} ${personB.last_name}`.toLowerCase() : ''
    } else if (sortField === 'profile') {
      const personA = people.find(p => p.id === a.person_id)
      const personB = people.find(p => p.id === b.person_id)
      valA = personA?.profile?.toLowerCase() || ''
      valB = personB?.profile?.toLowerCase() || ''
    } else if (sortField === 'project') {
      const projectA = projects.find(p => p.id === a.project_id)
      const projectB = projects.find(p => p.id === b.project_id)
      valA = projectA?.name?.toLowerCase() || ''
      valB = projectB?.name?.toLowerCase() || ''
    } else if (sortField === 'start') {
      valA = parseDateFromString(a.start_date).getTime()
      valB = parseDateFromString(b.start_date).getTime()
    } else if (sortField === 'end') {
      valA = parseDateFromString(a.end_date).getTime()
      valB = parseDateFromString(b.end_date).getTime()
    }
    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
    } else {
      // fallback a 0 si es undefined
      const numA = typeof valA === 'number' ? valA : 0
      const numB = typeof valB === 'number' ? valB : 0
      return sortOrder === 'asc' ? numA - numB : numB - numA
    }
  })

  // Handler para cambiar sorting
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(order => order === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-x-auto border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort('person')}
                data-test="sort-person"
              >
                Persona
                <span className="inline-block align-middle ml-1">
                  {sortField === 'person' && (sortOrder === 'asc' ? <ArrowDown className="inline h-3 w-3" /> : <ArrowUp className="inline h-3 w-3" />)}
                </span>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort('profile')}
                data-test="sort-profile"
              >
                Perfil
                <span className="inline-block align-middle ml-1">
                  {sortField === 'profile' && (sortOrder === 'asc' ? <ArrowDown className="inline h-3 w-3" /> : <ArrowUp className="inline h-3 w-3" />)}
                </span>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort('project')}
                data-test="sort-project"
              >
                Proyecto
                <span className="inline-block align-middle ml-1">
                  {sortField === 'project' && (sortOrder === 'asc' ? <ArrowDown className="inline h-3 w-3" /> : <ArrowUp className="inline h-3 w-3" />)}
                </span>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort('start')}
                data-test="sort-start-date"
              >
                Inicio
                <span className="inline-block align-middle ml-1">
                  {sortField === 'start' && (sortOrder === 'asc' ? <ArrowDown className="inline h-3 w-3" /> : <ArrowUp className="inline h-3 w-3" />)}
                </span>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort('end')}
              >
                Fin
                <span className="inline-block align-middle ml-1">
                  {sortField === 'end' && (sortOrder === 'asc' ? <ArrowDown className="inline h-3 w-3" /> : <ArrowUp className="inline h-3 w-3" />)}
                </span>
              </TableHead>
              <TableHead className="text-center">Asignación</TableHead>
              <TableHead className="text-center">Facturable</TableHead>
              {/* <TableHead>Estado</TableHead> */}
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAssignments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No se encontraron asignaciones
                </TableCell>
              </TableRow>
            ) : (
              sortedAssignments.map(a => {
                const person = people.find(p => p.id === a.person_id)
                const project = projects.find(p => p.id === a.project_id)
                const isPersonOverallocated = overallocatedPersonIds.includes(a.person_id)
                return (
                  <TableRow key={a.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="font-medium">{person ? getDisplayName(person) : 'N/A'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">{person?.profile || 'Sin especificar'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{project?.name || 'N/A'}</div>
                      <div className="text-sm text-muted-foreground">{project?.status || ''}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{renderDate(a.start_date)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">{renderDate(a.end_date)}</div>
                    </TableCell>
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
                        <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0" data-test={`edit-assignment-${a.id}`}>
                          <Link href={`/assignments/${a.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(a.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          data-test={`delete-assignment-${a.id}`}
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
