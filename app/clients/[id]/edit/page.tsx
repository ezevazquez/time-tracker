'use client'

import { useState, useEffect, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Loader2, ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

import { useToast } from '@/hooks/use-toast'

import { useClients } from '@/hooks/use-clients'
import { clientsService } from '@/lib/services/clients.service'
import type { Client } from '@/types/client'
import { ResourceError } from '@/components/ui/resource-error'

const formSchema = z.object({
  name: z.string()
    .min(2, { message: 'El nombre debe tener al menos 2 caracteres' })
    .max(30, { message: 'El nombre no puede superar los 30 caracteres' }),
  description: z.string().max(500, { message: 'La descripción no puede superar los 500 caracteres' }).optional(),
})

export default function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const searchParams = useSearchParams()
  const from = searchParams.get('from')
  const backHref = from === 'show' ? `/clients/${id}/show` : '/clients'
  const [isLoading, setIsLoading] = useState(false)
  const [client, setClient] = useState<Client | null>(null)
  const [isLoadingClient, setIsLoadingClient] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { updateClient, deleteClient } = useClients()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  })

  // Fetch client data
  useEffect(() => {
    async function fetchClient() {
      try {
        setIsLoadingClient(true)
        const clientData = await clientsService.getById(id)
        if (!clientData) {
          setError('Cliente no encontrado')
          return
        }
        setClient(clientData)
        form.reset({
          name: clientData.name,
          description: clientData.description || '',
        })
      } catch (err) {
        console.error('Error fetching client:', err)
        setError(err instanceof Error ? err.message : 'Error al cargar el cliente')
      } finally {
        setIsLoadingClient(false)
      }
    }

    fetchClient()
  }, [id, form])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true)
      await updateClient(id, {
        name: values.name.trim(),
        description: values.description?.trim() || null,
      })

      toast({ title: 'Cliente actualizado', description: 'El cliente fue actualizado correctamente.' })
      router.push('/clients')
    } catch (error) {
      toast({ title: 'Error al actualizar', description: 'Error al actualizar el cliente', variant: 'destructive' })
      console.error('Error updating client:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Función para borrar el cliente
  const handleDelete = () => {
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!client) return
    try {
      await deleteClient(client.id)
      toast({ title: 'Cliente eliminado', description: 'El cliente fue eliminado correctamente.' })
      router.push('/clients')
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error al eliminar el cliente'
      toast({ title: 'Error al eliminar', description: errorMsg, variant: 'destructive' })
      // console.error('Error deleting client:', error)
    } finally {
      setShowDeleteModal(false)
    }
  }

  if (isLoadingClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando cliente...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return <ResourceError error={error} resourceName="Cliente" resourcePath="/clients" />
  }

  return (
    <main className="flex-1 container mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <Button variant="outline" size="icon" asChild data-test="back-button">
            <Link href={backHref}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold" data-test="edit-client-button">Editar Cliente</h1>
        </div>
        <p className="text-muted-foreground">Actualiza los datos del cliente</p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle data-test="client-info-title">Datos del Cliente</CardTitle>
          <CardDescription>Completa los campos para actualizar el cliente</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Cliente</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre del cliente" {...field} data-test="client-name-field"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descripción del cliente"
                        {...field}
                        value={field.value || ''}
                        data-test="client-description-field"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <CardFooter className="flex justify-end gap-2">
                <Button type="submit" disabled={isLoading} data-test="save-button">Guardar Cambios</Button>
                <Button type="button" variant="destructive" onClick={handleDelete} disabled={isLoading} data-test="delete-button">Eliminar</Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Modal de confirmación */}
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow-lg">
            <h2 className="text-lg font-bold mb-4" data-test="confirm-delete-title">Confirmar eliminación</h2>
            <p>¿Estás seguro de que deseas eliminar este cliente?</p>
            <div className="flex justify-end gap-2 mt-6">
              <button className="px-4 py-2 bg-gray-200 rounded" onClick={() => setShowDeleteModal(false)} data-test="cancel-delete-button">Cancelar</button>
              <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={confirmDelete} data-test="confirm-delete-button">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
