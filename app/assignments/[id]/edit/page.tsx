"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { CalendarIcon, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { usePeople, useProjects, useAssignments } from "@/hooks/use-data"
import type { Assignment, Person, Project } from "@/lib/supabase"

const formSchema = z
  .object({
    person_id: z.string({ required_error: "La persona es requerida" }),
    project_id: z.string({ required_error: "El proyecto es requerido" }),
    start_date: z.date({ required_error: "La fecha de inicio es requerida" }),
    end_date: z.date({ required_error: "La fecha de fin es requerida" }),
    allocation: z.number().min(1).max(100),
    assigned_role: z.string().optional(),
  })
  .refine((data) => data.end_date >= data.start_date, {
    message: "La fecha de fin debe ser posterior a la fecha de inicio",
    path: ["end_date"],
  })

export default function EditAssignmentPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { people } = usePeople()
  const { projects } = useProjects()
  const { assignments, updateAssignment } = useAssignments()

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
        const foundAssignment = assignments.find((a: Assignment) => a.id === params.id)

        if (!foundAssignment) {
          setError("Asignación no encontrada")
          return
        }

        setAssignment(foundAssignment)

        // Set form values
        form.reset({
          person_id: foundAssignment.person_id,
          project_id: foundAssignment.project_id,
          start_date: new Date(foundAssignment.start_date),
          end_date: new Date(foundAssignment.end_date),
          allocation: foundAssignment.allocation,
          assigned_role: foundAssignment.assigned_role || "",
        })
      } catch (err) {
        console.error("Error loading assignment:", err)
        setError("Error al cargar la asignación")
      } finally {
        setIsLoadingData(false)
      }
    }

    if (assignments.length > 0) {
      loadAssignment()
    }
  }, [params.id, assignments, form])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!assignment) return

    try {
      setIsLoading(true)
      setError(null)

      const updatedAssignment = {
        ...assignment,
        person_id: values.person_id,
        project_id: values.project_id,
        start_date: values.start_date.toISOString().split("T")[0],
        end_date: values.end_date.toISOString().split("T")[0],
        allocation: values.allocation,
        assigned_role: values.assigned_role || null,
        updated_at: new Date().toISOString(),
      }

      await updateAssignment(assignment.id, updatedAssignment)
      router.push("/assignments")
    } catch (err) {
      console.error("Error updating assignment:", err)
      setError("Error al actualizar la asignación")
    } finally {
      setIsLoading(false)
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
          <Button variant="outline" onClick={() => router.push("/assignments")} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Asignaciones
          </Button>
        </div>
      </div>
    )
  }

  const activePeople = people.filter((p: Person) => p.status === "Active" || p.status === "Paused")
  const activeProjects = projects.filter((p: Project) => p.status === "In Progress")

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-6">
          <Button variant="outline" size="sm" onClick={() => router.push("/assignments")} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold">Editar Asignación</h1>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Información de la Asignación</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="person_id">Persona *</Label>
                  <Select value={form.watch("person_id")} onValueChange={(value) => form.setValue("person_id", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar persona" />
                    </SelectTrigger>
                    <SelectContent>
                      {activePeople.map((person: Person) => (
                        <SelectItem key={person.id} value={person.id}>
                          {person.name} - {person.profile}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.person_id && (
                    <p className="text-sm text-red-500">{form.formState.errors.person_id.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project_id">Proyecto *</Label>
                  <Select
                    value={form.watch("project_id")}
                    onValueChange={(value) => form.setValue("project_id", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar proyecto" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeProjects.map((project: Project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.project_id && (
                    <p className="text-sm text-red-500">{form.formState.errors.project_id.message}</p>
                  )}
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
                          "w-full justify-start text-left font-normal",
                          !form.watch("start_date") && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.watch("start_date") ? (
                          format(form.watch("start_date"), "dd/MM/yyyy")
                        ) : (
                          <span>Seleccionar fecha</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={form.watch("start_date")}
                        onSelect={(date) => date && form.setValue("start_date", date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {form.formState.errors.start_date && (
                    <p className="text-sm text-red-500">{form.formState.errors.start_date.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Fecha de Fin *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !form.watch("end_date") && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.watch("end_date") ? (
                          format(form.watch("end_date"), "dd/MM/yyyy")
                        ) : (
                          <span>Seleccionar fecha</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={form.watch("end_date")}
                        onSelect={(date) => date && form.setValue("end_date", date)}
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
                <Label>Asignación: {form.watch("allocation")}%</Label>
                <Slider
                  value={[form.watch("allocation")]}
                  onValueChange={(value) => form.setValue("allocation", value[0])}
                  max={100}
                  min={1}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>1%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
                {form.formState.errors.allocation && (
                  <p className="text-sm text-red-500">{form.formState.errors.allocation.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="assigned_role">Rol Asignado</Label>
                <Input
                  id="assigned_role"
                  placeholder="ej. Desarrollador Frontend, Project Manager"
                  {...form.register("assigned_role")}
                />
                {form.formState.errors.assigned_role && (
                  <p className="text-sm text-red-500">{form.formState.errors.assigned_role.message}</p>
                )}
              </div>

              <div className="flex justify-end space-x-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/assignments")}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Actualizando..." : "Actualizar Asignación"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
