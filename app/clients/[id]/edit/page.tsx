'use client'


import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'

import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Loader2 } from 'lucide-react'

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

import { toast } from 'sonner'

import { useClients } from '@/hooks/use-clients'
import { clientsService } from '@/lib/services/clients.service'
import type { Client } from '@/types/client'

const formSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
  description: z.string().optional(),
})


export default function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [client, setClient] = useState<Client | null>(null)
  const [isLoadingClient, setIsLoadingClient] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { updateClient } = useClients()

  // Unwrap the params Promise
  const { id } = use(params)

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

      toast.success('Cliente actualizado correctamente')
      router.push('/clients')
    } catch (error) {
      toast.error('Error al actualizar el cliente')
      console.error('Error updating client:', error)
    } finally {
      setIsLoading(false)
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push('/clients')}>Volver a la lista</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <main className="flex-1 container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Editar Cliente</h1>
        <p className="text-muted-foreground">Actualiza los datos del cliente</p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Datos del Cliente</CardTitle>
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
                      <Input placeholder="Nombre del cliente" {...field} />
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
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button variant="outline" type="button" onClick={() => router.push('/clients')}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar Cambios
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  )
}
