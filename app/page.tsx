'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { usePeople } from '@/hooks/use-people'
import { useProjects } from '@/hooks/use-projects'
import { useAssignments } from '@/hooks/use-assignments'
import { useClients } from '@/hooks/use-clients'

import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'

import { Card } from '@/components/ui/card'
import { DashboardHeader } from '@/components/dashboard-header'
import { StatsOverview } from '@/components/stats-overview'
import { ProjectStatusChart } from '@/components/project-status-chart'
import { TeamWorkloadChart } from '@/components/team-workload-chart'
import { RecentActivity } from '@/components/recent-activity'
import { UpcomingDeadlines } from '@/components/upcoming-deadlines'
import { ResourceUtilization } from '@/components/resource-utilization'
import { OverallocatedProjectsChart } from '@/components/overallocated-projects-chart'

export default function Dashboard() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [mounted, setMounted] = useState(false)

  const { people, loading: peopleLoading, error: peopleError } = usePeople()
  const { projects, loading: projectsLoading, error: projectsError } = useProjects()
  const { assignments, loading: assignmentsLoading, error: assignmentsError } = useAssignments()
  const { clients, loading: clientsLoading, error: clientsError } = useClients()

  const loading = peopleLoading || projectsLoading || assignmentsLoading || clientsLoading
  const error = peopleError || projectsError || assignmentsError || clientsError
  const supabaseConfigured = isSupabaseConfigured()

  // 🔐 Session validation
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

  // ❌ Error state
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

  // 🔃 Loading data
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  // ✅ Main dashboard
  return (
    <main className="flex-1 w-full min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <DashboardHeader />

        {/* Stats Overview */}
        <StatsOverview
          people={people}
          projects={projects}
          assignments={assignments}
          clients={clients}
        />

        {/* Main Grid */}
        <div className="space-y-6">
          {/* Charts Row - 3 columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ProjectStatusChart projects={projects} />
            <TeamWorkloadChart people={people} assignments={assignments} />
            <OverallocatedProjectsChart projects={projects} assignments={assignments} />
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - 2/3 width */}
            <div className="lg:col-span-2">
              <ResourceUtilization people={people} assignments={assignments} />
            </div>

            {/* Right Column - 1/3 width */}
            <div className="space-y-6">
              <RecentActivity assignments={assignments} people={people} projects={projects} />
              <UpcomingDeadlines projects={projects} assignments={assignments} />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
