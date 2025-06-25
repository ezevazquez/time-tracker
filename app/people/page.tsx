'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
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

import { usePeople } from '@/hooks/use-people'
import { getDisplayName, getPersonStatusBadge, getPersonTypeBadge } from '@/lib/people'
import { PERSON_STATUS_OPTIONS, PERSON_TYPE_OPTIONS, PERSON_STATUS, PERSON_TYPE, PERSON_PROFILE_OPTIONS } from '@/constants/people'
import { renderDate } from '@/utils/renderDate'

export default function PeoplePage() {
  const router = useRouter()
  const { people, loading, error, deletePerson } = usePeople()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [profileFilter, setProfileFilter] = useState('all')

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
    const matchesStatus = statusFilter === 'all' || person.status === statusFilter
    const matchesType = typeFilter === 'all' || person.type === typeFilter
    const matchesProfile = profileFilter === 'all' || person.profile === profileFilter

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
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o perfil..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-test="search-person-input"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter} data-test="status-filter-select">
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {PERSON_STATUS_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter} data-test="type-filter-select">
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {PERSON_TYPE_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={profileFilter} onValueChange={setProfileFilter} data-test="profile-filter-select">
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Perfil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los perfiles</SelectItem>
                {PERSON_PROFILE_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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
                <TableRow key={person.id}>
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
