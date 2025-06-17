'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'

import { ArrowLeft, Calendar, User, Building2, Clock, Edit, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useProjects } from '@/hooks/use-projects'
import { useAssignments } from '@/hooks/use-assignments'
import { projectsService } from '@/lib/services/projects.service'
import type { ProjectWithClient } from '@/types/project'
import { PROJECT_STATUS_OPTIONS } from '@/constants/projects'
import { ResourceLoading } from '@/components/ui/resource-loading'
import { ResourceError } from '@/components/ui/resource-error'
import { RESOURCES } from '@/constants/resources'
import { Resource } from '@/types'
import { ResourceNotFound } from '@/components/resource-not-found'
import { TableResource } from '@/components/ui/table-resource'
import { activityLogsColumns } from '@/constants/resource-columns/activityLogsColumns'
import { supabase } from '@/lib/supabase/client'
import { calculateFTEUtilization, isProjectOverallocated } from '@/lib/utils/fte-calculations'

const getProjectStatusLabel = (status: string) =>
  PROJECT_STATUS_OPTIONS.find(opt => opt.value === status)?.label || status

const getProjectStatusBadgeClass = (status: string) => {
  const variants: Record<string, string> = {
    'In Progress': 'bg-blue-100 text-blue-800 border-blue-200',
    Finished: 'bg-green-100 text-green-800 border-green-200',
    'On Hold': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Not Started': 'bg-gray-100 text-gray-800 border-gray-200',
  }
  return variants[status] || 'bg-gray-100 text-gray-800 border-gray-200'
}

export default function ProjectShowPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params)
  const { deleteProject } = useProjects()
  const { assignments } = useAssignments()
  const [project, setProject] = useState<ProjectWithClient | null>(null)
  const [assignedFTE, setAssignedFTE] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  // Filtrar asignaciones del proyecto
  const projectAssignments = assignments.filter(
    assignment => assignment.project_id === unwrappedParams.id
  )

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await projectsService.getById(unwrappedParams.id)

        let { data: activityLogs, error } = await supabase.rpc('get_project_activity_logs', {
          p_project_id: unwrappedParams.id,
        })

        if (error) {
          console.error(error)
        }

        if (data) {
          data.activity_logs = activityLogs || []
        }
        setProject(data)

        // Calcular FTE asignado
        const fte = await projectsService.getAssignedFTE(unwrappedParams.id)
        setAssignedFTE(fte)
      } catch (err) {
        setError('Error al cargar el proyecto')
        console.error('Error fetching project:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchProject()
  }, [unwrappedParams.id])

  const handleDelete = async () => {
    if (!project) return

    if (
      window.confirm(
        '¿Estás seguro de que deseas eliminar este proyecto? Esta acción no se puede deshacer.'
      )
    ) {
      try {
        setIsDeleting(true)
        await deleteProject(project.id)
        toast.success('Proyecto eliminado correctamente')
        router.push('/projects')
      } catch (error) {
        toast.error('Error al eliminar el proyecto')
        console.error('Error deleting project:', error)
      } finally {
        setIsDeleting(false)
      }
    }
  }

  if (loading) {
    return <ResourceLoading />
  }

  if (error) {
    return <ResourceError error={error} resource={RESOURCES.projects as Resource} />
  }

  if (!project) {
    return <ResourceNotFound resource={RESOURCES.projects as Resource} />
  }

  return (
    <main className="flex-1 container mx-auto px-4 py-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/projects">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{project.name}</h1>
              <p className="text-muted-foreground">Detalles del proyecto</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button asChild>
              <Link href={`/projects/${project.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Link>
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Información General
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">
                    Nombre del Proyecto
                  </h3>
                  <p className="text-lg font-semibold">{project.name}</p>
                </div>

                {project.description && (
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Descripción</h3>
                    <p className="text-sm leading-relaxed">{project.description}</p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-sm text-muted-foreground">Estado:</h3>
                  <Badge className={getProjectStatusBadgeClass(project.status)}>
                    {getProjectStatusLabel(project.status)}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Cronograma
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">
                      Fecha de Inicio
                    </h3>
                    <p className="text-sm">
                      {project.start_date
                        ? format(new Date(project.start_date), "dd 'de' MMMM, yyyy", { locale: es })
                        : 'No definida'}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Fecha de Fin</h3>
                    <p className="text-sm">
                      {project.end_date
                        ? format(new Date(project.end_date), "dd 'de' MMMM, yyyy", { locale: es })
                        : 'No definida'}
                    </p>
                  </div>
                </div>

                {project.start_date && project.end_date && (
                  <div className="mt-4 pt-4 border-t">
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">
                      Duración Estimada
                    </h3>
                    <p className="text-sm">
                      {Math.ceil(
                        (new Date(project.end_date).getTime() -
                          new Date(project.start_date).getTime()) /
                          (1000 * 60 * 60 * 24)
                      )}{' '}
                      días
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Team Members Section - Placeholder for future implementation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Equipo Asignado
                </CardTitle>
                <CardDescription>
                  Miembros del equipo trabajando en este proyecto ({projectAssignments.length})
                </CardDescription>
              </CardHeader>
              <CardContent>
                {projectAssignments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay miembros asignados aún</p>
                    <p className="text-xs mt-1">
                      Crea asignaciones para agregar personas al proyecto
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {projectAssignments.map(assignment => {
                      const person = assignment.people
                      if (!person) return null

                      return (
                        <div
                          key={assignment.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-sm">{person.name}</h4>
                              <p className="text-xs text-muted-foreground">
                                Estado: {person.status}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {(assignment.allocation * 100).toFixed(0)}%
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(assignment.start_date), 'dd/MM/yyyy', {
                                locale: es,
                              })}{' '}
                              -{' '}
                              {format(new Date(assignment.end_date), 'dd/MM/yyyy', { locale: es })}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Cliente
                </CardTitle>
              </CardHeader>
              <CardContent>
                {project.clients ? (
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground mb-1">Nombre</h3>
                      <p className="font-semibold">{project.clients.name}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Sin cliente asignado</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Project Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Estadísticas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Creado</span>
                  <span className="text-sm font-medium">
                    {format(new Date(project.created_at), 'dd/MM/yyyy', { locale: es })}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Última actualización</span>
                  <span className="text-sm font-medium">
                    {format(new Date(project.updated_at), 'dd/MM/yyyy', { locale: es })}
                  </span>
                </div>

                <Separator />

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Estado actual</span>
                  <Badge className={getProjectStatusBadgeClass(project.status)} variant="outline">
                    {getProjectStatusLabel(project.status)}
                  </Badge>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">FTE Asignado</span>
                    <span className="text-sm font-medium">
                      {assignedFTE.toFixed(1)}/{project.fte ? project.fte.toFixed(1) : '0.0'}
                    </span>
                  </div>

                  {project.fte && project.fte > 0 && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Utilización</span>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              isProjectOverallocated(assignedFTE, project.fte)
                                ? 'destructive'
                                : 'default'
                            }
                            className="text-xs"
                          >
                            {calculateFTEUtilization(assignedFTE, project.fte)}%
                          </Badge>
                        </div>
                      </div>

                      {isProjectOverallocated(assignedFTE, project.fte) && (
                        <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                          ⚠️ Proyecto sobre-asignado en un{' '}
                          {Math.round(((assignedFTE - project.fte) / project.fte) * 100)}%
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button asChild className="w-full" variant="outline">
                  <Link href={`/projects/${project.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Proyecto
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isDeleting ? 'Eliminando...' : 'Eliminar Proyecto'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Historial de acciones</CardTitle>
              <CardDescription>
                Aquí puedes ver un registro de todas las acciones realizadas en este proyecto.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <TableResource items={project.activity_logs || []} columns={activityLogsColumns} />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
