'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, List, CalendarDays } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { ResourceTimeline } from '@/components/resource-timeline'
import { ResourceTable } from '@/components/resource-table'

import { FiltersPopover } from '@/components/filters-popover'

import { usePeople } from '@/hooks/use-people'
import { useProjects } from '@/hooks/use-projects'
import { useAssignments } from '@/hooks/use-assignments'

import { supabase } from '@/lib/supabase/client'
import { parseDateFromString, isOverallocated } from '@/lib/assignments'

export default function AssignmentsPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [mounted, setMounted] = useState(false)
  const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline')
  const scrollToTodayRef = useRef<(() => void) | null>(null)

  const defaultDateRange = {
    from: new Date(),
    to: (() => {
      const d = new Date()
      d.setFullYear(d.getFullYear() + 1)
      return d
    })(),
  }

  const [filters, setFilters] = useState({
    personProfile: '',
    projectStatus: '',
    dateRange: defaultDateRange,
    overallocatedOnly: false,
  })

  const { people, loading: loadingPeople } = usePeople()
  const { projects, loading: loadingProjects } = useProjects()
  const { assignments, loading: loadingAssignments, deleteAssignment } = useAssignments()

  const loading = loadingPeople || loadingProjects || loadingAssignments

  useEffect(() => {
    setMounted(true)

    const validateUser = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const session = sessionData?.session

      if (!session) return router.push('/login')

      const { data: allowed } = await supabase
        .from('auth_users')
        .select('email')
        .eq('email', session.user.email)
        .maybeSingle()

      if (!allowed) return router.push('/unauthorized')

      setAuthorized(true)
    }

    validateUser()
  }, [router])

  const clearFilters = () => {
    setFilters({
      personProfile: '',
      projectStatus: '',
      dateRange: defaultDateRange,
      overallocatedOnly: false,
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

  const hasActiveFilters = filters.personProfile || filters.projectStatus || filters.overallocatedOnly

  const filteredAssignments = useMemo(() => {
    return assignments.filter(assignment => {
      // Find the person and project for this assignment
      const person = people.find(p => p.id === assignment.person_id)
      const project = projects.find(p => p.id === assignment.project_id)

      // Filter by person profile
      if (filters.personProfile && person?.profile !== filters.personProfile) return false

      // Filter by project status
      if (filters.projectStatus && project?.status !== filters.projectStatus) return false

      // Date range filter (only for list view)
      if (viewMode === 'list') {
        const start = parseDateFromString(assignment.start_date)
        const end = parseDateFromString(assignment.end_date)
        if (end < filters.dateRange.from || start > filters.dateRange.to) return false
      }

      // Overallocated filter - use FTE logic
      if (filters.overallocatedOnly) {
        // Get all current assignments for this person
        const currentDate = new Date()
        const personCurrentAssignments = assignments.filter(a => {
          const start = parseDateFromString(a.start_date)
          const end = parseDateFromString(a.end_date)
          return a.person_id === assignment.person_id && start <= currentDate && end >= currentDate
        })
        
        // Calculate total FTE for this person
        const totalFte = personCurrentAssignments.reduce((sum, a) => sum + a.allocation, 0)
        
        // Only show assignments for people who are overallocated
        if (!isOverallocated(totalFte)) return false
      }

      return true
    })
  }, [assignments, filters, viewMode, people, projects])

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
            <h1 className="text-xl font-bold">Asignaciones</h1>
            <div className="flex gap-2 flex-wrap items-center">
              
              <Link href="/assignments/new">
                <Button size="sm" className="h-8">
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva asignación
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Second Header - Filters and Toggle */}
      <div className="flex-shrink-0 border-b bg-gray-50 py-2">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-end gap-2">
            <FiltersPopover
              people={people}
              projects={projects}
              filters={filters}
              onFiltersChange={setFilters}
              onClearFilters={clearFilters}
              showDateRange={viewMode === 'list'}
            />
            <ToggleGroup type="single" value={viewMode} onValueChange={(value) => {
              if (value) setViewMode(value as 'timeline' | 'list')
            }} className="bg-gray-100 p-1 rounded-lg shadow-sm">
              <ToggleGroupItem 
                value="timeline" 
                aria-label="Ver como timeline" 
                className="rounded-md data-[state=on]:bg-white data-[state=on]:shadow-md data-[state=on]:text-blue-600 data-[state=off]:text-gray-500 data-[state=off]:hover:text-gray-700 transition-all duration-200"
              >
                <CalendarDays className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="list" 
                aria-label="Ver como lista" 
                className="rounded-md data-[state=on]:bg-white data-[state=on]:shadow-md data-[state=on]:text-blue-600 data-[state=off]:text-gray-500 data-[state=off]:hover:text-gray-700 transition-all duration-200"
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
            people={people}
            projects={projects}
            assignments={filteredAssignments}
            filters={filters}
            onFiltersChange={setFilters}
            onClearFilters={clearFilters}
            onScrollToTodayRef={setScrollToTodayFunction}
          />
        ) : (
          <div className="h-full overflow-auto">
            <div className="container mx-auto px-4 py-4">
              <ResourceTable
                people={people}
                projects={projects}
                assignments={filteredAssignments}
                filters={filters}
                onFiltersChange={setFilters}
                onClearFilters={clearFilters}
                onDelete={handleDeleteAssignment}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
