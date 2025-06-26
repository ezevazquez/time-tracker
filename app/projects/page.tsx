'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { Plus, Search, Edit, Trash2, Eye, ArrowDown, ArrowUp } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TableResource } from '@/components/ui/table-resource'

import { useProjects } from '@/hooks/use-projects'
import { projectColumns } from '@/constants/resource-columns/projectColumns'
import { PROJECT_STATUS_OPTIONS } from '@/constants/projects'

import type { Project } from '@/types/project'
import type { ResourceAction } from '@/types/ResourceAction'
import type { ResourceColumn } from '@/types/ResourceColumn'

interface ProjectWithFTE extends Project {
  assignedFTE?: number
}

export default function ProjectsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const { projects, loading, error, deleteProject } = useProjects()
  const router = useRouter()
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null)
  const { toast } = useToast()
  const [sortField, setSortField] = useState<'nombre' | 'cliente' | 'estado' | 'fechas'>('nombre')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const sortableKeys = ['nombre', 'cliente', 'estado', 'fechas'] as const;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando proyectos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <p>Error: {error}</p>
        </div>
      </div>
    )
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(order => order === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    let valA, valB
    if (sortField === 'nombre') {
      valA = a.name?.toLowerCase() || ''
      valB = b.name?.toLowerCase() || ''
    } else if (sortField === 'cliente') {
      valA = a.clients?.name?.toLowerCase() || ''
      valB = b.clients?.name?.toLowerCase() || ''
    } else if (sortField === 'estado') {
      valA = a.status || ''
      valB = b.status || ''
    } else if (sortField === 'fechas') {
      valA = a.start_date || ''
      valB = b.start_date || ''
    }
    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
    } else {
      return 0
    }
  })

  const columnsWithSorting = projectColumns.map(col => {
    if (sortableKeys.includes(col.key as typeof sortableKeys[number])) {
      return {
        ...col,
        title: (
          <span
            className="cursor-pointer select-none flex items-center gap-1"
            onClick={() => handleSort(col.key as typeof sortableKeys[number])}
            data-test={`sort-${col.key}`}
          >
            {col.title}
            {sortField === col.key && (
              sortOrder === 'asc' ? <ArrowDown className="inline h-3 w-3" /> : <ArrowUp className="inline h-3 w-3" />
            )}
          </span>
        ),
      }
    }
    return col
  })

  const handleDelete = async (id: string) => {
    setProjectToDelete(id)
  }

  const confirmDelete = async () => {
    if (!projectToDelete) return
    try {
      await deleteProject(projectToDelete)
      toast({
        title: 'Proyecto eliminado',
        description: 'El proyecto fue eliminado correctamente.',
      })
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error al eliminar el proyecto'
      toast({ title: 'Error al eliminar', description: errorMsg, variant: 'destructive' })
      console.error('Error deleting project:', error)
    } finally {
      setProjectToDelete(null)
    }
  }

  const actions: ResourceAction[] = [
    {
      label: 'Ver',
      resourceName: 'projects',
      icon: Eye,
      path: id => `projects/${id}/show`,
    },
    {
      label: 'Editar',
      resourceName: 'projects',
      icon: Edit,
      path: id => `projects/${id}/edit`,
    },
    {
      label: 'Eliminar',
      resourceName: 'projects',
      icon: Trash2,
      onClick: id => handleDelete(id),
    },
  ]

  return (
    <main className="flex-1 container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold" data-test="projects-title">Proyectos</h1>
          <p className="text-muted-foreground">Gestiona los proyectos en curso</p>
        </div>
        <Button asChild data-test="create-project-button">
          <Link href="/projects/new">
            <Plus className="h-4 w-4 mr-2" />
            Crear Proyecto
          </Link>
        </Button>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="pt-6 flex flex-col sm:flex-row gap-4">
          <div className="relative w-full sm:w-2/3">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o descripción..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
              data-test="search-projects-input"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter} >
            <SelectTrigger className="w-full sm:w-40" data-test="status-filter-select">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {PROJECT_STATUS_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle data-test="projects-title">Lista de Proyectos</CardTitle>
          <CardDescription>Proyectos registrados en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <TableResource
            items={sortedProjects}
            columns={columnsWithSorting as ResourceColumn<ProjectWithFTE>[]}
            actions={actions}
          />
        </CardContent>
      </Card>

      {/* Modal de confirmación */}
      {projectToDelete && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow-lg">
            <h2 className="text-lg font-bold mb-4">Confirmar eliminación</h2>
            <p>¿Estás seguro de que deseas eliminar este proyecto?</p>
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="px-4 py-2 bg-gray-200 rounded"
                onClick={() => setProjectToDelete(null)}
                data-test="cancel-delete-project-button"
              >
                Cancelar
              </button>
              <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={confirmDelete} data-test="confirm-delete-project-button">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
