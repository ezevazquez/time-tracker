'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, List, CalendarDays, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { ResourceTimeline } from '@/components/resource-timeline'
import { ResourceTable } from '@/components/resource-table'

import { FiltersPopover } from '@/components/filters-popover'
import { Input } from '@/components/ui/input'

import { usePeople } from '@/hooks/use-people'
import { useProjects } from '@/hooks/use-projects'
import { useAssignments } from '@/hooks/use-assignments'
import { useProfiles } from '@/hooks/use-profiles'

import { supabase } from '@/lib/supabase/client'
import { parseDateFromString } from '@/lib/assignments'
import { fteToPercentage, isOverallocated } from '@/lib/utils/fte-calculations'
import { AssignmentModal } from '@/components/assignment-modal'
import type { TimelineFilters } from '@/types/timeline'

export default function AssignmentsPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [mounted, setMounted] = useState(false)
  const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline')
  const scrollToTodayRef = useRef<(() => void) | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  const defaultDateRange = {
    from: (() => {
      const d = new Date()
      d.setDate(d.getDate() - 7)
      return d
    })(),
    to: (() => {
      const d = new Date()
      d.setDate(d.getDate() + 30)
      return d
    })(),
  }

  const [filters, setFilters] = useState<TimelineFilters>({
    personProfile: [],
    projectStatus: '',
    dateRange: { from: defaultDateRange.from, to: defaultDateRange.to },
    overallocatedOnly: false,
    personType: 'all',
    search: '',
  })

  const { people, loading: loadingPeople } = usePeople()
  const { projects, loading: loadingProjects } = useProjects()
  const { assignments, loading: loadingAssignments, deleteAssignment, createAssignment, updateAssignment } = useAssignments()
  const { profiles, loading: loadingProfiles } = useProfiles()

  const loading = loadingPeople || loadingProjects || loadingAssignments || loadingProfiles

  useEffect(() => {
    setMounted(true)

    const validateUser = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const session = sessionData?.session

      if (!session) return router.push('/login')

      setAuthorized(true)
    }

    validateUser()
  }, [router])

  const clearFilters = () => {
    setFilters({
      personProfile: [],
      projectStatus: '',
      dateRange: {
        from: defaultDateRange.from,
        to: defaultDateRange.to,
      },
      overallocatedOnly: false,
      personType: 'all',
      search: '',
    })
  }

  const handleScrollToToday = () => {
    console.log('handleScrollToToday called, scrollToTodayRef.current:', scrollToTodayRef.current)
    if (scrollToTodayRef.current) {
      console.log('Calling scrollToTodayRef.current function')
      scrollToTodayRef.current()
    } else {
      console.log('scrollToTodayRef.current is null or undefined')
    }
  }

  const setScrollToTodayFunction = (fn: (() => void) | null) => {
    console.log('setScrollToTodayFunction called with:', fn)
    scrollToTodayRef.current = fn
  }

  const hasActiveFilters = filters.personProfile.length > 0 || filters.projectStatus || filters.overallocatedOnly

  // Filtrado por búsqueda
  const searchLower = filters.search?.toLowerCase() || ''
  const filteredPeople = useMemo(() => {
    let result = [...people]
    if (searchLower) {
      result = result.filter(person => {
        const fullName = `${person.first_name} ${person.last_name}`.toLowerCase()
        const profile = person.profile?.toLowerCase() || ''
        // Buscar también en los proyectos asignados a la persona
        const personProjects = assignments
          .filter(a => a.person_id === person.id)
          .map(a => projects.find(p => p.id === a.project_id))
          .filter(Boolean)
          .map(p => p?.name?.toLowerCase() || '')
          .join(' ')
        
        return (
          fullName.includes(searchLower) ||
          profile.includes(searchLower) ||
          personProjects.includes(searchLower)
        )
      })
    }
    if (filters.personProfile.length > 0) {
      result = result.filter(person => filters.personProfile.includes(person.profile || ''))
    }
    if (filters.personType && filters.personType !== 'all') {
      result = result.filter(person => person.type === filters.personType)
    }
    if (filters.overallocatedOnly) {
      const from = filters.dateRange?.from
      const to = filters.dateRange?.to
      if (from && to) {
        result = result.filter(person => {
          const personAssignments = assignments.filter(a => {
            const start = parseDateFromString(a.start_date)
            const end = parseDateFromString(a.end_date)
            return a.person_id === person.id && end >= from && start <= to
          })
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
        })
      }
    }
    return result
  }, [people, filters, viewMode, assignments, searchLower])

  const filteredAssignments = useMemo(() => {
    let result = assignments
    if (searchLower) {
      result = result.filter(a => {
        const person = people.find(p => p.id === a.person_id)
        const project = projects.find(p => p.id === a.project_id)
        const personName = person ? `${person.first_name} ${person.last_name}`.toLowerCase() : ''
        const projectName = project?.name?.toLowerCase() || ''
        const profile = person?.profile?.toLowerCase() || ''
        return (
          personName.includes(searchLower) ||
          projectName.includes(searchLower) ||
          profile.includes(searchLower)
        )
      })
    }
    if (viewMode === 'timeline') {
      const peopleIds = new Set(filteredPeople.map(p => p.id))
      result = result.filter(assignment => peopleIds.has(assignment.person_id))
    }
    // Modo tabla: aplicar los filtros de perfil, tipo, fechas y sobreasignados
    result = result.filter(assignment => {
      const person = people.find(p => p.id === assignment.person_id)
      // Filtro por perfil
      if (filters.personProfile.length > 0 && !filters.personProfile.includes(person?.profile || '')) return false
      // Filtro por tipo
      if (filters.personType && filters.personType !== 'all' && person?.type !== filters.personType) return false
      // Filtro por fechas
      const start = parseDateFromString(assignment.start_date)
      const end = parseDateFromString(assignment.end_date)
      if (!filters.dateRange.to || end < filters.dateRange.from || start > filters.dateRange.to) return false
      // Filtro de sobreasignados
      if (filters.overallocatedOnly) {
        // Obtener todas las asignaciones de la persona en el rango
        const personAssignments = assignments.filter(a => {
          const aStart = parseDateFromString(a.start_date)
          const aEnd = parseDateFromString(a.end_date)
          return a.person_id === assignment.person_id && aEnd >= filters.dateRange.from && (filters.dateRange.to ? aStart <= filters.dateRange.to : true)
        })
        // Calcular FTE máximo en cualquier día del rango
        let isOver = false
        if (filters.dateRange.to) {
          for (let d = new Date(filters.dateRange.from); d <= filters.dateRange.to; d.setDate(d.getDate() + 1)) {
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
        }
        if (!isOver) return false
      }
      return true
    })
    return result
  }, [assignments, filters, viewMode, people, projects, filteredPeople, searchLower])

  const handleDeleteAssignment = async (id: string) => {
    if (confirm('¿Estás seguro de que querés eliminar esta asignación?')) {
      try {
        await deleteAssignment(id)
      } catch (error) {
        console.error('Error al eliminar la asignación:', error)
        alert('Error al eliminar la asignación')
      }
    }
  }

  if (!mounted || authorized === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-center">Validando sesión...</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando asignaciones...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="flex-1 w-full h-[92vh] flex flex-col">
      {/* Fixed Header */}
      <div className="flex-shrink-0 border-b bg-white py-2">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold" data-test="assigments-title">Asignaciones</h1>
            <div className="flex gap-2 flex-wrap items-center">
              
              <Button size="sm" className="h-8" onClick={() => setCreateModalOpen(true)} data-test="new-assignment-button">
                <Plus className="h-4 w-4" />
                Crear asignación
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Second Header - Filters and Toggle */}
      <div className="flex-shrink-0 border-b bg-gray-50 py-2">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-end gap-2">
            {/* Buscador a la izquierda */}
            <div className="flex-1 flex justify-start">
              <div className="w-full max-w-xs relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <Search className="h-4 w-4" />
                </span>
                <Input
                  type="text"
                  placeholder="Buscar personas, proyectos, perfiles..."
                  value={filters.search}
                  onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                  className="bg-white pl-10"
                  data-test="search-input"
                />
              </div>
            </div>
            <FiltersPopover
              people={people}
              projects={projects}
              profiles={profiles}
              filters={filters}
              onFiltersChange={setFilters as (filters: TimelineFilters) => void}
              onClearFilters={clearFilters}
              showDateRange={viewMode === 'list'}
              mode={viewMode}
            />
            <ToggleGroup type="single" value={viewMode} onValueChange={(value) => {
              if (value) setViewMode(value as 'timeline' | 'list')
            }} className="bg-gray-100 p-1 rounded-lg shadow-sm">
              <ToggleGroupItem 
                value="timeline" 
                aria-label="Ver como timeline" 
                className="rounded-md data-[state=on]:bg-white data-[state=on]:shadow-md data-[state=on]:text-blue-600 data-[state=off]:text-gray-500 data-[state=off]:hover:text-gray-700 transition-all duration-200"
                data-test="toggle-timeline-button"
              >
                <CalendarDays className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="list" 
                aria-label="Ver como lista" 
                className="rounded-md data-[state=on]:bg-white data-[state=on]:shadow-md data-[state=on]:text-blue-600 data-[state=off]:text-gray-500 data-[state=off]:hover:text-gray-700 transition-all duration-200"
                data-test="toggle-list-button"
              >
                <List className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {viewMode === 'timeline' ? (
          <ResourceTimeline
            people={filteredPeople}
            projects={projects}
            assignments={filteredAssignments}
            filters={filters as any}
            onFiltersChange={setFilters}
            onClearFilters={clearFilters}
            onScrollToTodayRef={setScrollToTodayFunction}
            onDeleteAssignment={deleteAssignment}
            onCreateAssignment={createAssignment}
            onUpdateAssignment={updateAssignment}
          />
        ) : (
          <div className="h-full overflow-auto">
            <div className="container mx-auto px-4 py-4">
              <ResourceTable
                people={people}
                projects={projects}
                assignments={filteredAssignments}
                filters={filters as any}
                onFiltersChange={setFilters}
                onClearFilters={clearFilters}
                onDelete={handleDeleteAssignment}
              />
            </div>
          </div>
        )}
      </div>

      <AssignmentModal
        open={createModalOpen}
        mode="new"
        onSave={async (data) => {
          await createAssignment(data)
          setCreateModalOpen(false)
        }}
        onCancel={() => setCreateModalOpen(false)}
      />
    </main>
  )
}
