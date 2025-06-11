'use client'

import { useState } from 'react'
import { Plus, Search, MoreHorizontal, Edit, Trash2 } from 'lucide-react'
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
import { usePeople } from '@/hooks/use-data'
import { toast } from 'sonner'
import Link from 'next/link'

export default function PeoplePage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('Active')
  const [typeFilter, setTypeFilter] = useState('all')

  const { people, loading, error, deletePerson } = usePeople()

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
        <div className="text-center text-red-600">
          <p>Error: {error}</p>
        </div>
      </div>
    )
  }

  const filteredPeople = people.filter(person => {
    const matchesSearch =
      person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.profile.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || person.status === statusFilter
    const matchesType = typeFilter === 'all' || person.type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  const getStatusBadge = (status: string) => {
    const variants = {
      Active: 'bg-green-100 text-green-800',
      Paused: 'bg-yellow-100 text-yellow-800',
      Terminated: 'bg-red-100 text-red-800',
    }
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'
  }

  const getTypeBadge = (type: string) => {
    const variants = {
      Internal: 'bg-blue-100 text-blue-800',
      External: 'bg-purple-100 text-purple-800',
    }
    return variants[type as keyof typeof variants] || 'bg-gray-100 text-gray-800'
  }

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`¿Estás seguro de que quieres eliminar a ${name}?`)) {
      try {
        await deletePerson(id)
        toast.success('Persona eliminada correctamente')
      } catch (error) {
        toast.error('Error al eliminar la persona')
      }
    }
  }

  return (
    <main className="flex-1 container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Personas</h1>
          <p className="text-muted-foreground">Gestiona colaboradores y su disponibilidad</p>
        </div>
        <Button asChild>
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
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="Active">Activo</SelectItem>
                <SelectItem value="Paused">Pausado</SelectItem>
                <SelectItem value="Terminated">Terminado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="Internal">Interno</SelectItem>
                <SelectItem value="External">Externo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* People Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Personas ({filteredPeople.length})</CardTitle>
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
                  <TableCell className="font-medium">{person.name}</TableCell>
                  <TableCell>{person.profile}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{new Date(person.start_date).toLocaleDateString('es-ES')}</div>
                      {person.end_date && (
                        <div className="text-muted-foreground">
                          hasta {new Date(person.end_date).toLocaleDateString('es-ES')}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadge(person.status)}>
                      {person.status === 'Active'
                        ? 'Activo'
                        : person.status === 'Paused'
                          ? 'Pausado'
                          : person.status === 'Terminated'
                            ? 'Terminado'
                            : person.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getTypeBadge(person.type)}>
                      {person.type === 'Internal' ? 'Interno' : 'Externo'}
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
                          <Link href={`/people/${person.id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDelete(person.id, person.name)}
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
