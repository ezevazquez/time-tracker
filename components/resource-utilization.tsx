'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Users, TrendingUp, TrendingDown } from 'lucide-react'
import type { Person, AssignmentWithRelations } from '@/lib/supabase'

interface ResourceUtilizationProps {
  people: Person[]
  assignments: AssignmentWithRelations[]
}

export function ResourceUtilization({ people, assignments }: ResourceUtilizationProps) {
  const currentDate = new Date()

  // Calculate utilization for each active person
  const utilizationData = people
    .filter(person => person.status === 'Active')
    .map(person => {
      const currentAssignments = assignments.filter(assignment => {
        const start = new Date(assignment.start_date)
        const end = new Date(assignment.end_date)
        return assignment.person_id === person.id && start <= currentDate && end >= currentDate
      })

      const totalAllocation = currentAssignments.reduce(
        (sum, assignment) => sum + assignment.allocation * 100,
        0
      )

      return {
        ...person,
        utilization: Math.round(totalAllocation),
        assignmentsCount: currentAssignments.length,
        isOverallocated: totalAllocation > 100,
        isUnderutilized: totalAllocation < 50,
      }
    })
    .sort((a, b) => b.utilization - a.utilization)

  const avgUtilization =
    utilizationData.length > 0
      ? Math.round(
          utilizationData.reduce((sum, person) => sum + person.utilization, 0) /
            utilizationData.length
        )
      : 0

  const overallocatedCount = utilizationData.filter(p => p.isOverallocated).length
  const underutilizedCount = utilizationData.filter(p => p.isUnderutilized).length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Utilización de Recursos
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-red-500" />
              <span className="text-red-600">{overallocatedCount} sobreasignados</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingDown className="h-4 w-4 text-yellow-500" />
              <span className="text-yellow-600">{underutilizedCount} subutilizados</span>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Utilización Promedio del Equipo
            </span>
            <span className="text-lg font-bold text-gray-900">{avgUtilization}%</span>
          </div>
          <Progress value={avgUtilization} className="h-2" />
        </div>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {utilizationData.map(person => (
            <div
              key={person.id}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback className="text-sm bg-gray-100">
                  {person.name
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{person.name}</p>
                  {person.isOverallocated && (
                    <Badge variant="destructive" className="text-xs">
                      Sobreasignado
                    </Badge>
                  )}
                  {person.isUnderutilized && (
                    <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                      Subutilizado
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs text-gray-600">{person.profile}</p>
                  <span className="text-xs text-gray-400">•</span>
                  <p className="text-xs text-gray-600">
                    {person.assignmentsCount} asignación{person.assignmentsCount !== 1 ? 'es' : ''}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Progress value={Math.min(person.utilization, 100)} className="flex-1 h-2" />
                  <span
                    className={`text-sm font-medium min-w-[3rem] text-right ${
                      person.isOverallocated
                        ? 'text-red-600'
                        : person.isUnderutilized
                          ? 'text-yellow-600'
                          : 'text-green-600'
                    }`}
                  >
                    {person.utilization}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
