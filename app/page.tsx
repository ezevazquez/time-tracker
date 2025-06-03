"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { usePeople, useProjects, useAssignments } from "@/hooks/use-data"
import { isSupabaseConfigured } from "@/lib/supabase"
import { DashboardStats } from "@/components/dashboard-stats"
import { DataSourceNotice } from "@/components/data-source-notice"
import { ResourceTimeline } from "@/components/resource-timeline"

export default function Dashboard() {
  const [viewMode, setViewMode] = useState("people")
  const [dateRange, setDateRange] = useState({
    from: new Date(2024, 0, 1),
    to: new Date(2024, 11, 31),
  })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const { people, loading: peopleLoading, error: peopleError } = usePeople()
  const { projects, loading: projectsLoading, error: projectsError } = useProjects()
  const { assignments, loading: assignmentsLoading, error: assignmentsError } = useAssignments()

  const loading = peopleLoading || projectsLoading || assignmentsLoading
  const error = peopleError || projectsError || assignmentsError
  const supabaseConfigured = isSupabaseConfigured()

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Inicializando aplicación...</p>
        </div>
      </div>
    )
  }

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

  return (
    <main className="flex-1 container mx-auto px-4 py-6">
      {/* Data Source Notice */}
      {!supabaseConfigured && <DataSourceNotice />}

      {/* Stats Cards */}
      <DashboardStats people={people} projects={projects} assignments={assignments} />

      {/* Resource Timeline */}
      <ResourceTimeline
        people={people}
        projects={projects}
        assignments={assignments}
        viewMode={viewMode}
        setViewMode={setViewMode}
        dateRange={dateRange}
        setDateRange={setDateRange}
      />

      {/* Quick Actions */}
    </main>
  )
}
