'use client'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Edit, Trash2, AlertTriangle, ArrowDown, ArrowUp, ChevronDown, ChevronRight } from 'lucide-react'
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
import { getDisplayName, getPersonTypeBadge } from '@/lib/people'
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
  viewMode?: 'timeline' | 'list'
}

// Constante para ancho y padding de la columna Acciones
const ACTIONS_COL_STYLE = { width: 80, paddingRight: 24 };
// Constante para ancho de la columna de asignaciones
const ASSIGN_COL_STYLE = { width: 120 };

export function ResourceTable({
  people,
  projects,
  assignments,
  filters,
  onFiltersChange,
  onClearFilters,
  onDelete,
  viewMode = 'list',
}: ResourceTableProps) {
  // Sorting state
  const [sortField, setSortField] = useState<'person' | 'profile' | 'project' | 'start' | 'end'>('start')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Estado para expandir/collapse por persona
  const [expandedPersonIds, setExpandedPersonIds] = useState<string[]>([])

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

  // Agrupar asignaciones por persona
  const assignmentsByPerson = people.map(person => {
    const personAssignments = assignments.filter(a => a.person_id === person.id)
    const totalFte = personAssignments.reduce((sum, a) => sum + a.allocation, 0)
    return {
      person,
      assignments: personAssignments,
      totalFte,
      isOverallocated: isOverallocated(totalFte),
    }
  })

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
              <TableHead>Persona</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-center" style={ASSIGN_COL_STYLE}>Asignación</TableHead>
              <TableHead className="text-right" style={ACTIONS_COL_STYLE}>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignmentsByPerson.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No se encontraron asignaciones
                </TableCell>
              </TableRow>
            ) : (
              assignmentsByPerson.map(({ person, assignments, totalFte, isOverallocated }) => (
                <React.Fragment key={person.id}>
                  <TableRow
                    className={assignments.length > 0 ? "hover:bg-muted/50 cursor-pointer" : "bg-white"}
                    style={{ height: 36, minHeight: 36 }}
                    onClick={assignments.length > 0 ? () => setExpandedPersonIds(ids => ids.includes(person.id) ? ids.filter(id => id !== person.id) : [...ids, person.id]) : undefined}
                  >
                    <TableCell className="align-middle" style={{ verticalAlign: 'middle' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        {assignments.length > 0 && (expandedPersonIds.includes(person.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
                        <span className="font-medium">{getDisplayName(person)}</span>
                      </span>
                    </TableCell>
                    <TableCell className="align-middle" style={{ verticalAlign: 'middle' }}>{person.profile}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPersonTypeBadge(person.type)}`}>
                        {person.type === 'Internal' ? 'Interno' : person.type === 'External' ? 'Externo' : person.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-center align-middle" style={{ ...ASSIGN_COL_STYLE, verticalAlign: 'middle' }}>
                      <div className="flex items-center justify-center min-h-[36px] h-full">
                        <Badge variant={isOverallocated ? 'destructive' : 'secondary'} className="text-xs">
                          {fteToPercentage(totalFte)}%
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right align-middle" style={{ ...ACTIONS_COL_STYLE, verticalAlign: 'middle' }}>
                      <div className="flex items-center justify-end min-h-[36px] h-full">
                        <Button size="icon" variant="ghost" asChild>
                          <Link href={`/people/${person.id}/edit`}><Edit className="w-4 h-4" /></Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedPersonIds.includes(person.id) && assignments.length > 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="p-0 bg-gray-50" style={{ paddingLeft: 32, paddingRight: 0 }}>
                        <div style={{ width: '100%' }}>
                          <Table className="w-full text-sm">
                            <TableHeader>
                              <TableRow>
                                <TableHead>Proyecto</TableHead>
                                <TableHead>Inicio</TableHead>
                                <TableHead>Fin</TableHead>
                                <TableHead className="text-center">Facturable</TableHead>
                                <TableHead className="text-center" style={ASSIGN_COL_STYLE}>Asignación</TableHead>
                                <TableHead className="text-right" style={ACTIONS_COL_STYLE}>Acciones</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {assignments.map(a => {
                                const project = projects.find(p => p.id === a.project_id)
                                return (
                                  <TableRow key={a.id}>
                                    <TableCell>{project?.name || 'N/A'}</TableCell>
                                    <TableCell>{renderDate(a.start_date)}</TableCell>
                                    <TableCell>{renderDate(a.end_date)}</TableCell>
                                    <TableCell className="text-center">{a.is_billable ? 'Sí' : 'No'}</TableCell>
                                    <TableCell className="text-center align-middle" style={ASSIGN_COL_STYLE}>
                                      <div className="flex items-center justify-center min-h-[36px] h-full">
                                        <Badge variant={isOverallocated ? 'destructive' : 'secondary'} className="text-xs">
                                          {fteToPercentage(a.allocation)}%
                                        </Badge>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right" style={ACTIONS_COL_STYLE}>
                                      <div className="flex flex-row gap-1 justify-end items-center min-h-[36px] h-full">
                                        <Button size="icon" variant="ghost" asChild><Link href={`/assignments/${a.id}/edit?view=${viewMode}`}><Edit className="w-4 h-4" /></Link></Button>
                                        <Button size="icon" variant="ghost" onClick={e => { e.stopPropagation(); onDelete(a.id) }}><Trash2 className="w-4 h-4" /></Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
