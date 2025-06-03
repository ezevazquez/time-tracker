"use client"

import { Users, FolderOpen, BarChart3, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Person, Project, AssignmentWithRelations } from "@/lib/supabase"

interface DashboardStatsProps {
  people: Person[]
  projects: Project[]
  assignments: AssignmentWithRelations[]
}

export function DashboardStats({ people, projects, assignments }: DashboardStatsProps) {
  const activePeople = people.filter((p) => p.status === "activo")
  const activeProjects = projects.filter((p) => p.status === "activo")

  return (
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
  )
}
