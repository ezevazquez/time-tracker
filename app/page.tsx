"use client"

import { Calendar, Users, FolderOpen, BarChart3, Plus, Database, Wifi } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/date-range-picker"
import { TimelineView } from "@/components/timeline-view"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { usePeople, useProjects, useAssignments } from "@/hooks/use-data"
import { isSupabaseConfigured } from "@/lib/supabase"
import { useState, useEffect } from "react"
import Link from "next/link"

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
          <CardHeader className="text-center">
            <CardTitle className="text-red-900">Error de Conexión</CardTitle>
            <CardDescription>No se pudo cargar los datos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md bg-red-50 p-4 mb-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <div className="text-xs text-gray-600 mb-4">
              <p>Verifica que:</p>
              <ul className="list-disc list-inside mt-2">
                <li>La URL de Supabase sea correcta</li>
                <li>La API Key tenga los permisos necesarios</li>
                <li>Las tablas existan en la base de datos</li>
              </ul>
            </div>
            <Button onClick={() => window.location.reload()} className="w-full">
              Reintentar
            </Button>
          </CardContent>
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

  const activeProjects = projects.filter((p) => p.status === "activo")
  const activePeople = people.filter((p) => p.status === "activo")
  const supabaseConfigured = isSupabaseConfigured()

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-primary">ResourceFlow</h1>
              <nav className="hidden md:flex space-x-6">
                <Link href="/" className="text-sm font-medium text-primary">
                  Dashboard
                </Link>
                <Link href="/people" className="text-sm font-medium text-muted-foreground hover:text-primary">
                  Personas
                </Link>
                <Link href="/projects" className="text-sm font-medium text-muted-foreground hover:text-primary">
                  Proyectos
                </Link>
                <Link href="/assignments" className="text-sm font-medium text-muted-foreground hover:text-primary">
                  Asignaciones
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-2">
              {/* Data Source Indicator */}
              <Badge variant="outline" className="hidden sm:flex">
                {supabaseConfigured ? (
                  <>
                    <Wifi className="h-3 w-3 mr-1" />
                    Supabase
                  </>
                ) : (
                  <>
                    <Database className="h-3 w-3 mr-1" />
                    Datos Demo
                  </>
                )}
              </Badge>
              <Button asChild>
                <Link href="/assignments/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Asignación
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        {/* Data Source Notice */}
        {!supabaseConfigured && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-blue-800">
                <Database className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Usando datos de demostración. Para conectar con Supabase, configura las variables de entorno
                  correspondientes.
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Personas Activas</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activePeople.length}</div>
              <p className="text-xs text-muted-foreground">
                {people.filter((p) => p.type === "interno").length} internos,{" "}
                {people.filter((p) => p.type === "externo").length} externos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Proyectos Activos</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeProjects.length}</div>
              <p className="text-xs text-muted-foreground">
                {projects.filter((p) => p.status === "cerrado").length} finalizados este año
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Asignaciones</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{assignments.length}</div>
              <p className="text-xs text-muted-foreground">
                {assignments.length > 0
                  ? `Promedio ${Math.round((assignments.reduce((acc, a) => acc + a.allocation, 0) / assignments.length) * 100)}% dedicación`
                  : "Sin asignaciones"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disponibilidad</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activePeople.length - new Set(assignments.map((a) => a.person_id)).size}
              </div>
              <p className="text-xs text-muted-foreground">Personas sin asignaciones</p>
            </CardContent>
          </Card>
        </div>

        {/* Timeline Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Vista:</label>
            <Select value={viewMode} onValueChange={setViewMode}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="people">Por Persona</SelectItem>
                <SelectItem value="projects">Por Proyecto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Período:</label>
            <DatePickerWithRange date={dateRange} setDate={setDateRange} />
          </div>
        </div>

        {/* Timeline View */}
        <Card>
          <CardHeader>
            <CardTitle>Timeline de {viewMode === "people" ? "Personas" : "Proyectos"}</CardTitle>
            <CardDescription>Visualización de asignaciones y disponibilidad</CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <TimelineView
                viewMode={viewMode}
                dateRange={dateRange}
                people={people}
                projects={projects}
                assignments={assignments}
              />
            </TooltipProvider>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/people/new">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Agregar Persona
                </CardTitle>
                <CardDescription>Registrar nuevo colaborador en el sistema</CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/projects/new">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FolderOpen className="h-5 w-5 mr-2" />
                  Crear Proyecto
                </CardTitle>
                <CardDescription>Definir nuevo proyecto para asignaciones</CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/assignments/new">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Nueva Asignación
                </CardTitle>
                <CardDescription>Asignar persona a proyecto con dedicación</CardDescription>
              </CardHeader>
            </Link>
          </Card>
        </div>
      </main>
    </div>
  )
}
