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
import { PROJECT_STATUS_OPTIONS, PROJECT_CONTRACT_TYPE_OPTIONS, ProjectContractType } from '@/constants/projects'

import type { Client } from '@/types/client'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'


export default function NewProjectPage() {
  const router = useRouter()
  const { createProject } = useProjects()

  const [clients, setClients] = useState<Client[]>([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [warnings, setWarnings] = useState<string[]>([])

  type ProjectStatus = 'In Progress' | 'Finished' | 'On Hold' | 'Not Started'

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'In Progress' as ProjectStatus,
    start_date: undefined as Date | undefined,
    end_date: undefined as Date | undefined,
    client_id: '' as string | null,
    fte: null as number | null,
    contract_type: PROJECT_CONTRACT_TYPE_OPTIONS[0].value as string,
  })

  const formSchema = z.object({
    name: z.string()
    .min(1, "El nombre del cliente es obligatorio")
    .max(30, "El nombre no puede superar los 30 caracteres"),
    description: z.string().max(500, "Máximo 500 caracteres").optional(),
    status: z.enum(['In Progress', 'Finished', 'On Hold', 'Not Started']).optional(),
    start_date: z.date({
      required_error: "La fecha de inicio es obligatoria",
      invalid_type_error: "Debe ser una fecha válida",
    }),
    end_date: z.date({
      required_error: "La fecha de fin es obligatoria",
      invalid_type_error: "Debe ser una fecha válida",
    }),
    client_id: z.string({
      required_error: "El cliente es obligatorio",
      invalid_type_error: "Debe ser un texto válido",
    }),
    fte: z
      .number({
        required_error: "El FTE es obligatorio",
        invalid_type_error: "Debe ser un número",
      })
      .min(0.1, "Mínimo 0.1")
      .max(60, "Máximo 60"),
    contract_type: z.string({
      required_error: "El tipo de contrato es obligatorio",
    }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'In Progress',
      start_date: undefined,
      end_date: undefined,
      client_id: '',
      fte: undefined,
      contract_type: PROJECT_CONTRACT_TYPE_OPTIONS[0].value as ProjectContractType,
    },
  })

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

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    console.log('Form data submitted:', data);
    
    try {
      setIsSubmitting(true)
      await createProject({
        id: uuidv4(),
        name: data.name.trim(),
        description: data.description?.trim() || null,
        status: data.status as ProjectStatus,
        start_date: data.start_date?.toISOString().split('T')[0] || null,
        end_date: data.end_date?.toISOString().split('T')[0] || null,
        client_id: data.client_id || null,
        fte: data.fte,
        contract_type: data.contract_type,
      })
      toast.success('El proyecto se ha creado exitosamente.')
      router.push('/projects')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear el proyecto')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formFields = form.watch()
  const checkForWarnings = () => {
    const newWarnings: string[] = []
    if (!formFields.name.trim()) newWarnings.push('El nombre del proyecto es obligatorio')
    if (formFields.fte === null || isNaN(formFields.fte)) newWarnings.push('El FTE total es obligatorio')
    if (formFields.fte !== null && (formFields.fte <= 0 || formFields.fte > 60 || !Number.isInteger(formFields.fte))) newWarnings.push('El FTE debe ser menor a 60 (Equivalente a 5 años)')
    if (!formFields.start_date) newWarnings.push('La fecha de inicio es obligatoria')
    if (!formFields.end_date) newWarnings.push('La fecha de fin es obligatoria')
    if (formFields.start_date && formFields.end_date && formFields.start_date > formFields.end_date) newWarnings.push('La fecha de inicio debe ser anterior o igual a la fecha de fin')
    if (!formFields.client_id || formFields.client_id === 'no-client') newWarnings.push('El cliente es obligatorio')
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Proyecto *</Label>
                  <Input
                    id="name"
                    {...form.register('name')}
                    placeholder="Ej: E-commerce Platform"
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.name.message}
                    </p>
                  )}
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
                    value={form.watch("client_id") || undefined}
                    onValueChange={(value) => form.setValue("client_id", value)}
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
                   {form.formState.errors.client_id && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.client_id.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select
                    value={form.watch("status")}
                    onValueChange={(value) => form.setValue("status", value as ProjectStatus)}
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
                  {form.formState.errors.status && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.status.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Fecha de Inicio *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !form.watch('start_date') && 'text-muted-foreground'
                        )}
                        data-test="start-date-button"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.watch('start_date') ? (
                          format(form.watch('start_date') as Date, 'PPP', { locale: es })
                        ) : (
                          <span>Seleccionar fecha</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={form.watch("start_date") || undefined}
                        onSelect={(date) => {
                          if (date) {
                            form.setValue("start_date", date, { shouldValidate: true });
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {form.formState.errors.start_date && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.start_date.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Fecha de Fin *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                         className={cn(
                          'w-full justify-start text-left font-normal',
                          !form.watch('end_date') && 'text-muted-foreground'
                        )}
                        data-test="end-date-button"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.watch('end_date') ? (
                          format(form.watch('end_date') as Date, 'PPP', { locale: es })
                        ) : (
                          <span>Seleccionar fecha</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={form.watch("end_date") || undefined}
                        onSelect={(date) => {
                          if (date) {
                            form.setValue("end_date", date, { shouldValidate: true });
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {form.formState.errors.end_date && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.end_date.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fte">FTE Total *</Label>
                  <Input
                    id="fte"
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={form.watch("fte") ?? ""}
                   onChange={(e) => {
                      const floatValue = parseFloat(e.target.value);
                      form.setValue("fte", floatValue, { shouldValidate: true });
                    }}
                    placeholder="Ej: 4.5"
                    data-test="fte-input"
                  />
                  {form.formState.errors.fte ? (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.fte.message}
                    </p>
                  ):(
                    <p className="text-sm text-muted-foreground">
                      Número mayor a 0 y menor o igual a 60. Se permite un decimal (Ej: 4.5)
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contract_type">Tipo de contratación *</Label>
                  <Select
                    value={formData.contract_type}
                    onValueChange={value => setFormData({ ...formData, contract_type: value as ProjectContractType })}
                  >
                    <SelectTrigger data-test="contract-type-select">
                      <SelectValue placeholder="Seleccionar tipo de contratación" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECT_CONTRACT_TYPE_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.contract_type && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.contract_type.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={form.watch("description")}
                  onChange={e => form.setValue("description", e.target.value)}
                  placeholder="Describe el proyecto..."
                  rows={4}
                  data-test="description-textarea"
                />
                {form.formState.errors.description && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.description.message}
                  </p>
                )}
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
