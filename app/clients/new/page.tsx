'use client'

import React, { useState } from 'react'
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useClients } from '@/hooks/use-clients'
import { useToast } from '@/hooks/use-toast'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

export default function NewClientPage() {
  const router = useRouter()
  const { createClient } = useClients()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [warnings, setWarnings] = useState<string[]>([])

  const formSchema = z.object({
    name: z.string()
      .min(1, "El nombre del cliente es obligatorio")
      .max(30, "El nombre no puede superar los 30 caracteres"),
    description: z.string().max(500, "Máximo 500 caracteres").optional(),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  })

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true)
      await createClient({
        name: data.name.trim(),
        description: data.description ? data.description.trim() : null,
      })

      toast({
        title: 'Cliente creado',
        description: 'El cliente se ha creado exitosamente.',
      })

      router.push('/clients')
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al crear el cliente',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const name = form.watch('name');
  const description = form.watch('description');

  return (
    <main className="flex-1 container mx-auto px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" asChild data-test="back-button">
            <Link href="/clients">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold" data-test="new-client-title">Nuevo Cliente</h1>
            <p className="text-muted-foreground">Registra un nuevo cliente en el sistema</p>
          </div>
        </div>

        {warnings.length > 0 && (
          <Alert className="mb-6 border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside">
                {warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle data-test="client-info-title">Detalles del Cliente</CardTitle>
            <CardDescription>Completa la información del nuevo cliente</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Cliente *</Label>
                <Input
                  id="name"
                  {...form.register('name')}
                  placeholder="Ej: Empresa XYZ"
                  data-test="client-name-field"

                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  {...form.register('description')}
                  placeholder="Información adicional sobre el cliente..."
                  rows={4}
                  data-test="client-description-field"
                />
                {form.formState.errors.description && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.description.message}
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" type="button" onClick={() => router.push('/clients')}
                  data-test="cancel-button">
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting} 
                  data-test="create-client-button">
                  {isSubmitting && <Save className="mr-2 h-4 w-4 animate-spin" />}
                  Crear Cliente
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {name && (
          <Card className="mt-6 bg-muted/50">
            <CardContent className="pt-6">
              <h3 className="font-medium mb-2">Resumen del Cliente</h3>
              <div className="space-y-1 text-sm">
                <div>
                  <strong>Nombre:</strong> {name}
                </div>
                {description && (
                  <div>
                    <strong>Descripción:</strong> {description}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}
