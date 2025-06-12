'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Users, Briefcase, Calendar, Building2, TrendingUp, AlertTriangle } from 'lucide-react'
import type { Person } from '@/types/people'
import type { Project } from '@/types/project'
import type { AssignmentWithRelations } from '@/types/assignment'
import type { Client } from '@/types/client'
import { ACTIVE_PERSON_STATUSES } from '@/constants/people'

interface StatsOverviewProps {
  people: Person[]
  projects: Project[]
  assignments: AssignmentWithRelations[]
  clients: Client[]
}

export function StatsOverview({ people, projects, assignments, clients }: StatsOverviewProps) {
  // Calculate stats
  const activePeople = people.filter(p => ACTIVE_PERSON_STATUSES.includes(p.status as any)).length
  const activeProjects = projects.filter(p => p.status === 'In Progress').length
  const totalAssignments = assignments.length
  const totalClients = clients.length

  // Calculate utilization
  const currentDate = new Date()
  const currentAssignments = assignments.filter(a => {
    const start = new Date(a.start_date)
    const end = new Date(a.end_date)
    return start <= currentDate && end >= currentDate
  })

  const assignedPeopleToday = new Set(
    currentAssignments.map(a => a.person_id)
  )
  const totalActivePeople = people.filter(p => ACTIVE_PERSON_STATUSES.includes(p.status as any)).length
  
  const avgUtilization =
    totalActivePeople > 0
      ? Math.round((assignedPeopleToday.size / totalActivePeople) * 100)
      : 0
  
  // Overallocated people
  const overallocatedCount = people.filter(person => {
    const personAssignments = currentAssignments.filter(a => a.person_id === person.id)
    const totalAllocation = personAssignments.reduce((sum, a) => sum + a.allocation, 0)
    return totalAllocation > 100
  }).length

  const stats = [
    {
      title: 'Equipo Activo',
      value: activePeople,
      total: people.length,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: `${people.length - activePeople} inactivos`,
    },
    {
      title: 'Sobreasignados',
      value: overallocatedCount,
      total: activePeople,
      icon: AlertTriangle,
      color: overallocatedCount > 0 ? 'text-red-600' : 'text-green-600',
      bgColor: overallocatedCount > 0 ? 'bg-red-50' : 'bg-green-50',
      description: overallocatedCount > 0 ? 'Requieren atención' : 'Todo bajo control',
    },
    {
      title: 'Utilización Promedio',
      value: `${avgUtilization}%`,
      total: null,
      icon: TrendingUp,
      color:
        avgUtilization > 80
          ? 'text-red-600'
          : avgUtilization > 60
            ? 'text-yellow-600'
            : 'text-green-600',
      bgColor:
        avgUtilization > 80 ? 'bg-red-50' : avgUtilization > 60 ? 'bg-yellow-50' : 'bg-green-50',
      description: 'Del equipo activo',
    },
    {
      title: 'Asignaciones',
      value: totalAssignments,
      total: currentAssignments.length,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: `${currentAssignments.length} activas`,
    },
    {
      title: 'Proyectos Activos',
      value: activeProjects,
      total: projects.length,
      icon: Briefcase,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: `${projects.length - activeProjects} completados/pausados`,
    },
    {
      title: 'Clientes',
      value: totalClients,
      total: null,
      icon: Building2,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: 'Total registrados',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow flex flex-col justify-between">
          <CardContent className="p-4 h-full flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <div className={`p-2 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
  
            <div className="mt-4">
              <div className="flex items-baseline gap-1">
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                {stat.total && <p className="text-sm text-gray-500">/{stat.total}</p>}
              </div>
            </div>
  
            <p className="text-xs text-gray-500 mt-auto pt-4">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
