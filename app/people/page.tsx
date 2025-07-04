'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  X,
  ChevronDown,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'

import { usePeople } from '@/hooks/use-people'
import { getDisplayName, getPersonStatusBadge, getPersonTypeBadge } from '@/lib/people'
import { PERSON_STATUS_OPTIONS, PERSON_TYPE_OPTIONS, PERSON_STATUS, PERSON_TYPE } from '@/constants/people'
import { renderDate } from '@/utils/renderDate'
import { getProfiles, Profile } from '@/lib/services/profiles.service'

export default function PeoplePage() {
  const router = useRouter()
  const { people, loading, error, deletePerson } = usePeople()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string[]>([PERSON_STATUS.ACTIVE, PERSON_STATUS.PAUSED])
  const [typeFilter, setTypeFilter] = useState<string[]>([])
  const [profileFilter, setProfileFilter] = useState<string[]>([])
  const [statusPopoverOpen, setStatusPopoverOpen] = useState(false)
  const [typePopoverOpen, setTypePopoverOpen] = useState(false)
  const [profilePopoverOpen, setProfilePopoverOpen] = useState(false)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loadingProfiles, setLoadingProfiles] = useState(false)
  const [errorProfiles, setErrorProfiles] = useState<string | null>(null)

  useEffect(() => {
    setLoadingProfiles(true)
    getProfiles()
      .then(data => setProfiles(data))
      .catch(e => setErrorProfiles(e.message || 'Error al cargar perfiles'))
      .finally(() => setLoadingProfiles(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando personas...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600" data-test="error-title">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()} data-test="retry-button">Reintentar</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const filteredPeople = people.filter(person => {
    const fullName = getDisplayName(person)
    const matchesSearch =
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.profile.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(person.status)
    const matchesType = typeFilter.length === 0 || typeFilter.includes(person.type)
    const matchesProfile = profileFilter.length === 0 || profileFilter.includes(person.profile)

    return matchesSearch && matchesStatus && matchesType && matchesProfile
  })

  const handleDelete = async (id: string, fullName: string) => {
    if (confirm(`¿Estás seguro de que quieres eliminar a ${fullName}?`)) {
      try {
        await deletePerson(id)
        toast.success('Persona eliminada correctamente')
      } catch (error) {
        toast.error('Error al eliminar la persona')
      }
    }
  }

  const getLabel = (options: { value: string; label: string }[], value: string) =>
    options.find(opt => opt.value === value)?.label || value

  return (
    <main className="flex-1 container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold" data-test="people-title">Personas</h1>
          <p className="text-muted-foreground">Gestiona colaboradores y su disponibilidad</p>
        </div>
        <Button asChild data-test="create-person-button">
          <Link href="/people/new">
            <Plus className="h-4 w-4 mr-2" />
            Agregar Persona
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-1/4 sm:max-w-xs">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o perfil..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
              data-test="search-person-input"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-end items-center">
            {/* Estado */}
            <Popover open={statusPopoverOpen} onOpenChange={setStatusPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="min-w-[220px] justify-between"
                  data-test="status-filter-popover-trigger"
                >
                  <span className="truncate">
                    {statusFilter.length === 0
                      ? 'Todos los estados'
                      : statusFilter.map(val => PERSON_STATUS_OPTIONS.find(opt => opt.value === val)?.label || val).join(', ')
                    }
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2">
                <div className="flex items-center justify-between px-2 pb-2">
                  <span className="font-semibold text-sm">Estado</span>
                  {statusFilter.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setStatusFilter([])}
                      className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 px-2 py-1 rounded transition-colors"
                      data-test="clear-status-filter"
                    >
                      <X className="h-3 w-3" /> Limpiar
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                  {PERSON_STATUS_OPTIONS.map(option => (
                    <label key={option.value} className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded hover:bg-accent">
                      <Checkbox
                        checked={statusFilter.includes(option.value)}
                        onCheckedChange={checked => {
                          setStatusFilter(prev =>
                            checked
                              ? [...prev, option.value]
                              : prev.filter(val => val !== option.value)
                          )
                        }}
                        id={`status-checkbox-${option.value}`}
                      />
                      <span className="text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            {/* Tipo */}
            <Popover open={typePopoverOpen} onOpenChange={setTypePopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="min-w-[220px] justify-between"
                  data-test="type-filter-popover-trigger"
                >
                  <span className="truncate">
                    {typeFilter.length === 0
                      ? 'Todos los tipos'
                      : typeFilter.map(val => PERSON_TYPE_OPTIONS.find(opt => opt.value === val)?.label || val).join(', ')
                    }
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2">
                <div className="flex items-center justify-between px-2 pb-2">
                  <span className="font-semibold text-sm">Tipo</span>
                  {typeFilter.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setTypeFilter([])}
                      className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 px-2 py-1 rounded transition-colors"
                      data-test="clear-type-filter"
                    >
                      <X className="h-3 w-3" /> Limpiar
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                  {PERSON_TYPE_OPTIONS.map(option => (
                    <label key={option.value} className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded hover:bg-accent">
                      <Checkbox
                        checked={typeFilter.includes(option.value)}
                        onCheckedChange={checked => {
                          setTypeFilter(prev =>
                            checked
                              ? [...prev, option.value]
                              : prev.filter(val => val !== option.value)
                          )
                        }}
                        id={`type-checkbox-${option.value}`}
                      />
                      <span className="text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            {/* Perfil */}
            <Popover open={profilePopoverOpen} onOpenChange={setProfilePopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="min-w-[220px] justify-between"
                  data-test="profile-filter-popover-trigger"
                >
                  <span className="truncate">
                    {profileFilter.length === 0
                      ? 'Todos los perfiles'
                      : profileFilter.join(', ')
                    }
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2">
                <div className="flex items-center justify-between px-2 pb-2">
                  <span className="font-semibold text-sm">Perfil</span>
                  {profileFilter.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setProfileFilter([])}
                      className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 px-2 py-1 rounded transition-colors"
                      data-test="clear-profile-filter"
                    >
                      <X className="h-3 w-3" /> Limpiar
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                  {loadingProfiles ? (
                    <div className="px-4 py-2 text-gray-500">Cargando...</div>
                  ) : errorProfiles ? (
                    <div className="px-4 py-2 text-red-500">{errorProfiles}</div>
                  ) : profiles.length === 0 ? (
                    <div className="px-4 py-2 text-gray-500">No hay perfiles</div>
                  ) : (
                    profiles.map(profile => (
                      <label key={profile.id} className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded hover:bg-accent">
                        <Checkbox
                          checked={profileFilter.includes(profile.name)}
                          onCheckedChange={checked => {
                            setProfileFilter(prev =>
                              checked
                                ? [...prev, profile.name]
                                : prev.filter(val => val !== profile.name)
                            )
                          }}
                          id={`profile-checkbox-${profile.id}`}
                        />
                        <span className="text-sm">{profile.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* People Table */}
      <Card>
        <CardHeader>
          <CardTitle data-test="people-list-title">Lista de Personas ({filteredPeople.length})</CardTitle>
          <CardDescription>Colaboradores registrados en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Fecha de ingreso</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPeople.map(person => (
                <TableRow key={person.id} data-test={`person-row-${person.id}`}>
                  <TableCell className="font-medium">{getDisplayName(person)}</TableCell>
                  <TableCell>{person.profile}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{renderDate(person.start_date)}</div>
                      {person.end_date && (
                        <div className="text-muted-foreground">
                          hasta {renderDate(person.end_date)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPersonStatusBadge(person.status)}>
                      {getLabel(PERSON_STATUS_OPTIONS, person.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPersonTypeBadge(person.type)}>
                      {getLabel(PERSON_TYPE_OPTIONS, person.type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/people/${person.id}/edit`} data-test={`edit-person-${person.id}`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDelete(person.id, getDisplayName(person))}
                          data-test={`delete-person-${person.id}`}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  )
}
