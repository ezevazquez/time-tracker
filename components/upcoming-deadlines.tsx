'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Calendar, Clock } from 'lucide-react'
import { format, differenceInCalendarDays, isAfter, isBefore, addDays,startOfDay, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Project } from '@/types/project'
import type { AssignmentWithRelations } from '@/types/assignment'
import { parseDateFromString } from '@/lib/assignments'
import { fteToPercentage } from '@/lib/utils/fte-calculations'
import { useRouter } from 'next/navigation'

interface UpcomingDeadlinesProps {
  projects: Project[]
  assignments: AssignmentWithRelations[]
}

export function UpcomingDeadlines({ projects, assignments }: UpcomingDeadlinesProps) {
  const currentDate =  startOfDay(new Date())
  const twoWeeksFromNow = addDays(currentDate, 14)
  const router = useRouter()

  // Get upcoming project deadlines and assignment end dates
  const upcomingDeadlines = [
    // Project deadlines
    ...projects
      .filter(project => {
        if (project.status !== 'In Progress' || !project.end_date) return false
        const endDate = startOfDay(parseDateFromString(project.end_date))
        return (
          isAfter(endDate, currentDate) || isSameDay(endDate, currentDate)
        ) && isBefore(endDate, twoWeeksFromNow)
    })
      .map(project => ({
        id: project.id,
        type: 'project' as const,
        title: project.name,
        date: new Date(project.end_date!),
        status: project.status,
        projectId: project.id,
      })),

    // Assignment end dates
    ...assignments
      .filter(assignment => {
        const endDate = parseDateFromString(assignment.end_date)
        return (
          (isAfter(endDate, currentDate) || isSameDay(endDate, currentDate)) &&
          isBefore(endDate, twoWeeksFromNow)
        )
      })
      .map(assignment => {
        const project = projects.find(p => p.id === assignment.project_id)
        return {
          id: assignment.id,
          type: 'assignment' as const,
          title: project?.name || 'Proyecto desconocido',
          projectId: assignment.project_id,
          date: parseDateFromString(assignment.end_date),
          status: project?.status || 'Unknown',
          allocation: assignment.allocation,
          assignatedTo: `${assignment?.people?.first_name} ${assignment?.people?.last_name}` ,
        }
      }),
  ]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 6)

  const getUrgencyLevel = (date: Date) => {
    const daysUntil = differenceInCalendarDays(date, currentDate)
    if (daysUntil <= 3)
      return { level: 'high', color: 'bg-red-100 text-red-800 hover:bg-red-200', icon: AlertTriangle }
    if (daysUntil <= 7)
      return { level: 'medium', color: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200', icon: Clock }
    return { level: 'low', color: 'bg-blue-100 text-blue-800 hover:bg-blue-200', icon: Calendar }
  }

  return (
    <Card data-test="upcoming-deadlines-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-orange-600" />
          Próximos vencimientos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcomingDeadlines.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No hay vencimientos próximos</p>
        ) : (
          upcomingDeadlines.map(deadline => {
            const urgency = getUrgencyLevel(deadline.date)
            const daysUntil = differenceInCalendarDays(deadline.date, currentDate)
            const UrgencyIcon = urgency.icon
            return (
              <div
                key={`${deadline.type}-${deadline.id}`}
                className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
                data-test={`upcoming-deadline-${deadline.type}-${deadline.id}`}
                onClick={() => router.push(`/projects/${deadline.projectId}/show`)}
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
                      Asignación: {fteToPercentage(deadline.allocation)}%
                    </p>
                  )}
                  {deadline.type === 'assignment' && deadline.assignatedTo && (
                    <p className="text-xs text-gray-500 mt-1">
                      Asignado a: {deadline.assignatedTo}
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
