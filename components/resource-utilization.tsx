'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Users, TrendingUp, TrendingDown } from 'lucide-react'
import type { Person } from '@/types/people'
import type { AssignmentWithRelations } from '@/types/assignment'
import { PERSON_STATUS } from '@/constants/people'
import { getDisplayName, getInitials } from '@/lib/people'
import { parseDateFromString } from '@/lib/assignments'
import { isOverallocated, fteToPercentage, getUtilizationStatus } from '@/lib/utils/fte-calculations'

interface ResourceUtilizationProps {
  people: Person[]
  assignments: AssignmentWithRelations[]
}

interface UtilizationData extends Person {
  utilization: number
  totalFte: number
  assignmentsCount: number
  isOverallocated: boolean
  isUnderutilized: boolean
  utilizationStatus: 'overallocated' | 'optimal' | 'underutilized'
  color: string
  bgColor: string
}

export function ResourceUtilization({ people, assignments }: ResourceUtilizationProps) {
  const currentDate = new Date()

  // Calculate utilization for each active person using FTE
  const utilizationData: UtilizationData[] = people
    .filter(person => person.status === PERSON_STATUS.ACTIVE)
    .map(person => {
      const currentAssignments = assignments.filter(assignment => {
        const start = parseDateFromString(assignment.start_date)
        const end = parseDateFromString(assignment.end_date)
        return assignment.person_id === person.id && start <= currentDate && end >= currentDate
      })

      const totalFte = currentAssignments.reduce(
        (sum, assignment) => sum + assignment.allocation,
        0
      )

      const utilizationStatus = getUtilizationStatus(totalFte)

      return {
        ...person,
        utilization: utilizationStatus.percentage,
        totalFte,
        assignmentsCount: currentAssignments.length,
        isOverallocated: isOverallocated(totalFte),
        isUnderutilized: totalFte < 0.5,
        utilizationStatus: utilizationStatus.status,
        color: utilizationStatus.color,
        bgColor: utilizationStatus.bgColor,
      }
    })
    .sort((a, b) => b.totalFte - a.totalFte)

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
        <CardTitle className="flex items-center justify-between" data-test="resource-utilization-title">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Utilización de personas
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
        {/* <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Utilización Promedio del Equipo
            </span>
            <span className="text-lg font-bold text-gray-900">{avgUtilization}%</span>
          </div>
          <Progress value={avgUtilization} className="h-2" />
        </div> */}

        <div className="space-y-4 max-h-[calc(150vh-24rem)] overflow-y-auto">
          {utilizationData.map(person => (
            <div
              key={person.id}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback className="text-sm bg-gray-100">
                  {getInitials(person)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{getDisplayName(person)}</p>
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
                    className={`text-sm font-medium min-w-[3rem] text-right ${person.color}`}
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
