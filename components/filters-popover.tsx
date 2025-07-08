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

  const hasActiveFilters =
    (Array.isArray(filters.personProfile) ? filters.personProfile.length > 0 : !!filters.personProfile) ||
    filters.personType !== defaultType ||
    filters.overallocatedOnly !== defaultOverallocated ||
    (mode === 'list' && (
      filters.dateRange.from.getTime() !== defaultDateRange.from.getTime() ||
      (filters.dateRange.to ? filters.dateRange.to.getTime() : 0) !== defaultDateRange.to.getTime()
    ))

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="h-8" data-test="filters-button">
      <Filter className="h-4 w-4 mr-2" />
      Filtros
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
                <Select
                  value={filters.projectId || 'all'}
                  onValueChange={value => onFiltersChange({ ...filters, projectId: value })}
                >
                  <SelectTrigger className="w-full mt-1" data-test="project-select">
                    <SelectValue placeholder="Todos los proyectos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los proyectos</SelectItem>
                    {projects
                      .filter(project => typeof project.id === 'string' && project.id.trim() !== '')
                      .map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}{project.clients ? ` - ${project.clients.name}` : ''}
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Label>Rango de fechas</Label>
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
                <Select
                  value={filters.status || 'all'}
                  onValueChange={value => onFiltersChange({ ...filters, status: value })}
                >
                  <SelectTrigger className="w-full mt-1" data-test="status-select">
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    {/* Aquí deberías mapear los estados posibles de proyecto */}
                    {/* Ejemplo: */}
                    {/* PROJECT_STATUS_OPTIONS.map(opt => <SelectItem value={opt.value}>{opt.label}</SelectItem>) */}
                  </SelectContent>
                </Select>
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
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  )
}
