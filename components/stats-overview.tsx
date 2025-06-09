"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Users, Briefcase, Calendar, Building2, TrendingUp, AlertTriangle } from "lucide-react"
import type { Person, Project, AssignmentWithRelations, Client } from "@/lib/supabase"

interface StatsOverviewProps {
  people: Person[]
  projects: Project[]
  assignments: AssignmentWithRelations[]
  clients: Client[]
}

export function StatsOverview({ people, projects, assignments, clients }: StatsOverviewProps) {
  // Calculate stats
  const activePeople = people.filter((p) => p.status === "Active").length
  const activeProjects = projects.filter((p) => p.status === "Active").length
  const totalAssignments = assignments.length
  const totalClients = clients.length

  // Calculate utilization
  const currentDate = new Date()
  const currentAssignments = assignments.filter((a) => {
    const start = new Date(a.start_date)
    const end = new Date(a.end_date)
    return start <= currentDate && end >= currentDate
  })

  const avgUtilization =
    currentAssignments.length > 0
      ? Math.round(currentAssignments.reduce((sum, a) => sum + a.allocation * 100, 0) / currentAssignments.length)
      : 0

  // Overallocated people
  const overallocatedCount = people.filter((person) => {
    const personAssignments = currentAssignments.filter((a) => a.person_id === person.id)
    const totalAllocation = personAssignments.reduce((sum, a) => sum + a.allocation * 100, 0)
    return totalAllocation > 100
  }).length

  const stats = [
    {
      title: "Equipo Activo",
      value: activePeople,
      total: people.length,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      description: `${people.length - activePeople} inactivos`,
    },
    {
      title: "Proyectos Activos",
      value: activeProjects,
      total: projects.length,
      icon: Briefcase,
      color: "text-green-600",
      bgColor: "bg-green-50",
      description: `${projects.length - activeProjects} completados/pausados`,
    },
    {
      title: "Asignaciones",
      value: totalAssignments,
      total: currentAssignments.length,
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      description: `${currentAssignments.length} activas`,
    },
    {
      title: "Clientes",
      value: totalClients,
      total: null,
      icon: Building2,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      description: "Total registrados",
    },
    {
      title: "Utilización Promedio",
      value: `${avgUtilization}%`,
      total: null,
      icon: TrendingUp,
      color: avgUtilization > 80 ? "text-red-600" : avgUtilization > 60 ? "text-yellow-600" : "text-green-600",
      bgColor: avgUtilization > 80 ? "bg-red-50" : avgUtilization > 60 ? "bg-yellow-50" : "bg-green-50",
      description: "Del equipo activo",
    },
    {
      title: "Sobreasignados",
      value: overallocatedCount,
      total: activePeople,
      icon: AlertTriangle,
      color: overallocatedCount > 0 ? "text-red-600" : "text-green-600",
      bgColor: overallocatedCount > 0 ? "bg-red-50" : "bg-green-50",
      description: overallocatedCount > 0 ? "Requieren atención" : "Todo bajo control",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  {stat.total && <p className="text-sm text-gray-500">/{stat.total}</p>}
                </div>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
