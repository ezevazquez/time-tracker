'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, AlertTriangle, CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

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
import { useToast } from '@/hooks/use-toast'

import { usePeople } from '@/hooks/use-people'
import { useProjects } from '@/hooks/use-projects'
import { useAssignments } from '@/hooks/use-assignments'
import { useAssignmentValidation } from '@/hooks/use-assignment-validation'

import { assignmentsService } from '@/lib/services/assignments.service'
import { toDbAllocation, percentageToFte, toISODateString, debugDate, normalizeDate } from '@/lib/assignments'
import { ASSIGNMENT_ALLOCATION_VALUES as ALLOCATION_VALUES } from '@/constants/assignments'
import { AssignmentSummary } from '@/components/assignment-summary'

import type { Person } from '@/types/people'
import type { Project } from '@/types/project'

export default function NewAssignmentPage() {
  const router = useRouter()
  const { people, loading: peopleLoading } = usePeople()
  const { projects, loading: projectsLoading } = useProjects()
  const { createAssignment } = useAssignments()
  const { validateAssignment, getOverallocationMessage, isValidating } = useAssignmentValidation()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    person_id: '',
    project_id: '',
    start_date: undefined as Date | undefined,
    end_date: undefined as Date | undefined,
    allocation: 100, // Default to 100%
    assigned_role: '',
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
      // Usar el estado formData en lugar de FormData
      const assignmentData = {
        person_id: formData.person_id,
        project_id: formData.project_id,
        start_date: formData.start_date,
        end_date: formData.end_date,
        allocation: formData.allocation,
        assigned_role: formData.assigned_role,
        is_billable: true
      }

      // Validar que todos los campos requeridos estén completos
      if (!assignmentData.person_id || !assignmentData.project_id || !assignmentData.start_date || !assignmentData.end_date) {
        alert('Todos los campos marcados con * son obligatorios')
        setIsSubmitting(false)
        return
      }

      // Validar sobreasignación antes de crear usando FTE
      const validationResult = await validateAssignment(
        null, // new assignment
        assignmentData.person_id,
        assignmentData.start_date,
        assignmentData.end_date,
        percentageToFte(assignmentData.allocation) // convert to FTE
      )

      // Si hay sobreasignación, mostrar modal
      if (validationResult.isOverallocated) {
        const selectedPerson = people.find(p => p.id === assignmentData.person_id)
        const selectedProject = projects.find(p => p.id === assignmentData.project_id)
        
        setOverallocationData({
          personName: `${selectedPerson?.first_name} ${selectedPerson?.last_name}`,
          projectName: selectedProject?.name || '',
          allocation: assignmentData.allocation,
          overallocatedDates: validationResult.overallocatedDates
        })
        setPendingFormData(assignmentData)
        setShowOverallocationModal(true)
        setIsSubmitting(false)
        return
      }

      // Si no hay sobreasignación, crear directamente
      console.log('🚀 Creando asignación con fechas:')
      debugDate(assignmentData.start_date, 'Start Date')
      debugDate(assignmentData.end_date, 'End Date')
      
      await createAssignment({
        ...assignmentData,
        start_date: toISODateString(assignmentData.start_date),
        end_date: toISODateString(assignmentData.end_date),
        allocation: toDbAllocation(assignmentData.allocation)
      })
      router.push('/assignments')
    } catch (error) {
      console.error('Error al crear la asignación:', error)
      alert('Error al crear la asignación')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmOverallocation = async () => {
    if (!pendingFormData) return
    
    try {
      await createAssignment({
        ...pendingFormData,
        start_date: toISODateString(pendingFormData.start_date),
        end_date: toISODateString(pendingFormData.end_date),
        allocation: toDbAllocation(pendingFormData.allocation)
      })
      setShowOverallocationModal(false)
      setOverallocationData(null)
      setPendingFormData(null)
      router.push('/assignments')
    } catch (error) {
      console.error('Error al crear la asignación:', error)
      alert('Error al crear la asignación')
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

  // Debug logging
  console.log('All people:', people)
  console.log('People count:', people.length)
  console.log('People statuses:', people.map(p => ({ name: `${p.first_name} ${p.last_name}`, status: p.status })))

  // Show all people instead of filtering by status
  const activePeople = people.filter((p: Person) => p.status === 'Active' || p.status === 'Paused')
  const activeProjects = projects.filter((p: Project) => p.status === 'In Progress')

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
                        onSelect={date => {
                          if (date) {
                            const normalizedDate = normalizeDate(date)
                            console.log('📅 Start date selected:', { original: date, normalized: normalizedDate })
                            setFormData({ ...formData, start_date: normalizedDate })
                          }
                        }}
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
                        onSelect={date => {
                          if (date) {
                            const normalizedDate = normalizeDate(date)
                            console.log('📅 End date selected:', { original: date, normalized: normalizedDate })
                            setFormData({ ...formData, end_date: normalizedDate })
                          }
                        }}
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
