'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { Plus, Search, Edit, Trash2, Eye, ArrowDown, ArrowUp, X, ChevronDown, ArrowUpDown, List, CalendarDays } from 'lucide-react'

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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { ResourceHeader } from '@/components/resource-header'
import { ResourceSubheader } from '@/components/resource-subheader'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { FiltersPopover } from '@/components/filters-popover'

import { useProjects } from '@/hooks/use-projects'
import { projectColumns } from '@/constants/resource-columns/projectColumns'
import { PROJECT_STATUS_OPTIONS, PROJECT_STATUS, PROJECT_CONTRACT_TYPE_OPTIONS } from '@/constants/projects'

import type { Project } from '@/types/project'
import type { ResourceAction } from '@/types/ResourceAction'
import type { ResourceColumn } from '@/types/ResourceColumn'
import type { TimelineFilters } from '@/types/timeline'

interface ProjectWithFTE extends Project {
  assignedFTE?: number
}

export default function ProjectsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusPopoverOpen, setStatusPopoverOpen] = useState(false)
  const { projects, loading, error, deleteProject } = useProjects()
  const router = useRouter()
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null)
  const { toast } = useToast()
  const [sortField, setSortField] = useState<'nombre' | 'cliente' | 'estado' | 'fechas' | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list')

  // Valor por defecto para los estados (todos menos 'Finished')
  const defaultStatusFilter = PROJECT_STATUS_OPTIONS.filter(opt => opt.value !== PROJECT_STATUS.FINISHED).map(opt => opt.value)

  // Valor por defecto para el filtro de fechas (1 semana atrás y 1 mes adelante)
  const getDefaultDateRange = () => {
    const from = new Date()
    from.setDate(from.getDate() - 7)
    const to = new Date()
    to.setDate(to.getDate() + 30)
    return { from, to }
  }
  const defaultDateRange = getDefaultDateRange()

  const [statusFilter, setStatusFilter] = useState<string[]>(defaultStatusFilter)

  // Valor por defecto para tipo de contratación (vacío = todos)
  const defaultContractTypeFilter: string[] = []

  // Estado de filtros para FiltersPopover
  const [filters, setFilters] = useState<TimelineFilters>({
    personProfile: [],
    projectStatus: '',
    dateRange: { from: defaultDateRange.from, to: defaultDateRange.to },
    overallocatedOnly: false,
    personType: 'all',
    search: '',
    projectId: [],
    status: defaultStatusFilter,
    clientId: undefined,
    contractType: defaultContractTypeFilter,
  })

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
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(project.status)
    const matchesContractType = !filters.contractType || filters.contractType.length === 0 || filters.contractType.includes(project.contract_type || '')
    return matchesSearch && matchesStatus && matchesContractType
  })

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      if (sortOrder === 'desc') {
        setSortField(null)
      } else if (sortOrder === 'asc') {
        setSortOrder('desc')
      }
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const sortedProjects = sortField
    ? [...filteredProjects].sort((a, b) => {
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
    : filteredProjects

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
            {sortField === col.key ? (
              sortOrder === 'asc' ? <ArrowDown className="inline h-3 w-3" /> : <ArrowUp className="inline h-3 w-3" />
            ) : (
              <ArrowUpDown className="inline h-3 w-3 text-muted-foreground" />
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

  // Sincronizar statusFilter con filters.status
  const handleFiltersChange = (newFilters: TimelineFilters) => {
    setFilters(newFilters)
    if (Array.isArray(newFilters.status)) {
      setStatusFilter(newFilters.status)
    } else if (typeof newFilters.status === 'string') {
      setStatusFilter(newFilters.status ? [newFilters.status] : [])
    } else {
      setStatusFilter([])
    }
  }

  return (
    <main className="flex-1 w-full h-[92vh] flex flex-col">
      <ResourceHeader
        title="Proyectos"
        buttonLabel="Nuevo Proyecto"
        buttonHref="/projects/new"
      />
      <ResourceSubheader
        searchPlaceholder="Buscar proyectos..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filtersComponent={
          <FiltersPopover
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={() => {
              setFilters({
                ...filters,
                status: [],
                dateRange: { from: defaultDateRange.from, to: defaultDateRange.to },
                contractType: defaultContractTypeFilter,
              })
              setStatusFilter([])
            }}
            mode="list"
            filtersToShow={['status', 'dateRange', 'contractType']}
            dateRangeDefault={defaultDateRange}
          />
        }
        toggleComponent={
          <ToggleGroup type="single" value={viewMode} onValueChange={value => {
            if (value) setViewMode(value as 'list' | 'timeline')
          }} className="bg-gray-100 p-1 rounded-lg shadow-sm">
            <ToggleGroupItem
              value="list"
              aria-label="Ver como tabla"
              className="rounded-md data-[state=on]:bg-white data-[state=on]:shadow-md data-[state=on]:text-blue-600 data-[state=off]:text-gray-500 data-[state=off]:hover:text-gray-700 transition-all duration-200"
              data-test="toggle-list-button"
            >
              <List className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="timeline"
              aria-label="Ver como timeline"
              className="rounded-md data-[state=on]:bg-white data-[state=on]:shadow-md data-[state=on]:text-blue-600 data-[state=off]:text-gray-500 data-[state=off]:hover:text-gray-700 transition-all duration-200"
              data-test="toggle-timeline-button"
            >
              <CalendarDays className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        }
      />
      <div className="flex-1 min-h-0 overflow-hidden">
        {viewMode === 'timeline' ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-muted-foreground text-lg">Acá va el Gantt</span>
          </div>
        ) : (
          <div className="h-full overflow-auto">
            <div className="container mx-auto px-4 py-4">
              <Card>
                <CardHeader>
                </CardHeader>
                <CardContent>
                  <TableResource
                    items={sortedProjects}
                    columns={columnsWithSorting as ResourceColumn<ProjectWithFTE>[]}
                    actions={actions}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
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
