'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Filter, X, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/utils/classnames'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import type { Person } from '@/types/people'
import type { ProjectWithClient } from '@/types/project'
import { es } from "date-fns/locale"
import type { TimelineFilters } from "@/types/timeline"
import { PROJECT_STATUS_OPTIONS, PROJECT_CONTRACT_TYPE_OPTIONS } from '@/constants/projects'
import { Badge } from './ui/badge'

interface FiltersPopoverProps {
  people?: Person[]
  projects?: ProjectWithClient[]
  profiles?: { id: string; name: string }[]
  filters: TimelineFilters
  onFiltersChange: (filters: TimelineFilters) => void
  onClearFilters: () => void
  showDateRange?: boolean
  trigger?: React.ReactNode
  mode: 'timeline' | 'list'
  /**
   * Qué filtros mostrar. Valores posibles:
   * - 'profile': filtro de perfil de persona
   * - 'project': filtro de proyecto
   * - 'type': filtro de tipo de persona
   * - 'overallocated': filtro de sobreasignados
   * - 'dateRange': filtro de rango de fechas
   * - 'status': filtro de estado de proyecto
   * - 'client': filtro de cliente
   */
  filtersToShow?: string[]
  dateRangeDefault?: { from: Date; to: Date | undefined }
}

// Helper para comparar solo año, mes y día
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

export function FiltersPopover({
  people = [],
  projects = [],
  profiles = [],
  filters,
  onFiltersChange,
  onClearFilters,
  showDateRange = true,
  trigger,
  mode,
  filtersToShow = ['profile', 'project', 'type', 'overallocated', 'dateRange'], // default para asignaciones
  dateRangeDefault,
}: FiltersPopoverProps) {
  const [open, setOpen] = useState(false)
  const [isSelectingStart, setIsSelectingStart] = useState(true)

  // Get unique profiles from people or from profiles prop
  const uniqueProfiles = profiles.length > 0
    ? profiles.map(p => p.name)
    : Array.from(new Set(people.map(p => p.profile))).filter(Boolean).sort()

  // Get unique types from people
  const uniqueTypes = Array.from(new Set(people.map(p => p.type)))
    .filter(Boolean)
    .sort()

  // Definir valores por defecto para comparar
  const defaultProfile = 'all'
  const defaultType = 'all'
  const defaultOverallocated = false
  // Para fechas, comparar con el rango inicial (7 días atrás, 30 adelante)
  const defaultDateRange = {
    from: (() => { const d = new Date(); d.setDate(d.getDate() - 7); return d; })(),
    to: (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d; })(),
  }

  // Usar el default pasado por prop o el hardcodeado
  const effectiveDateRangeDefault = dateRangeDefault || defaultDateRange

  // Calcular cantidad de filtros activos SOLO de los visibles
  const activeFiltersCount = filtersToShow.reduce((count, filterKey) => {
    switch (filterKey) {
      case 'profile':
        return count + ((Array.isArray(filters.personProfile) && filters.personProfile.length > 0) ? 1 : 0)
      case 'type':
        return count + (filters.personType !== defaultType ? 1 : 0)
      case 'overallocated':
        return count + (filters.overallocatedOnly !== defaultOverallocated ? 1 : 0)
      case 'project':
        return count + (filters.projectId && filters.projectId.length > 0 ? 1 : 0)
      case 'status':
        return count + (filters.status && filters.status.length > 0 ? 1 : 0)
      case 'client':
        return count + (filters.clientId ? 1 : 0)
      case 'dateRange':
        return count + (mode === 'list' && (
          !isSameDay(filters.dateRange.from, effectiveDateRangeDefault.from) ||
          !isSameDay(filters.dateRange.to ?? new Date(0), effectiveDateRangeDefault.to ?? new Date(0))
        ) ? 1 : 0)
      case 'contractType':
        // Solo cuenta como activo si NO están todos los tipos seleccionados
        const allContractTypes = PROJECT_CONTRACT_TYPE_OPTIONS.map(opt => opt.value)
        const selected = filters.contractType || []
        const isAllSelected = selected.length === allContractTypes.length && allContractTypes.every(val => selected.includes(val))
        return count + (!isAllSelected && selected.length > 0 ? 1 : 0)
      default:
        return count
    }
  }, 0)

  // Calcular si hay filtros activos SOLO de los visibles
  const hasActiveFilters = activeFiltersCount > 0

  const defaultTrigger = (
    <Button
      className={`h-8 relative transition-colors duration-150 flex items-center gap-1 ${hasActiveFilters ? 'bg-primary text-white border-primary' : ''}`}
      variant={hasActiveFilters ? 'default' : 'outline'}
      size="sm"
      data-test="filters-button"
    >
      <Filter className={`h-4 w-4 mr-1 ${hasActiveFilters ? 'text-white' : 'text-primary'}`} />
      Filtros
      {activeFiltersCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5">
          <Badge className="w-5 h-5 p-0 text-xs bg-red-500 text-white rounded-full shadow flex items-center justify-center pointer-events-none" variant="default">
            {activeFiltersCount}
          </Badge>
        </span>
      )}
    </Button>
  )

  useEffect(() => {
    if (!open) setIsSelectingStart(true)
    // Debug: log project ids to find empty or invalid ones
    if (projects && projects.length > 0) {
      // eslint-disable-next-line no-console
      console.log('Project IDs in filter:', projects.map(p => p.id))
    }
  }, [open, projects])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger || defaultTrigger}</PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between" data-test="filters-title">
              Filtros
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onClearFilters()
                    setOpen(false)
                  }}
                  className="h-8 px-2 text-muted-foreground hover:text-foreground"
                  data-test="clear-filters-button"
                >
                  <X className="h-4 w-4 mr-1" />
                  Limpiar
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filtro de perfil */}
            {filtersToShow.includes('profile') && uniqueProfiles.length > 0 && (
              <div className="space-y-2">
                <Label>Perfil</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between" data-test="profile-multiselect-trigger">
                      <span className="truncate">
                        {filters.personProfile.length === 0
                          ? 'Todos los perfiles'
                          : filters.personProfile.join(', ')
                        }
                      </span>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2">
                    <div className="flex items-center justify-between px-2 pb-2">
                      <span className="font-semibold text-sm">Perfiles</span>
                      {filters.personProfile.length > 0 && (
                        <button
                          type="button"
                          onClick={() => onFiltersChange({ ...filters, personProfile: [] })}
                          className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 px-2 py-1 rounded transition-colors"
                          data-test="clear-profile-filter"
                        >
                          <X className="h-3 w-3" /> Limpiar
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                      {uniqueProfiles.map(profile => (
                        <label key={profile} className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded hover:bg-accent">
                          <Checkbox
                            checked={filters.personProfile.includes(profile)}
                            onCheckedChange={checked => {
                              if (checked) {
                                onFiltersChange({ ...filters, personProfile: [...filters.personProfile, profile] })
                              } else {
                                onFiltersChange({ ...filters, personProfile: filters.personProfile.filter(p => p !== profile) })
                              }
                            }}
                            id={`profile-checkbox-${profile}`}
                          />
                          <span className="text-sm">{profile}</span>
                        </label>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            )}
            {/* Filtro de proyecto */}
            {filtersToShow.includes('project') && projects.length > 0 && (
              <div className="space-y-2">
                <Label>Proyecto</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between" data-test="project-multiselect-trigger">
                      <span className="truncate">
                        {filters.projectId && filters.projectId.length === 0
                          ? 'Todos los proyectos'
                          : projects.filter(p => filters.projectId?.includes(p.id)).map(p => p.name).join(', ')
                        }
                      </span>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2">
                    <div className="flex items-center justify-between px-2 pb-2">
                      <span className="font-semibold text-sm">Proyectos</span>
                      {filters.projectId && filters.projectId.length > 0 && (
                        <button
                          type="button"
                          onClick={() => onFiltersChange({ ...filters, projectId: [] })}
                          className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 px-2 py-1 rounded transition-colors"
                          data-test="clear-project-filter"
                        >
                          <X className="h-3 w-3" /> Limpiar
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                      {projects
                        .filter(project => typeof project.id === 'string' && project.id.trim() !== '')
                        .map(project => (
                          <label key={project.id} className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded hover:bg-accent">
                            <Checkbox
                              checked={filters.projectId?.includes(project.id)}
                              onCheckedChange={checked => {
                                if (checked) {
                                  onFiltersChange({ ...filters, projectId: [...(filters.projectId || []), project.id] })
                                } else {
                                  onFiltersChange({ ...filters, projectId: (filters.projectId || []).filter(id => id !== project.id) })
                                }
                              }}
                              id={`project-checkbox-${project.id}`}
                            />
                            <span className="text-sm">{project.name}{project.clients ? ` - ${project.clients.name}` : ''}</span>
                          </label>
                        ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            )}
            {/* Filtro de tipo de persona */}
            {filtersToShow.includes('type') && people.length > 0 && (
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={filters.personType}
                  onValueChange={(value) => onFiltersChange({ ...filters, personType: value })}
                >
                  <SelectTrigger className="w-full mt-1" data-test="person-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {uniqueTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {/* Filtro de sobreasignados */}
            {filtersToShow.includes('overallocated') && (
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={filters.overallocatedOnly}
                  onCheckedChange={checked => onFiltersChange({ ...filters, overallocatedOnly: !!checked })}
                  id="overallocated-checkbox"
                />
                <Label htmlFor="overallocated-checkbox">Solo sobreasignados</Label>
              </div>
            )}
            {/* Filtro de rango de fechas */}
            {filtersToShow.includes('dateRange') && mode === 'list' && showDateRange && (
              <div className="space-y-2">
                <Label>Fechas</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.dateRange.from && !filters.dateRange.to && "text-muted-foreground"
                      )}
                      data-test="date-range-button"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange.from && filters.dateRange.to
                        ? `${format(filters.dateRange.from, "dd MMM yyyy", { locale: es })} - ${format(filters.dateRange.to, "dd MMM yyyy", { locale: es })}`
                        : "Elegir rango"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="range"
                      selected={{ from: filters.dateRange.from, to: filters.dateRange.to }}
                      onSelect={range => {
                        if (range && range.from) {
                          onFiltersChange({ ...filters, dateRange: { from: range.from, to: range.to } })
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
            {/* Filtro de estado de proyecto */}
            {filtersToShow.includes('status') && (
              <div className="space-y-2">
                <Label>Estado</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between" data-test="status-multiselect-trigger">
                      <span className="truncate">
                        {filters.status && filters.status.length === 0
                          ? 'Todos los estados'
                          : PROJECT_STATUS_OPTIONS.filter(opt => filters.status?.includes(opt.value)).map(opt => opt.label).join(', ')
                        }
                      </span>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2">
                    <div className="flex items-center justify-between px-2 pb-2">
                      <span className="font-semibold text-sm">Estados</span>
                      {filters.status && filters.status.length > 0 && (
                        <button
                          type="button"
                          onClick={() => onFiltersChange({ ...filters, status: [] })}
                          className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 px-2 py-1 rounded transition-colors"
                          data-test="clear-status-filter"
                        >
                          <X className="h-3 w-3" /> Limpiar
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                      {PROJECT_STATUS_OPTIONS.map(option => (
                        <label key={option.value} className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded hover:bg-accent">
                          <Checkbox
                            checked={filters.status?.includes(option.value)}
                            onCheckedChange={checked => {
                              if (checked) {
                                onFiltersChange({ ...filters, status: [...(filters.status || []), option.value] })
                              } else {
                                onFiltersChange({ ...filters, status: (filters.status || []).filter(val => val !== option.value) })
                              }
                            }}
                            id={`status-checkbox-${option.value}`}
                          />
                          <span className="text-sm">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            )}
            {/* Filtro de cliente */}
            {filtersToShow.includes('client') && projects.length > 0 && (
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select
                  value={filters.clientId || 'all'}
                  onValueChange={value => onFiltersChange({ ...filters, clientId: value })}
                >
                  <SelectTrigger className="w-full mt-1" data-test="client-select">
                    <SelectValue placeholder="Todos los clientes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los clientes</SelectItem>
                    {projects
                      .filter(project => project.clients && typeof project.clients.id === 'string')
                      .map(project => (
                        project.clients ? (
                          <SelectItem key={project.clients.id} value={project.clients.id}>
                            {project.clients.name}
                          </SelectItem>
                        ) : null
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {/* Filtro de tipo de contratación */}
            {filtersToShow.includes('contractType') && (
              <div className="space-y-2">
                <Label>Tipo de contratación</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between" data-test="contract-type-multiselect-trigger">
                      <span className="truncate">
                        {filters.contractType && filters.contractType.length === 0
                          ? 'Todos los tipos'
                          : PROJECT_CONTRACT_TYPE_OPTIONS.filter(opt => filters.contractType?.includes(opt.value)).map(opt => opt.label).join(', ')
                        }
                      </span>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2">
                    <div className="flex items-center justify-between px-2 pb-2">
                      <span className="font-semibold text-sm">Tipos de contratación</span>
                      {filters.contractType && filters.contractType.length > 0 && (
                        <button
                          type="button"
                          onClick={() => onFiltersChange({ ...filters, contractType: [] })}
                          className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 px-2 py-1 rounded transition-colors"
                          data-test="clear-contract-type-filter"
                        >
                          <X className="h-3 w-3" /> Limpiar
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                      {PROJECT_CONTRACT_TYPE_OPTIONS.map(option => (
                        <label key={option.value} className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded hover:bg-accent">
                          <Checkbox
                            checked={filters.contractType?.includes(option.value)}
                            onCheckedChange={checked => {
                              if (checked) {
                                onFiltersChange({ ...filters, contractType: [...(filters.contractType || []), option.value] })
                              } else {
                                onFiltersChange({ ...filters, contractType: (filters.contractType || []).filter(val => val !== option.value) })
                              }
                            }}
                            id={`contract-type-checkbox-${option.value}`}
                          />
                          <span className="text-sm">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  )
}
