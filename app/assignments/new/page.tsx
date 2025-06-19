'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, AlertTriangle, CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { OverallocationModal } from '@/components/overallocation-modal'

import { cn } from '@/utils/classnames'
import { toast } from 'sonner'

import { usePeople } from '@/hooks/use-people'
import { useProjects } from '@/hooks/use-projects'
import { useAssignments } from '@/hooks/use-assignments'
import { useAssignmentValidation } from '@/hooks/use-assignment-validation'

import { assignmentsService } from '@/lib/services/assignments.service'
import { toISODateString, debugDate, normalizeDate } from '@/lib/assignments'
import { toDbAllocation } from '@/lib/utils/fte-calculations'
import { ASSIGNMENT_ALLOCATION_VALUES as ALLOCATION_VALUES } from '@/constants/assignments'
import { AssignmentSummary } from '@/components/assignment-summary'
import { percentageToFte, fteToPercentage } from '@/lib/utils/fte-calculations'

import type { Person } from '@/types/people'
import type { Project } from '@/types/project'

export default function NewAssignmentPage() {
  const router = useRouter()
  const { people, loading: peopleLoading } = usePeople()
  const { projects, loading: projectsLoading } = useProjects()
  const { createAssignment } = useAssignments()
  const { validateAssignment, getOverallocationMessage, isValidating } = useAssignmentValidation()

  const [formData, setFormData] = useState({
    person_id: '',
    project_id: '',
    start_date: undefined as Date | undefined,
    end_date: undefined as Date | undefined,
    allocation: 100, // Default to 100%
    assigned_role: '',
    is_billable: true, // Default to true
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [warnings, setWarnings] = useState<string[]>([])
  const [showOverallocationModal, setShowOverallocationModal] = useState(false)
  const [overallocationData, setOverallocationData] = useState<any>(null)
  const [pendingFormData, setPendingFormData] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validar sobreasignación antes de crear
      const validationResult = await validateAssignment(
        null,
        formData.person_id,
        toISODateString(formData.start_date!),
        toISODateString(formData.end_date!),
        percentageToFte(formData.allocation)
      )

      if (validationResult.isOverallocated) {
        const selectedPerson = people.find(p => p.id === formData.person_id)
        const selectedProject = projects.find(p => p.id === formData.project_id)
        
        setOverallocationData({
          personName: `${selectedPerson?.first_name} ${selectedPerson?.last_name}`,
          projectName: selectedProject?.name || '',
          allocation: formData.allocation,
          overallocatedDates: validationResult.overallocatedDays || []
        })
        setPendingFormData(formData)
        setShowOverallocationModal(true)
        setIsSubmitting(false)
        return
      }

      const assignmentData = {
        person_id: formData.person_id,
        project_id: formData.project_id,
        start_date: toISODateString(formData.start_date!),
        end_date: toISODateString(formData.end_date!),
        allocation: percentageToFte(formData.allocation),
        assigned_role: formData.assigned_role,
        is_billable: formData.is_billable
      }

      await createAssignment(assignmentData)
      toast.success('Asignación creada exitosamente')
      router.push('/assignments')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear la asignación')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmOverallocation = async () => {
    if (!pendingFormData) return
    
    try {
      const assignmentData = {
        person_id: pendingFormData.person_id,
        project_id: pendingFormData.project_id,
        start_date: toISODateString(pendingFormData.start_date),
        end_date: toISODateString(pendingFormData.end_date),
        allocation: percentageToFte(pendingFormData.allocation),
        assigned_role: pendingFormData.assigned_role,
        is_billable: pendingFormData.is_billable
      }

      await createAssignment(assignmentData)
      setShowOverallocationModal(false)
      setOverallocationData(null)
      setPendingFormData(null)
      toast.success('Asignación creada exitosamente')
      router.push('/assignments')
    } catch (error) {
      console.error('Error al crear la asignación:', error)
      toast.error('Error al crear la asignación')
    }
  }

  const checkForConflicts = () => {
    const newWarnings: string[] = []

    if (formData.allocation > 100) {
      newWarnings.push('La dedicación no puede superar el 100%')
    }

    if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
      newWarnings.push('La fecha de inicio debe ser anterior a la fecha de fin')
    }

    if (!formData.person_id || !formData.project_id || !formData.start_date || !formData.end_date) {
      newWarnings.push('Todos los campos marcados con * son obligatorios')
    }

    setWarnings(newWarnings)
  }

  // Check for conflicts when form data changes
  useEffect(() => {
    checkForConflicts()
  }, [formData])

  const selectedPerson = people.find(p => p.id === formData.person_id)
  const selectedProject = projects.find(p => p.id === formData.project_id)

  // Show all people instead of filtering by status
  const activePeople = people.filter((p: Person) => p.status === 'Active' || p.status === 'Paused')
  const activeProjects = projects.filter((p: Project) => p.status === 'In Progress')

  const handleStartDateSelect = (date: Date | undefined) => {
    if (date) {
      const normalizedDate = normalizeDate(date)
      setFormData({ ...formData, start_date: normalizedDate })
    }
  }

  const handleEndDateSelect = (date: Date | undefined) => {
    if (date) {
      const normalizedDate = normalizeDate(date)
      setFormData({ ...formData, end_date: normalizedDate })
    }
  }

  if (peopleLoading || projectsLoading) {
    return (
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" size="icon" asChild>
              <Link href="/assignments">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Nueva Asignación</h1>
              <p className="text-muted-foreground">Cargando datos...</p>
            </div>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 container mx-auto px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" asChild>
            <Link href="/assignments">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Nueva Asignación</h1>
            <p className="text-muted-foreground">Asigna una persona a un proyecto</p>
          </div>
        </div>

        {/* Warnings */}
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
            <CardTitle>Detalles de la Asignación</CardTitle>
            <CardDescription>Completa la información de la asignación</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="person">Persona *</Label>
                  <Select
                    value={formData.person_id}
                    onValueChange={value => setFormData({ ...formData, person_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar persona" />
                    </SelectTrigger>
                    <SelectContent>
                      {activePeople.map(person => (
                        <SelectItem key={person.id} value={person.id}>
                          <div>
                            <div className="font-medium">{person.first_name} {person.last_name}</div>
                            <div className="text-sm text-muted-foreground">{person.profile}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project">Proyecto *</Label>
                  <Select
                    value={formData.project_id}
                    onValueChange={value => setFormData({ ...formData, project_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar proyecto" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeProjects.map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
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
                        onSelect={handleStartDateSelect}
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
                        onSelect={handleEndDateSelect}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Asignación</Label>
                <Select
                  value={formData.allocation.toString()}
                  onValueChange={val => setFormData({ ...formData, allocation: Number(val) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Asignación" />
                  </SelectTrigger>
                  <SelectContent>
                    {ALLOCATION_VALUES.map(value => (
                      <SelectItem key={value} value={(value * 100).toString()}>
                        {value * 100}%
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assigned_role">Rol Asignado</Label>
                <Input
                  id="assigned_role"
                  value={formData.assigned_role}
                  onChange={e => setFormData({ ...formData, assigned_role: e.target.value })}
                  placeholder="Ej: Frontend Developer"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_billable"
                    checked={formData.is_billable}
                    onChange={e => setFormData({ ...formData, is_billable: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="is_billable">Facturable</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Marca esta opción si la asignación es facturable al cliente
                </p>
              </div>

              {/* Summary */}
              {selectedPerson && selectedProject && formData.start_date && formData.end_date && (
                <AssignmentSummary
                  person={selectedPerson}
                  project={selectedProject}
                  startDate={formData.start_date}
                  endDate={formData.end_date}
                  allocation={formData.allocation}
                  assignedRole={formData.assigned_role}
                />
              )}

              <div className="flex gap-4 pt-6">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={warnings.length > 0 || isSubmitting}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Creando...' : 'Crear Asignación'}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/assignments">Cancelar</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Modal de sobreasignación */}
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
    </main>
  )
}
