'use client'

import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { AlertTriangle, Calendar, TrendingUp } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import type { Project } from '@/types/project'
import type { Assignment } from '@/types/assignment'
import { 
  calculateProjectAssignedFTE, 
  isProjectOverallocated, 
  calculateOverallocationPercentage 
} from '@/lib/utils/fte-calculations'
import { renderDate } from '@/utils/renderDate'

interface OverallocatedProjectsProps {
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

export function OverallocatedProjects({ projects, assignments }: OverallocatedProjectsProps) {
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
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-green-600" />
            Proyectos sobreasignados
          </CardTitle>
          <CardDescription>
            Estado de asignación de recursos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="text-green-600 mb-2">
              <AlertTriangle className="h-8 w-8 mx-auto" />
            </div>
            <p className="text-sm text-muted-foreground">
              No hay proyectos sobreasignados
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Todos los proyectos están dentro de su capacidad FTE
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          Proyectos sobreasignados
        </CardTitle>
        <CardDescription>
          {projectsWithOverallocation.length} proyecto{projectsWithOverallocation.length !== 1 ? 's' : ''} con sobreasignación
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projectsWithOverallocation.slice(0, 5).map(({ project, assignedFTE, totalFTE, overallocationPercentage }) => (
            <div
              key={project.id}
              className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => router.push(`/projects/${project.id}/show`)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">
                    {project.project_code && (
                      <span className="font-mono text-xs text-muted-foreground mr-2">
                        {project.project_code}
                      </span>
                    )}
                    {project.name}
                  </h4>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                    {project.start_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {renderDate(project.start_date)}
                      </div>
                    )}
                    {project.end_date && (
                      <span>-</span>
                    )}
                    {project.end_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {renderDate(project.end_date)}
                      </div>
                    )}
                  </div>
                </div>
                <Badge variant="destructive" className="text-xs">
                  +{overallocationPercentage}%
                </Badge>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">FTE:</span>
                  <span className="font-medium">
                    {assignedFTE.toFixed(1)}/{totalFTE.toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-red-600">
                  <TrendingUp className="h-3 w-3" />
                  <span>Sobre-asignado</span>
                </div>
              </div>
            </div>
          ))}
          
          {projectsWithOverallocation.length > 5 && (
            <div className="pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => router.push('/projects')}
              >
                Ver todos los proyectos ({projectsWithOverallocation.length})
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 