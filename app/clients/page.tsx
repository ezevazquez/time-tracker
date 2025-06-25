'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Search, MoreHorizontal, Edit, Trash2, Folder } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { Badge } from '@/components/ui/badge'
import { getStatusBadge, getStatusLabel } from '@/lib/projects'

import { useClients } from '@/hooks/use-clients'
import { useProjects } from '@/hooks/use-projects'


export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()
  const { clients, loading, error, deleteClient } = useClients()
  const { projects } = useProjects()
  const [clientToDelete, setClientToDelete] = useState<string | null>(null)
  const { toast } = useToast()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando clientes...</p>
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

  const filteredClients = clients.filter(client => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.description && client.description.toLowerCase().includes(searchTerm.toLowerCase()))

    return matchesSearch
  })

  const handleDelete = (id: string) => {
    setClientToDelete(id)
  }

  const confirmDelete = async () => {
    if (!clientToDelete) return
    try {
      await deleteClient(clientToDelete)
      toast({ title: 'Cliente eliminado', description: 'El cliente fue eliminado correctamente.' })
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error al eliminar el cliente'
      toast({ title: 'Error al eliminar', description: errorMsg, variant: 'destructive' })
    } finally {
      setClientToDelete(null)
    }
  }

  return (
    <main className="flex-1 container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold" data-test="clients-title">Clientes</h1>
          <p className="text-muted-foreground">Gestiona los clientes de la empresa</p>
        </div>
        <Button asChild data-test="create-client-button">
          <Link href="/clients/new">
            <Plus className="h-4 w-4 mr-2" />
            Crear Cliente
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o descripción..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
              data-test="search-client-input"
            />
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle data-test="clients-list-title">Lista de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead style={{ width: 300, minWidth: 100, maxWidth: 180 }}>Nombre</TableHead>
                <TableHead style={{ minWidth: 200 }}>Proyectos</TableHead>
                <TableHead className="w-[100px] text-right" style={{ textAlign: 'right' }}>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No se encontraron clientes
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map(client => {
                  const clientProjects = projects.filter(p => p.client_id === client.id && p.status !== 'Finished')
                  return (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">
                        <span
                          title={client.name.length > 30 ? client.name : undefined}
                          style={{
                            display: 'inline-block',
                            maxWidth: 120,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            verticalAlign: 'bottom',
                          }}
                        >
                          {client.name.length > 30 ? client.name.slice(0, 30) + '…' : client.name}
                        </span>
                      </TableCell>
                      <TableCell style={{ paddingRight: 0 }}>
                        {clientProjects.length > 0 ? (
                          <div
                            className="bg-muted/40 rounded-lg p-2 max-h-40 overflow-y-auto border border-muted/60 shadow-sm"
                            style={{ minWidth: 220, width: '100%', boxSizing: 'border-box' }}
                          >
                            {clientProjects.map((project, idx) => {
                              const assigned = project.assignedFTE || 0
                              const total = project.fte || 0
                              const utilization = total > 0 ? Math.round((assigned / total) * 100) : 0
                              return (
                                <div key={project.id} className="flex items-center gap-2 py-1 border-b last:border-b-0 border-muted/30">
                                  <Folder className="h-4 w-4 text-primary/70 shrink-0" />
                                  <Link
                                    href={`/projects/${project.id}/show`}
                                    className="text-primary underline hover:text-primary/80 text-xs font-medium truncate"
                                    style={{ maxWidth: 180, display: 'inline-block' }}
                                    title={`${project.name}\n${project.start_date ? `Inicio: ${project.start_date}` : ''}${project.end_date ? `\nFin: ${project.end_date}` : ''}\nUtilización: ${utilization}%`}
                                  >
                                    {project.name.length > 36 ? project.name.slice(0, 36) + '…' : project.name}
                                  </Link>
                                  <Badge className={getStatusBadge(project.status)} variant="outline" style={{ fontSize: 10 }}>
                                    {getStatusLabel(project.status)}
                                  </Badge>
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Sin proyectos</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild data-test={`client-actions-${client.id}`}>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => router.push(`/clients/${client.id}/edit`)}
                              data-test={`edit-client-${client.id}`}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDelete(client.id)}
                              data-test={`delete-client-${client.id}`}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de confirmación */}
      {clientToDelete && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow-lg">
            <h2 className="text-lg font-bold mb-4" data-test="confirm-delete-client-title">Confirmar eliminación</h2>
            <p>¿Estás seguro de que deseas eliminar este cliente?</p>
            <div className="flex justify-end gap-2 mt-6">
              <button className="px-4 py-2 bg-gray-200 rounded" onClick={() => setClientToDelete(null)} data-test="cancel-delete-client-button">Cancelar</button>
              <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={confirmDelete} data-test="confirm-delete-client-button">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
