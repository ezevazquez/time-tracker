'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'

import {
  ArrowLeft,
  Save,
  AlertTriangle,
  CalendarIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Alert, AlertDescription } from '@/components/ui/alert'

import { cn } from '@/utils/classnames'
import { useProjects } from '@/hooks/use-projects'
import { clientsService } from '@/lib/services/clients.service'
import { PROJECT_STATUS_OPTIONS } from '@/constants/projects'

import type { Client } from '@/types/client'


export default function NewProjectPage() {
  const router = useRouter()
  const { createProject } = useProjects()

  const [clients, setClients] = useState<Client[]>([])
  const [loadingClients, setLoadingClients] = useState(true)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'In Progress' as 'In Progress' | 'Finished' | 'On Hold' | 'Not Started',
    start_date: undefined as Date | undefined,
    end_date: undefined as Date | undefined,
    client_id: '' as string | null,
    fte: null as number | null,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [warnings, setWarnings] = useState<string[]>([])

  // Fetch clients
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const clientsData = await clientsService.getAll()
        setClients(clientsData)
      } catch (error) {
        console.error('Error fetching clients:', error)
      } finally {
        setLoadingClients(false)
      }
    }

    fetchClients()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newWarnings: string[] = []
    if (!formData.name.trim()) newWarnings.push('El nombre del proyecto es obligatorio')
    if (formData.fte === null || isNaN(formData.fte)) newWarnings.push('El FTE total es obligatorio')
    if (formData.fte !== null && (formData.fte <= 0 || formData.fte > 60 || !Number.isInteger(formData.fte))) newWarnings.push('El FTE debe ser menor a 60 (Equivalente a 5 años)')
    if (!formData.start_date) newWarnings.push('La fecha de inicio es obligatoria')
    if (!formData.end_date) newWarnings.push('La fecha de fin es obligatoria')
    if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) newWarnings.push('La fecha de inicio debe ser anterior o igual a la fecha de fin')
    if (!formData.client_id || formData.client_id === 'no-client') newWarnings.push('El cliente es obligatorio')
    setWarnings(newWarnings)
    if (newWarnings.length > 0) return
    try {
      setIsSubmitting(true)
      await createProject({
        id: uuidv4(),
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        status: formData.status,
        start_date: formData.start_date?.toISOString().split('T')[0] || null,
        end_date: formData.end_date?.toISOString().split('T')[0] || null,
        client_id: formData.client_id || null,
        fte: formData.fte,
      })
      toast.success('El proyecto se ha creado exitosamente.')
      router.push('/projects')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear el proyecto')
    } finally {
      setIsSubmitting(false)
    }
  }

  const checkForWarnings = () => {
    const newWarnings: string[] = []
    if (!formData.name.trim()) newWarnings.push('El nombre del proyecto es obligatorio')
    if (formData.fte === null || isNaN(formData.fte)) newWarnings.push('El FTE total es obligatorio')
    if (formData.fte !== null && (formData.fte <= 0 || formData.fte > 60 || !Number.isInteger(formData.fte))) newWarnings.push('El FTE debe ser menor a 60 (Equivalente a 5 años)')
    if (!formData.start_date) newWarnings.push('La fecha de inicio es obligatoria')
    if (!formData.end_date) newWarnings.push('La fecha de fin es obligatoria')
    if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) newWarnings.push('La fecha de inicio debe ser anterior o igual a la fecha de fin')
    if (!formData.client_id || formData.client_id === 'no-client') newWarnings.push('El cliente es obligatorio')
    setWarnings(newWarnings)
  }

  useEffect(() => {
    checkForWarnings()
  }, [formData])

  const selectedClient = clients.find(client => client.id === formData.client_id)

  return (
    <main className="flex-1 container mx-auto px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" asChild>
            <Link href="/projects">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Nuevo Proyecto</h1>
            <p className="text-muted-foreground">Crea un nuevo proyecto para asignar recursos</p>
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
            <CardTitle>Detalles del Proyecto</CardTitle>
            <CardDescription>Completa la información del nuevo proyecto</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Proyecto *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: E-commerce Platform"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project_code">Código del Proyecto</Label>
                  <Input
                    id="project_code"
                    value="Se generará automáticamente"
                    disabled
                    className="bg-gray-50 text-gray-500"
                  />
                  <p className="text-sm text-muted-foreground">
                    Código único de 2 letras + 2 números (ej: AB12)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client">Cliente *</Label>
                  <Select
                    value={formData.client_id || ''}
                    onValueChange={value => setFormData({ ...formData, client_id: value || null })}
                  >
                    <SelectTrigger data-test="client-select">
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(
                      value: 'In Progress' | 'Finished' | 'On Hold' | 'Not Started'
                    ) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger data-test="status-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECT_STATUS_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Fecha de Inicio *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !formData.start_date && 'text-muted-foreground'
                        )}
                        data-test="start-date-button"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.start_date ? (
                          format(formData.start_date, 'PPP', { locale: es })
                        ) : (
                          <span>Seleccionar fecha</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.start_date}
                        onSelect={date => setFormData({ ...formData, start_date: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Fecha de Fin *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !formData.end_date && 'text-muted-foreground'
                        )}
                        data-test="end-date-button"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.end_date ? (
                          format(formData.end_date, 'PPP', { locale: es })
                        ) : (
                          <span>Seleccionar fecha</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.end_date}
                        onSelect={date => setFormData({ ...formData, end_date: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fte">FTE Total *</Label>
                  <Input
                    id="fte"
                    type="number"
                    step="1"
                    min="1"
                    max="60"
                    value={formData.fte === null ? '' : formData.fte}
                    onChange={e => {
                      const value = e.target.value;
                      if (value === '') {
                        setFormData({ ...formData, fte: null })
                      } else {
                        const intValue = parseInt(value, 10);
                        if (/^\d+$/.test(value) && intValue > 0 && intValue <= 60) {
                          setFormData({ ...formData, fte: intValue })
                        } else {
                          setFormData({ ...formData, fte: null })
                        }
                      }
                    }}
                    placeholder="Ej: 2"
                    data-test="fte-input"
                  />
                  <p className="text-sm text-muted-foreground">
                    Número entero menor o igual a 60 (Equivalente a 5 años)
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe el proyecto..."
                  rows={4}
                  data-test="description-textarea"
                />
              </div>

              {formData.name && (
                <Card className="bg-muted/50">
                  <CardContent className="pt-6">
                    <h3 className="font-medium mb-2">Resumen del Proyecto</h3>
                    <div className="space-y-1 text-sm">
                      <div>
                        <strong>Nombre:</strong> {formData.name}
                      </div>
                      {selectedClient && (
                        <div>
                          <strong>Cliente:</strong> {selectedClient.name}
                        </div>
                      )}
                      <div>
                        <strong>Estado:</strong>{' '}
                        {PROJECT_STATUS_OPTIONS.find(opt => opt.value === formData.status)?.label || formData.status}


                      </div>
                      {formData.start_date && formData.end_date && (
                        <div>
                          <strong>Período:</strong> {format(formData.start_date, 'dd/MM/yyyy')} -{' '}
                          {format(formData.end_date, 'dd/MM/yyyy')}
                        </div>
                      )}
                      {formData.fte && (
                        <div>
                          <strong>FTE Total:</strong> {formData.fte}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-4 pt-6">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={!formData.name.trim() || !formData.fte || formData.fte <= 0 || !formData.start_date || !formData.end_date || !formData.client_id || formData.client_id === 'no-client' || warnings.length > 0 || isSubmitting}
                  data-test="create-project-button"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Creando...' : 'Crear Proyecto'}
                </Button>
                <Button type="button" variant="outline" asChild data-test="cancel-project-button">
                  <Link href="/projects">Cancelar</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
