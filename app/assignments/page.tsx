'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, List, CalendarDays } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ResourceTimeline } from '@/components/resource-timeline'
import { ResourceTable } from '@/components/resource-table'
import { ReportModal } from '@/components/report-modal'
import { Card } from '@/components/ui/card'

import { usePeople } from '@/hooks/use-people'
import { useProjects } from '@/hooks/use-projects'
import { useAssignments } from '@/hooks/use-assignments'

import { supabase } from '@/lib/supabase/client'
import { parseDateFromString } from '@/lib/assignments'

export default function AssignmentsPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [mounted, setMounted] = useState(false)
  const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline')

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

      // Overallocated filter
      if (filters.overallocatedOnly && assignment.allocation <= 100) return false

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
    <main className="flex-1 w-full h-screen flex flex-col">
      {/* Header -  */}
      <div className="flex-shrink-0 border-b bg-white py-2">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Asignaciones</h1>
            <div className="flex gap-2 flex-wrap">
              <ReportModal />
              <Button
                variant="outline"
                onClick={() => setViewMode(viewMode === 'timeline' ? 'list' : 'timeline')}
                size="sm"
                className="h-8"
              >
                {viewMode === 'timeline' ? (
                  <>
                    <List className="mr-2 h-4 w-4" />
                    Ver como lista
                  </>
                ) : (
                  <>
                    <CalendarDays className="mr-2 h-4 w-4" />
                    Ver como timeline
                  </>
                )}
              </Button>
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

      {/* Filters */}
      <Card className="mb-6">
        {/* Rest of the component content */}
      </Card>

      {/* Content */}
      <div className="flex-1 min-h-0 flex flex-col">
        {viewMode === 'timeline' ? (
          <ResourceTimeline
            people={people}
            projects={projects}
            assignments={filteredAssignments}
            filters={filters}
            onFiltersChange={setFilters}
            onClearFilters={clearFilters}
          />
        ) : (
          <div className="flex-1 min-h-0 overflow-auto">
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
