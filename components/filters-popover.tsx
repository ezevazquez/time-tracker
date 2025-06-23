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
import { CalendarIcon, Filter, X } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/utils/classnames'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import type { Person } from '@/types/people'
import type { ProjectWithClient } from '@/types/project'
import { es } from "date-fns/locale"
import type { TimelineFilters } from "@/types/timeline"

interface FiltersPopoverProps {
  people: Person[]
  projects: ProjectWithClient[]
  filters: TimelineFilters
  onFiltersChange: (filters: TimelineFilters) => void
  onClearFilters: () => void
  showDateRange?: boolean
  trigger?: React.ReactNode
  mode: 'timeline' | 'list'
}

export function FiltersPopover({
  people,
  projects,
  filters,
  onFiltersChange,
  onClearFilters,
  showDateRange = true,
  trigger,
  mode,
}: FiltersPopoverProps) {
  const [open, setOpen] = useState(false)
  const [isSelectingStart, setIsSelectingStart] = useState(true)

  // Get unique profiles from people
  const uniqueProfiles = Array.from(new Set(people.map(p => p.profile)))
    .filter(Boolean)
    .sort()

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
    filters.personProfile !== defaultProfile ||
    filters.personType !== defaultType ||
    filters.overallocatedOnly !== defaultOverallocated ||
    (mode === 'list' && (
      filters.dateRange.from.getTime() !== defaultDateRange.from.getTime() ||
      (filters.dateRange.to ? filters.dateRange.to.getTime() : 0) !== defaultDateRange.to.getTime()
    ))

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="h-8">
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
            <CardTitle className="text-lg flex items-center justify-between">
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
                >
                  <X className="h-4 w-4 mr-1" />
                  Limpiar
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Person Profile Filter */}
            <div className="space-y-2">
              <Label>Perfil</Label>
              <Select
                value={filters.personProfile}
                onValueChange={(value) => onFiltersChange({ ...filters, personProfile: value })}
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los perfiles</SelectItem>
                  {uniqueProfiles.map(profile => (
                    <SelectItem key={profile} value={profile}>{profile}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {projects.length > 0 && (
              <div className="space-y-2">
                <Label>Proyecto</Label>
                <Select
                  value={filters.projectId || 'all'}
                  onValueChange={value => onFiltersChange({ ...filters, projectId: value })}
                >
                  <SelectTrigger className="w-full mt-1">
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

            {/* Person Type Filter */}
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={filters.personType}
                onValueChange={(value) => onFiltersChange({ ...filters, personType: value })}
              >
                <SelectTrigger className="w-full mt-1">
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

            {/* Date Range Filter - Only in list mode */}
            {mode === 'list' && showDateRange && (
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
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange.from && filters.dateRange.to
                        ? `${format(filters.dateRange.from, "dd MMM yyyy", { locale: es })} - ${format(filters.dateRange.to, "dd MMM yyyy", { locale: es })}`
                        : "Elegir rango"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-auto p-0">
                    <Calendar
                      initialFocus
                      mode="range"
                      selected={{ from: filters.dateRange.from, to: filters.dateRange.to }}
                      onDayClick={(date) => {
                        if (isSelectingStart) {
                          onFiltersChange({ ...filters, dateRange: { from: date, to: undefined } })
                          setIsSelectingStart(false)
                        } else {
                          let from = filters.dateRange.from;
                          let to = date;
                          if (from && to && to < from) {
                            // Si el usuario selecciona una fecha anterior, intercambiar
                            [from, to] = [to, from];
                          }
                          onFiltersChange({ ...filters, dateRange: { from: from!, to: to } })
                          setIsSelectingStart(true)
                        }
                      }}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Overallocated Filter */}
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Solo sobreasignados</Label>
              <Checkbox
                checked={filters.overallocatedOnly}
                onCheckedChange={(checked) => onFiltersChange({ ...filters, overallocatedOnly: checked as boolean })}
              />
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  )
}
