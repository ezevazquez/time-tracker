'use client'

import { useState, useEffect, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { format } from 'date-fns'
import { CalendarIcon, Loader2, ArrowLeft, AlertTriangle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useProjects } from '@/hooks/use-projects'
import Link from 'next/link'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Alert, AlertDescription } from '@/components/ui/alert'

import { cn } from '@/utils/classnames'
import { projectsService } from '@/lib/services/projects.service'
import { clientsService } from '@/lib/services/clients.service'
import type { Project } from '@/types/project'
import type { Client } from '@/types/client'
import { PROJECT_STATUS_OPTIONS, PROJECT_STATUS, PROJECT_CONTRACT_TYPE_OPTIONS } from '@/constants/projects'
import { ResourceError } from '@/components/ui/resource-error'
import { ProjectAssignmentsPanel } from '@/components/project-assignments-panel'
import { useAssignments } from '@/hooks/use-assignments'
import { parseDateFromString } from '@/lib/assignments'


const formSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().nullable().optional(),
  start_date: z.date().nullable().optional(),
  end_date: z.date().nullable().optional(),
  status: z.enum(['In Progress', 'Finished', 'On Hold', 'Not Started']),
  client_id: z.string().nullable().optional(),
  fte: z
    .number({ invalid_type_error: 'El FTE debe ser un número' })
    .min(0.1, 'El FTE debe ser mayor a 0')
    .max(60, 'El FTE debe ser menor o igual a 60')
    .nullable()
    .optional(),
  project_code: z.string().nullable().optional(),
  contract_type: z.string().min(1, 'El tipo de contratación es requerido'),
})

type FormData = z.infer<typeof formSchema>

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params)
  const searchParams = useSearchParams()
  const from = searchParams.get('from')
  const backHref = from === 'show' ? `/projects/${unwrappedParams.id}/show` : '/projects'
  const [project, setProject] = useState<Project | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const { deleteProject } = useProjects()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const { toast } = useToast()
  const { assignments, createAssignment, updateAssignment, deleteAssignment } = useAssignments()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      start_date: undefined,
      end_date: undefined,
      status: 'Not Started',
      client_id: '',
      fte: undefined,
      project_code: '',
      contract_type: PROJECT_CONTRACT_TYPE_OPTIONS[0].value,
    },
  })

  // Fetch clients
  useEffect(() => {
    async function fetchClients() {
      try {
        setLoading(true)
        const clientsData = await clientsService.getAll()
        setClients(clientsData)
      } catch (err) {
        console.error('Error fetching clients:', err)
        // Don't set error here, as we can still edit the project without clients
      } finally {
        setLoading(false)
      }
    }

    fetchClients()
  }, [])

  // Fetch project data
  useEffect(() => {
    async function fetchProject() {
      try {
        setLoading(true)
        const projectData = await projectsService.getById(unwrappedParams.id)
        
        if (projectData) {
          setProject(projectData)
          // Set form values
          form.reset({
            name: projectData.name,
            description: projectData.description || '',
            start_date: projectData.start_date ? parseDateFromString(projectData.start_date) : null,
            end_date: projectData.end_date ? parseDateFromString(projectData.end_date || "") : null,
            status: projectData.status,
            client_id: projectData.client_id,
            fte: projectData.fte,
            project_code: projectData.project_code || '',
            contract_type: projectData.contract_type || PROJECT_CONTRACT_TYPE_OPTIONS[0].value,
          })
        } else {
          console.error('Proyecto no encontrado')
        }
      } catch (err) {
        console.error('Error fetching project:', err)
        console.error(err instanceof Error ? err.message : 'Error al cargar el proyecto')
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [unwrappedParams.id, form])

  async function onSubmit(values: FormData) {
    try {
      setSaving(true)
      
      const updateData = {
        ...values,
        start_date: values.start_date ? values.start_date.toISOString() : null,
        end_date: values.end_date ? values.end_date.toISOString() : null,
      }
      
      await projectsService.update(unwrappedParams.id, updateData)
      toast({ title: 'Proyecto actualizado', description: 'El proyecto fue actualizado correctamente.' })
      router.back()
    } catch (error) {
      console.error('Error updating project:', error)
      toast({ title: 'Error al actualizar', description: 'Error al actualizar el proyecto.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // Función para borrar el proyecto
  const handleDelete = () => {
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!project) return
    try {
      await deleteProject(project.id)
      toast({ title: 'Proyecto eliminado', description: 'El proyecto fue eliminado correctamente.' })
      router.push('/projects')
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error al eliminar el proyecto'
      toast({ title: 'Error al eliminar', description: errorMsg, variant: 'destructive' })
      console.error('Error deleting project:', error)
    } finally {
      setShowDeleteModal(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando datos del proyecto...</p>
        </div>
      </div>
    )
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
          <h1 className="text-3xl font-bold" data-title="edit-project-title">Editar Proyecto</h1>
        </div>
        <p className="text-muted-foreground">Actualiza los datos del proyecto</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Columna izquierda: Formulario */}
        <div className="w-full md:w-1/2">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle data-test="project-info-title">Datos del Proyecto</CardTitle>
              <CardDescription>Completa los campos para actualizar el proyecto</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del Proyecto</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre del proyecto" {...field} data-test="project-name-input"/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="project_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código del Proyecto</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || 'No asignado'}
                            disabled
                            className="bg-gray-50 text-gray-500"
                            data-test="project-code-input"
                          />
                        </FormControl>
                        <p className="text-sm text-muted-foreground">
                          Código único generado automáticamente (no editable)
                        </p>
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
                            placeholder="Descripción del proyecto"
                            {...field}
                            value={field.value || ''}
                            data-test="project-description-textarea"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="start_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Fecha de Inicio</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={'outline'}
                                  className={cn(
                                    'pl-3 text-left font-normal',
                                    !field.value && 'text-muted-foreground'
                                  )}
                                  data-test="start-date-button"
                                >
                                  {field.value
                                    ? format(field.value, 'dd/MM/yyyy')
                                    : 'Seleccionar fecha'}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value || undefined}
                                onSelect={field.onChange}
                                disabled={date => date < new Date('1900-01-01')}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="end_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Fecha de Fin (opcional)</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={'outline'}
                                  className={cn(
                                    'pl-3 text-left font-normal',
                                    !field.value && 'text-muted-foreground'
                                  )}
                                  data-test="end-date-button"
                                >
                                  {field.value ? format(field.value, 'dd/MM/yyyy') : 'Sin fecha de fin'}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value || undefined}
                                onSelect={field.onChange}
                                disabled={date => {
                                  const startDate = form.getValues('start_date')
                                  return startDate ? date < startDate : false
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-test="project-status-select">
                                <SelectValue placeholder="Selecciona un estado" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {PROJECT_STATUS_OPTIONS.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="client_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cliente</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value || 'null'}
                            value={field.value || 'null'}
                            data-test="project-client-select"
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona un cliente" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="null">Sin cliente</SelectItem>
                              {clients.map(client => (
                                <SelectItem key={client.id} value={client.id}>
                                  {client.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="fte"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>FTE Total</FormLabel>
                        <FormControl>
                          <Input
                            id="fte"
                            type="number"
                            step="0.1"
                            min="0.1"
                            value={form.watch("fte") ?? ""}
                            onChange={(e) => {
                              const floatValue = isNaN(parseFloat(e.target.value)) ? null : parseFloat(e.target.value);
                              form.setValue("fte", floatValue, { shouldValidate: true });
                              
                            }}
                            placeholder="Ej: 4.5"
                            data-test="fte-input"
                          />
                        </FormControl>
                        <p className="text-sm text-muted-foreground">
                          Número mayor a 0 y menor o igual a 60. Se permite un decimal (Ej: 4.5)
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contract_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de contratación</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
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
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <CardFooter className="flex justify-end gap-2">
                    <Button type="submit" disabled={saving || !form.formState.isValid} data-test="save-changes-button">Guardar Cambios</Button>
                  </CardFooter>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        {/* Columna derecha: Asignaciones */}
        <div className="w-full md:w-1/2">
          {project && (
            <ProjectAssignmentsPanel
              project={project}
              assignments={assignments}
              onCreate={createAssignment}
              onUpdate={updateAssignment}
              onDelete={deleteAssignment}
              showAddButton={true}
            />
          )}
        </div>
      </div>

      {/* Modal de confirmación */}
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow-lg">
            <h2 className="text-lg font-bold mb-4" data-test="confirm-delete-title">Confirmar eliminación</h2>
            <p>¿Estás seguro de que deseas eliminar este proyecto?</p>
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
