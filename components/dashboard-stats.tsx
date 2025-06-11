'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, FolderOpen, Calendar, TrendingUp } from 'lucide-react'
import type { Person, Project, AssignmentWithRelations } from '@/lib/supabase'

interface DashboardStatsProps {
  people: Person[]
  projects: Project[]
  assignments: AssignmentWithRelations[]
}

export function DashboardStats({ people, projects, assignments }: DashboardStatsProps) {
  // Calculate active counts
  const activePeople = people.filter(p => p.status === 'activo').length
  const activeProjects = projects.filter(p => p.status === 'activo').length
  const activeAssignments = assignments.filter(a => {
    const endDate = new Date(a.end_date)
    const today = new Date()
    return endDate >= today
  }).length

  // Calculate utilization rate
  const totalPeople = people.length
  const peopleWithAssignments = new Set(
    assignments
      .filter(a => {
        const endDate = new Date(a.end_date)
        const today = new Date()
        return endDate >= today
      })
      .map(a => a.person_id)
  ).size

  const utilizationRate =
    totalPeople > 0 ? Math.round((peopleWithAssignments / totalPeople) * 100) : 0

  console.log('Dashboard Stats:', {
    totalPeople,
    activePeople,
    totalProjects: projects.length,
    activeProjects,
    totalAssignments: assignments.length,
    activeAssignments,
    utilizationRate,
  })

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Personas Activas</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activePeople}</div>
          <p className="text-xs text-muted-foreground">de {totalPeople} total</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Proyectos Activos</CardTitle>
          <FolderOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeProjects}</div>
          <p className="text-xs text-muted-foreground">de {projects.length} total</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Asignaciones Activas</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeAssignments}</div>
          <p className="text-xs text-muted-foreground">de {assignments.length} total</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tasa de Utilización</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{utilizationRate}%</div>
          <p className="text-xs text-muted-foreground">
            {peopleWithAssignments} personas asignadas
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
