'use client'

import type React from 'react'
import { useState } from 'react'
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
import { cn } from '@/lib/utils'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import type { Person, Project } from '@/lib/supabase'

interface FiltersPopoverProps {
  people: Person[]
  projects: Project[]
  filters: {
    personProfile: string
    projectStatus: string
    dateRange: { from: Date; to: Date }
    overallocatedOnly: boolean
  }
  onFiltersChange: (filters: any) => void
  onClearFilters: () => void
  showDateRange?: boolean
  trigger?: React.ReactNode
}

export function FiltersPopover({
  people,
  projects,
  filters,
  onFiltersChange,
  onClearFilters,
  showDateRange = true,
  trigger,
}: FiltersPopoverProps) {
  const [open, setOpen] = useState(false)

  // Get unique profiles from people
  const uniqueProfiles = Array.from(new Set(people.map(p => p.profile)))
    .filter(Boolean)
    .sort()

  // Get unique project statuses
  const uniqueStatuses = Array.from(new Set(projects.map(p => p.status)))
    .filter(Boolean)
    .sort()

  const hasActiveFilters =
    filters?.personProfile || filters?.projectStatus || filters?.overallocatedOnly

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="h-8">
      <Filter className="h-4 w-4 mr-2" />
      Filtros
      {hasActiveFilters && (
        <span className="ml-2 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
          {
            [filters?.personProfile, filters?.projectStatus, filters?.overallocatedOnly].filter(
              Boolean
            ).length
          }
        </span>
      )}
    </Button>
  )

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
                value={filters?.personProfile || ''}
                onValueChange={value =>
                  onFiltersChange({ ...filters, personProfile: value === 'all' ? '' : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los perfiles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los perfiles</SelectItem>
                  {uniqueProfiles.map(profile => (
                    <SelectItem key={profile} value={profile}>
                      {profile}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Project Status Filter */}
            <div className="space-y-2">
              <Label>Estado del proyecto</Label>
              <Select
                value={filters?.projectStatus || ''}
                onValueChange={value =>
                  onFiltersChange({ ...filters, projectStatus: value === 'all' ? '' : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {uniqueStatuses.map(status => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Filter - Only show if enabled */}
            {showDateRange && (
              <div className="space-y-2">
                <Label>Rango de fechas</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'justify-start text-left font-normal',
                          !filters?.dateRange?.from && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters?.dateRange?.from
                          ? format(filters.dateRange.from, 'dd/MM/yy')
                          : 'Desde'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters?.dateRange?.from}
                        onSelect={date =>
                          date &&
                          onFiltersChange({
                            ...filters,
                            dateRange: { ...filters?.dateRange, from: date },
                          })
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'justify-start text-left font-normal',
                          !filters?.dateRange?.to && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters?.dateRange?.to
                          ? format(filters.dateRange.to, 'dd/MM/yy')
                          : 'Hasta'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters?.dateRange?.to}
                        onSelect={date =>
                          date &&
                          onFiltersChange({
                            ...filters,
                            dateRange: { ...filters?.dateRange, to: date },
                          })
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}

            {/* Overallocated Filter */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="overallocated"
                checked={filters?.overallocatedOnly || false}
                onCheckedChange={checked =>
                  onFiltersChange({ ...filters, overallocatedOnly: !!checked })
                }
              />
              <Label htmlFor="overallocated" className="text-sm font-normal">
                Solo sobreasignados
              </Label>
            </div>
          </CardContent>
          <CardFooter className="pt-2 pb-4 flex justify-end">
            <Button size="sm" onClick={() => setOpen(false)}>
              Aplicar
            </Button>
          </CardFooter>
        </Card>
      </PopoverContent>
    </Popover>
  )
}
