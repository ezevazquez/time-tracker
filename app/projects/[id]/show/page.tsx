'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'

import {
  ArrowLeft,
  Calendar,
  User,
  Building2,
  Clock,
  Edit,
  Trash2,
  AlertCircle,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'

import { useProjects } from '@/hooks/use-projects'
import { projectsService } from '@/lib/services/projects.service'
import type { ProjectWithClient } from '@/types/project'
import { PROJECT_STATUS_OPTIONS } from '@/constants/projects'


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


export default function ProjectShowPage() {
  const { deleteProject } = useProjects()
  const [project, setProject] = useState<ProjectWithClient | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { id } = useParams()
  const router = useRouter()

  if (typeof id !== 'string') {
    throw new Error('ID de proyecto inválido.')
  }

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await projectsService.getById(id)
        setProject(data)
      } catch (err) {
        setError('Error al cargar el proyecto')
        console.error('Error fetching project:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchProject()
  }, [id])

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
    return (
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-10 w-10 bg-gray-200 rounded-md animate-pulse" />
            <div className="space-y-2">
              <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              Error al cargar el proyecto: {error}
            </AlertDescription>
          </Alert>
          <div className="mt-6">
            <Button asChild>
              <Link href="/projects">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a la lista
              </Link>
            </Button>
          </div>
        </div>
      </main>
    )
  }

  if (!project) {
    return (
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-yellow-800">Proyecto no encontrado</AlertDescription>
          </Alert>
          <div className="mt-6">
            <Button asChild>
              <Link href="/projects">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a la lista
              </Link>
            </Button>
          </div>
        </div>
      </main>
    )
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
                <CardDescription>Miembros del equipo trabajando en este proyecto</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay miembros asignados aún</p>
                  <p className="text-xs mt-1">Esta funcionalidad estará disponible próximamente</p>
                </div>
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
      </div>
    </main>
  )
}
