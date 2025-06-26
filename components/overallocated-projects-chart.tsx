'use client'

import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { AlertTriangle, Calendar, TrendingUp } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import type { Project } from '@/types/project'
import type { Assignment } from '@/types/assignment'
import { 
  calculateProjectAssignedFTE, 
  isProjectOverallocated, 
  calculateOverallocationPercentage 
} from '@/lib/utils/fte-calculations'
import { renderDate } from '@/utils/renderDate'

interface OverallocatedProjectsChartProps {
  projects: Project[]
  assignments: Assignment[]
}

interface ProjectWithOverallocation {
  project: Project
  assignedFTE: number
  totalFTE: number
  overallocationPercentage: number
  isOverallocated: boolean
}

export function OverallocatedProjectsChart({ projects, assignments }: OverallocatedProjectsChartProps) {
  const router = useRouter()

  // Calcular FTE asignado por proyecto y detectar sobre-asignaciones
  const projectsWithOverallocation: ProjectWithOverallocation[] = projects
    .map(project => {
      const today = new Date().toISOString().split('T')[0]
      
      const projectAssignments = assignments.filter(
        assignment => 
          assignment.project_id === project.id && 
          assignment.end_date >= today // Solo asignaciones activas
      )
      
      const assignedFTE = calculateProjectAssignedFTE(projectAssignments)
      const totalFTE = project.fte || 0
      const isOverallocated = isProjectOverallocated(assignedFTE, totalFTE)
      const overallocationPercentage = calculateOverallocationPercentage(assignedFTE, totalFTE)
      
      return {
        project,
        assignedFTE,
        totalFTE,
        overallocationPercentage,
        isOverallocated
      }
    })
    .filter(item => item.isOverallocated)
    .sort((a, b) => b.overallocationPercentage - a.overallocationPercentage)

  if (projectsWithOverallocation.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm" data-test="overallocated-projects-title">
            <AlertTriangle className="h-4 w-4 text-green-600" />
            Proyectos sobreasignados
          </CardTitle>
          <CardDescription className="text-xs">
            Estado de asignación de recursos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="text-green-600 mb-2">
              <AlertTriangle className="h-6 w-6 mx-auto" />
            </div>
            <p className="text-xs text-muted-foreground">
              No hay proyectos sobreasignados
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-red-600" data-test="overallocated-projects-title" />
          Proyectos sobreasignados
        </CardTitle>
        <CardDescription className="text-xs">
          {projectsWithOverallocation.length} proyecto{projectsWithOverallocation.length !== 1 ? 's' : ''} con sobreasignación
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {projectsWithOverallocation.slice(0, 4).map(({ project, assignedFTE, totalFTE, overallocationPercentage }) => (
            <div
              key={project.id}
              className="p-2 border rounded text-xs hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => router.push(`/projects/${project.id}/show`)}
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">
                    {project.project_code && (
                      <span className="font-mono text-muted-foreground mr-1">
                        {project.project_code}
                      </span>
                    )}
                    {project.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                    {project.start_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {renderDate(project.start_date)}
                      </div>
                    )}
                    {project.end_date && (
                      <>
                        <span>-</span>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {renderDate(project.end_date)}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <Badge variant="destructive" className="text-xs ml-2">
                  +{overallocationPercentage}%
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">FTE:</span>
                  <span className="font-medium">
                    {assignedFTE.toFixed(1)}/{totalFTE.toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-red-600">
                  <TrendingUp className="h-3 w-3" />
                  <span className="text-xs">Sobre-asignado</span>
                </div>
              </div>
            </div>
          ))}
          
          {projectsWithOverallocation.length > 4 && (
            <div className="pt-2 border-t text-center">
              <button
                className="text-xs text-blue-600 hover:text-blue-800"
                onClick={() => router.push('/projects')}
              >
                Ver todos ({projectsWithOverallocation.length})
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 