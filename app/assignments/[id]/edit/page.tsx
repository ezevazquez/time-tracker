'use client'

import { useState, useEffect, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { CalendarIcon, ArrowLeft, Users, Briefcase } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

import { usePeople } from '@/hooks/use-people'
import { useProjects } from '@/hooks/use-projects'
import { useAssignments } from '@/hooks/use-assignments'
import { useAssignmentValidation } from '@/hooks/use-assignment-validation'

import type { Assignment } from '@/types/assignment'
import type { Person } from '@/types/people'
import type { Project } from '@/types/project'

import { assignmentsService } from '@/lib/services/assignments.service'
import { toISODateString, normalizeDate, parseDateFromString } from '@/lib/assignments'
import { toDbAllocation, fromDbAllocation, percentageToFte, fteToPercentage } from '@/lib/utils/fte-calculations'
import { ASSIGNMENT_ALLOCATION_VALUES } from '@/constants/assignments'
import { OverallocationModal } from '@/components/overallocation-modal'
import { toast } from 'sonner'

const formSchema = z
  .object({
    person_id: z.string({ required_error: 'La persona es requerida' }),
    project_id: z.string({ required_error: 'El proyecto es requerido' }),
    start_date: z.date({ required_error: 'La fecha de inicio es requerida' }),
    end_date: z.date({ required_error: 'La fecha de fin es requerida' }),
    allocation: z.number().refine(val => [25, 50, 75, 100].includes(val), {
      message: 'La asignación debe ser 25%, 50%, 75% o 100%',
    }),
    is_billable: z.boolean(),
  })
  .refine(data => data.end_date >= data.start_date, {
    message: 'La fecha de fin debe ser posterior a la fecha de inicio',
    path: ['end_date'],
  })

export default function EditAssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [showOverallocationModal, setShowOverallocationModal] = useState(false)
  const [overallocationData, setOverallocationData] = useState<any>(null)
  const [pendingFormData, setPendingFormData] = useState<any>(null)
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showResetButton, setShowResetButton] = useState(false)
  const { id } = use(params)

  const { people } = usePeople()
  const { projects } = useProjects()
  const { assignments, updateAssignment, deleteAssignment } = useAssignments()
  const { validateAssignment, getOverallocationMessage } = useAssignmentValidation()

  // Function to build return URL with current view mode
  const getReturnUrl = () => {
    const currentViewMode = searchParams.get('view')
    return currentViewMode ? `/assignments?view=${currentViewMode}` : '/assignments'
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      allocation: 100,
    },
  })

  // Load assignment data
  useEffect(() => {
    const loadAssignment = async () => {
      try {
        setIsLoadingData(true)
        const foundAssignment = assignments.find((a: Assignment) => a.id === id)

        if (!foundAssignment) {
          setError('Asignación no encontrada')
          return
        }

        setAssignment(foundAssignment)

        // Set form values
        form.reset({
          person_id: foundAssignment.person_id,
          project_id: foundAssignment.project_id,
          start_date: parseDateFromString(foundAssignment.start_date),
          end_date: parseDateFromString(foundAssignment.end_date),
          allocation: fromDbAllocation(foundAssignment.allocation),
          is_billable: foundAssignment.is_billable ?? true,
        })
      } catch (err) {
        console.error('Error loading assignment:', err)
        setError('Error al cargar la asignación')
      } finally {
        setIsLoadingData(false)
      }
    }

    if (assignments.length > 0) {
      loadAssignment()
    }
  }, [id, assignments, form])

  // Timer para mostrar botón de reset si isLoading se cuelga
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isLoading) {
      timer = setTimeout(() => {
        setShowResetButton(true)
      }, 5000) // 5 segundos
    } else {
      setShowResetButton(false)
    }
    return () => clearTimeout(timer)
  }, [isLoading])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!assignment) return

    // Validar sobreasignación antes de actualizar usando FTE
    const validationResult = await validateAssignment(
      id,
      values.person_id,
      toISODateString(values.start_date),
      toISODateString(values.end_date),
      toDbAllocation(values.allocation)
    )

    if (validationResult.isOverallocated) {
      const selectedPerson = people.find(p => p.id === values.person_id)
      const selectedProject = projects.find(p => p.id === values.project_id)
      
      setOverallocationData({
        personName: `${selectedPerson?.first_name} ${selectedPerson?.last_name}`,
        projectName: selectedProject?.name || '',
        allocation: fromDbAllocation(toDbAllocation(values.allocation)),
        overallocatedDates: validationResult.overallocatedDays || []
      })
      setPendingFormData(values)
      setShowOverallocationModal(true)
      return
    }

    // Si no hay sobreasignación, actualizar directamente
    setIsLoading(true)
    setError(null)

    try {
      const updatedAssignment = {
        person_id: values.person_id,
        project_id: values.project_id,
        start_date: toISODateString(values.start_date),
        end_date: toISODateString(values.end_date),
        allocation: toDbAllocation(values.allocation),
        is_billable: values.is_billable,
        updated_at: new Date().toISOString(),
      }

      await updateAssignment(id, updatedAssignment)
      router.push(getReturnUrl())
    } catch (err) {
      console.error('Error updating assignment:', err)
      toast.error('No se pudo actualizar la asignación')
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmOverallocation = async () => {
    if (!pendingFormData) return
    
    setIsLoading(true)
    
    try {
      const updatedAssignment = {
        person_id: pendingFormData.person_id,
        project_id: pendingFormData.project_id,
        start_date: toISODateString(pendingFormData.start_date),
        end_date: toISODateString(pendingFormData.end_date),
        allocation: toDbAllocation(pendingFormData.allocation),
        is_billable: pendingFormData.is_billable,
      }

      await updateAssignment(id, updatedAssignment)
      setShowOverallocationModal(false)
      setOverallocationData(null)
      setPendingFormData(null)
      router.push(getReturnUrl())
    } catch (err) {
      console.error('Error updating assignment:', err)
      toast.error('No se pudo actualizar la asignación')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartDateSelect = (date: Date | undefined) => {
    if (date) {
      const normalizedDate = normalizeDate(date)
      form.setValue('start_date', normalizedDate)
    }
  }

  const handleEndDateSelect = (date: Date | undefined) => {
    if (date) {
      const normalizedDate = normalizeDate(date)
      form.setValue('end_date', normalizedDate)
    }
  }

  const handleDeleteAssignment = async () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta asignación? Esta acción no se puede deshacer.')) {
      try {
        setIsLoading(true)
        await deleteAssignment(id)
        toast.success('Asignación eliminada correctamente')
        router.push(getReturnUrl())
      } catch (error) {
        console.error('Error deleting assignment:', error)
        toast.error('Error al eliminar la asignación')
      } finally {
        setIsLoading(false)
      }
    }
  }

  if (isLoadingData) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error && !assignment) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button variant="outline" onClick={() => router.push('/assignments')} className="mt-4" data-test="back-assigment-list-button">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Asignaciones
          </Button>
        </div>
      </div>
    )
  }

  const activePeople = people.filter((p: Person) => p.status === 'Active' || p.status === 'Paused')
  const activeProjects = projects.filter((p: Project) => p.status === 'In Progress')

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(getReturnUrl())}
            className="mr-4"
            data-test="back-assignment-list-button"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold" data-test="edit-assigment-list">Editar Asignación</h1>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle data-test="assigment-info-title">Información de la Asignación</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="person_id">Persona</Label>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-900">
                        {activePeople.find(p => p.id === form.watch('person_id'))?.first_name} {activePeople.find(p => p.id === form.watch('person_id'))?.last_name}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {activePeople.find(p => p.id === form.watch('person_id'))?.profile}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    La persona no se puede cambiar en una asignación existente
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project_id">Proyecto</Label>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-900">
                        {activeProjects.find(p => p.id === form.watch('project_id'))?.name}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Estado: {activeProjects.find(p => p.id === form.watch('project_id'))?.status}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    El proyecto no se puede cambiar en una asignación existente
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                          format(form.watch('start_date'), 'dd/MM/yyyy')
                        ) : (
                          <span>Seleccionar fecha</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={form.watch('start_date')}
                        onSelect={handleStartDateSelect}
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
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.watch('end_date') ? (
                          format(form.watch('end_date'), 'dd/MM/yyyy')
                        ) : (
                          <span>Seleccionar fecha</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={form.watch('end_date')}
                        onSelect={handleEndDateSelect}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {form.formState.errors.end_date && (
                    <p className="text-sm text-red-500">{form.formState.errors.end_date.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Asignación</Label>
                <Select
                  value={form.watch('allocation')?.toString()}
                  onValueChange={value => form.setValue('allocation', parseInt(value))}
                >
                  <SelectTrigger data-test="allocation-select">
                    <SelectValue placeholder="Seleccionar asignación" />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSIGNMENT_ALLOCATION_VALUES.map(val => (
                      <SelectItem key={val} value={String(fteToPercentage(val))}>
                        {fteToPercentage(val)}%
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {form.formState.errors.allocation && (
                  <p className="text-sm text-red-500">{form.formState.errors.allocation.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_billable"
                    {...form.register('is_billable')}
                    className="rounded border-gray-300"
                    data-test="is-billable-checkbox"
                  />
                  <Label htmlFor="is_billable">Facturable</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Marca esta opción si la asignación es facturable al cliente
                </p>
              </div>

              <div className="flex gap-4 pt-6">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isLoading}
                  data-test="update-assignment-button"
                >
                  {isLoading ? 'Actualizando...' : 'Actualizar Asignación'}
                </Button>
                <Button type="button" variant="outline" asChild data-test="cancel-edit-assignment-button">
                  <Link href={getReturnUrl()}>Cancelar</Link>
                </Button>
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={handleDeleteAssignment}
                  disabled={isLoading}
                  data-test="delete-assignment-button"
                >
                  Eliminar
                </Button>
              </div>
              
              {showResetButton && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-800 mb-2">
                    ⚠️ El botón parece estar colgado. Si no responde:
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setIsLoading(false)
                      setShowResetButton(false)
                    }}
                    className="text-orange-700 border-orange-300 hover:bg-orange-100"
                    data-test="reset-loading-button"
                  >
                    Resetear estado
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
      {overallocationData && (
        <OverallocationModal
          isOpen={showOverallocationModal}
          onClose={() => {
            setShowOverallocationModal(false)
            setOverallocationData(null)
            setPendingFormData(null)
          }}
          onConfirm={handleConfirmOverallocation}
          personName={overallocationData.personName}
          projectName={overallocationData.projectName}
          allocation={overallocationData.allocation}
          overallocatedDates={overallocationData.overallocatedDates}
        />
      )}
    </div>
  )
}
