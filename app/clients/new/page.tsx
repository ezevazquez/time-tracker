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

export default function NewClientPage() {
  const router = useRouter()
  const { createClient } = useClients()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [warnings, setWarnings] = useState<string[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      setWarnings(['El nombre del cliente es obligatorio'])
      return
    }

    try {
      setIsSubmitting(true)
      await createClient({
        name: formData.name.trim(),
        description: formData.description.trim() || null,
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

  const checkForWarnings = () => {
    const newWarnings: string[] = []

    if (!formData.name.trim()) {
      newWarnings.push('El nombre del cliente es obligatorio')
    }

    setWarnings(newWarnings)
  }

  React.useEffect(() => {
    checkForWarnings()
  }, [formData])

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
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Cliente *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Empresa XYZ"
                  data-test="client-name-field"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Información adicional sobre el cliente..."
                  rows={4}
                  data-test="client-description-field"
                />
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

        {formData.name && (
          <Card className="mt-6 bg-muted/50">
            <CardContent className="pt-6">
              <h3 className="font-medium mb-2">Resumen del Cliente</h3>
              <div className="space-y-1 text-sm">
                <div>
                  <strong>Nombre:</strong> {formData.name}
                </div>
                {formData.description && (
                  <div>
                    <strong>Descripción:</strong> {formData.description}
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
