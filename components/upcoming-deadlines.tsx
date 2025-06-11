'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Calendar, Clock } from 'lucide-react'
import { format, differenceInDays, isAfter, isBefore, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Project, AssignmentWithRelations } from '@/lib/supabase'

interface UpcomingDeadlinesProps {
  projects: Project[]
  assignments: AssignmentWithRelations[]
}

export function UpcomingDeadlines({ projects, assignments }: UpcomingDeadlinesProps) {
  const currentDate = new Date()
  const twoWeeksFromNow = addDays(currentDate, 14)

  // Get upcoming project deadlines and assignment end dates
  const upcomingDeadlines = [
    // Project deadlines
    ...projects
      .filter(
        project =>
          project.end_date &&
          isAfter(new Date(project.end_date), currentDate) &&
          isBefore(new Date(project.end_date), twoWeeksFromNow)
      )
      .map(project => ({
        id: project.id,
        type: 'project' as const,
        title: project.name,
        date: new Date(project.end_date!),
        status: project.status,
      })),

    // Assignment end dates
    ...assignments
      .filter(
        assignment =>
          isAfter(new Date(assignment.end_date), currentDate) &&
          isBefore(new Date(assignment.end_date), twoWeeksFromNow)
      )
      .map(assignment => {
        const project = projects.find(p => p.id === assignment.project_id)
        return {
          id: assignment.id,
          type: 'assignment' as const,
          title: project?.name || 'Proyecto desconocido',
          date: new Date(assignment.end_date),
          status: project?.status || 'Unknown',
          allocation: assignment.allocation,
        }
      }),
  ]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 6)

  const getUrgencyLevel = (date: Date) => {
    const daysUntil = differenceInDays(date, currentDate)
    if (daysUntil <= 3)
      return { level: 'high', color: 'bg-red-100 text-red-800', icon: AlertTriangle }
    if (daysUntil <= 7)
      return { level: 'medium', color: 'bg-yellow-100 text-yellow-800', icon: Clock }
    return { level: 'low', color: 'bg-blue-100 text-blue-800', icon: Calendar }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-orange-600" />
          Próximos Vencimientos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcomingDeadlines.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No hay vencimientos próximos</p>
        ) : (
          upcomingDeadlines.map(deadline => {
            const urgency = getUrgencyLevel(deadline.date)
            const daysUntil = differenceInDays(deadline.date, currentDate)
            const UrgencyIcon = urgency.icon

            return (
              <div
                key={`${deadline.type}-${deadline.id}`}
                className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <div
                  className={`p-2 rounded-full ${urgency.color.replace('text-', 'bg-').replace('-800', '-200')}`}
                >
                  <UrgencyIcon
                    className={`h-4 w-4 ${urgency.color.replace('bg-', 'text-').replace('-100', '-600')}`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{deadline.title}</p>
                    <Badge variant="outline" className="text-xs">
                      {deadline.type === 'project' ? 'Proyecto' : 'Asignación'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-600">
                      {format(deadline.date, 'dd MMM yyyy', { locale: es })}
                    </p>
                    <Badge className={`text-xs ${urgency.color}`}>
                      {daysUntil === 0 ? 'Hoy' : daysUntil === 1 ? 'Mañana' : `${daysUntil} días`}
                    </Badge>
                  </div>

                  {deadline.type === 'assignment' && deadline.allocation && (
                    <p className="text-xs text-gray-500 mt-1">
                      Asignación: {Math.round(deadline.allocation * 100)}%
                    </p>
                  )}
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
