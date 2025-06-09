'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

import { Card } from '@/components/ui/card'
import { usePeople, useProjects, useAssignments } from '@/hooks/use-data'
import { DashboardStats } from '@/components/dashboard-stats'


export default function Dashboard() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [mounted, setMounted] = useState(false)

  const [viewMode, setViewMode] = useState('people')
  const [dateRange, setDateRange] = useState({
    from: new Date(2024, 0, 1),
    to: new Date(2024, 11, 31),
  })

  // Add filters state to match ResourceTimeline interface
  const [filters, setFilters] = useState({
    personProfile: "",
    projectStatus: "",
    dateRange: dateRange,
    overallocatedOnly: false,
  })

  const { people, loading: peopleLoading, error: peopleError } = usePeople()
  const { projects, loading: projectsLoading, error: projectsError } = useProjects()
  const { assignments, loading: assignmentsLoading, error: assignmentsError } = useAssignments()

  const loading = peopleLoading || projectsLoading || assignmentsLoading
  const error = peopleError || projectsError || assignmentsError
  const supabaseConfigured = isSupabaseConfigured()

  // Clear filters function
  const clearFilters = () => {
    setFilters({
      personProfile: "",
      projectStatus: "",
      dateRange: dateRange,
      overallocatedOnly: false,
    })
  }

  // 🔐 Validación de sesión y email autorizado
  useEffect(() => {
    setMounted(true)

    const validateUser = async () => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      const session = sessionData?.session

      if (!session || sessionError) {
        router.push('/login')
        return
      }

      const { data: allowed } = await supabase
        .from('auth_users')
        .select('email')
        .eq('email', session.user.email)
        .maybeSingle()

      if (!allowed) {
        router.push('/unauthorized')
        return
      }

      setAuthorized(true)
    }

    validateUser()
  }, [router])

  // 🔄 Pantalla de carga inicial (montado o validación)
  if (!mounted || authorized === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-center">Validando sesión...</p>
      </div>
    )
  }

  // ❌ Error cargando datos
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <div className="p-6">
            <div className="text-center">
              <h2 className="text-red-900 text-lg font-semibold">Error de Conexión</h2>
              <p className="text-sm text-muted-foreground">No se pudo cargar los datos</p>
            </div>
            <div className="rounded-md bg-red-50 p-4 mb-4 mt-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // 🔃 Cargando datos
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando datos...</p>
        </div>
      </div>
    )
  }

  // ✅ Dashboard completo
  return (
    <main className="flex-1 w-full">
      {!supabaseConfigured && (
        <div className="container mx-auto px-4 pb-4">
          <DashboardStats people={people} projects={projects} assignments={assignments} />
        </div>
      )}

    </main>
  )
}
