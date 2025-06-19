'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar, User, Briefcase, Percent, Clock } from 'lucide-react'
import type { Person } from '@/types/people'
import type { Project } from '@/types/project'
import { fteToPercentage } from '@/lib/utils/fte-calculations'
import { getUtilizationStatus } from '@/lib/utils/fte-calculations'

interface AssignmentSummaryProps {
  person: Person
  project: Project
  startDate: Date
  endDate: Date
  allocation: number // Percentage (0-100)
  isOverallocated?: boolean
  maxAllocation?: number // FTE (0.0-1.0)
}

export function AssignmentSummary({
  person,
  project,
  startDate,
  endDate,
  allocation,
  isOverallocated = false,
  maxAllocation,
}: AssignmentSummaryProps) {
  // Calculate FTE (Full Time Equivalent)
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
  const workingDays = daysDiff // Simplified - in real scenario you'd exclude weekends/holidays
  const allocationFte = allocation / 100 // Convert percentage to FTE
  const fteMonths = allocationFte * (workingDays / 30.44) // Average days per month

  const getStatusColor = () => {
    if (isOverallocated) return 'bg-red-100 text-red-800 border-red-300'
    if (allocation === 100) return 'bg-green-100 text-green-800 border-green-300'
    if (allocation >= 75) return 'bg-blue-100 text-blue-800 border-blue-300'
    if (allocation >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    return 'bg-gray-100 text-gray-800 border-gray-300'
  }

  return (
    <Card className="bg-muted/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Resumen de la Asignación</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Persona</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {person.first_name} {person.last_name}
            </p>
            <Badge variant="outline" className="text-xs">
              {person.profile}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Proyecto</span>
            </div>
            <p className="text-sm text-muted-foreground">{project.name}</p>
            <Badge variant="outline" className="text-xs">
              {project.status}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Período</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {format(startDate, 'dd/MM/yyyy', { locale: es })} - {format(endDate, 'dd/MM/yyyy', { locale: es })}
            </p>
            <Badge variant="outline" className="text-xs">
              {daysDiff} días
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Asignación</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={getStatusColor()}>
                {allocation}%
              </Badge>
              {isOverallocated && maxAllocation && (
                <Badge variant="destructive" className="text-xs">
                  Máx: {fteToPercentage(maxAllocation)}%
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">FTE (Full Time Equivalent)</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {fteMonths.toFixed(2)} meses FTE
            </Badge>
            <span className="text-sm text-muted-foreground">
              ({allocation}% × {daysDiff} días ÷ 30.44 días/mes)
            </span>
          </div>
        </div>

        {isOverallocated && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">
              ⚠️ Esta asignación causará sobreasignación. La persona excederá el 100% de capacidad.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 