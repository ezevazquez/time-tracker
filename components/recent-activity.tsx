'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Calendar } from 'lucide-react'
import { format, isAfter, isBefore, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Person } from '@/types/people'
import type { Project } from '@/types/project'
import type { AssignmentWithRelations } from '@/types/assignment'
import { parseDateFromString } from '@/lib/assignments'
import { fteToPercentage } from '@/lib/utils/fte-calculations'
import { getDisplayName, getInitials } from '@/lib/people'

interface RecentActivityProps {
  assignments: AssignmentWithRelations[]
  people: Person[]
  projects: Project[]
}

export function RecentActivity({ assignments, people, projects }: RecentActivityProps) {
  const currentDate = new Date()
  const weekFromNow = addDays(currentDate, 7)

  // Get recent and upcoming assignments
  const recentActivity = assignments
    .filter(assignment => {
      const startDate = parseDateFromString(assignment.start_date)
      const endDate = parseDateFromString(assignment.end_date)

      // Recently started (within last 7 days) or starting soon (within next 7 days)
      return (
        (isAfter(startDate, addDays(currentDate, -7)) &&
          isBefore(startDate, addDays(currentDate, 1))) ||
        (isAfter(startDate, currentDate) && isBefore(startDate, weekFromNow)) ||
        (isAfter(endDate, addDays(currentDate, -7)) && isBefore(endDate, addDays(currentDate, 1)))
      )
    })
    .sort((a, b) => parseDateFromString(a.start_date).getTime() - parseDateFromString(b.start_date).getTime())
    .slice(0, 6)

  const getActivityType = (assignment: AssignmentWithRelations) => {
    const startDate = parseDateFromString(assignment.start_date)
    const endDate = parseDateFromString(assignment.end_date)

    if (isAfter(endDate, addDays(currentDate, -7)) && isBefore(endDate, addDays(currentDate, 1))) {
      return { type: 'completed', label: 'Completado', color: 'bg-green-100 text-green-800' }
    } else if (isAfter(startDate, currentDate)) {
      return { type: 'upcoming', label: 'Próximo', color: 'bg-blue-100 text-blue-800' }
    } else {
      return { type: 'started', label: 'Iniciado', color: 'bg-purple-100 text-purple-800' }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2" data-test="recent-activity-title">
          <Calendar className="h-5 w-5 text-purple-600" />
          Actividad reciente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 max-h-[calc(100vh-24rem)] overflow-y-auto">
        {recentActivity.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No hay actividad reciente</p>
        ) : (
          recentActivity.map(assignment => {
            const person = people.find(p => p.id === assignment.person_id)
            const project = projects.find(p => p.id === assignment.project_id)
            const activity = getActivityType(assignment)

            if (!person || !project) return null

            return (
              <div
                key={assignment.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-gray-100">
                    {getInitials(person)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{getDisplayName(person)}</p>
                    <Badge variant="secondary" className={`text-xs ${activity.color}`}>
                      {activity.label}
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-600 truncate mb-1">{project.name}</p>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(parseDateFromString(assignment.start_date), 'dd MMM', { locale: es })}
                    </span>
                    <span>{fteToPercentage(assignment.allocation)}%</span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
