"use client"

import React, { useState } from "react"
import { ArrowLeft, Save, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { usePeople, useProjects, useAssignments } from "@/hooks/use-data"
import { useToast } from "@/hooks/use-toast"

export default function NewAssignmentPage() {
  const router = useRouter()
  const { people, loading: peopleLoading } = usePeople()
  const { projects, loading: projectsLoading } = useProjects()
  const { createAssignment } = useAssignments()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    person_id: "",
    project_id: "",
    start_date: undefined as Date | undefined,
    end_date: undefined as Date | undefined,
    allocation: [80], // Using array for Slider component
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [warnings, setWarnings] = useState<string[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.person_id || !formData.project_id || !formData.start_date || !formData.end_date) {
      setWarnings(["Todos los campos marcados con * son obligatorios"])
      return
    }

    try {
      setIsSubmitting(true)
      await createAssignment({
        person_id: formData.person_id,
        project_id: formData.project_id,
        start_date: formData.start_date.toISOString().split("T")[0],
        end_date: formData.end_date.toISOString().split("T")[0],
        allocation: formData.allocation[0] / 100,
      })

      toast({
        title: "Asignación creada",
        description: "La asignación se ha creado exitosamente.",
      })

      router.push("/assignments")
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear la asignación",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const checkForConflicts = () => {
    const newWarnings: string[] = []

    if (formData.allocation[0] > 100) {
      newWarnings.push("La dedicación no puede superar el 100%")
    }

    if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
      newWarnings.push("La fecha de inicio debe ser anterior a la fecha de fin")
    }

    if (!formData.person_id || !formData.project_id || !formData.start_date || !formData.end_date) {
      newWarnings.push("Todos los campos marcados con * son obligatorios")
    }

    setWarnings(newWarnings)
  }

  // Check for conflicts when form data changes
  React.useEffect(() => {
    checkForConflicts()
  }, [formData])

  const selectedPerson = people.find((p) => p.id === formData.person_id)
  const selectedProject = projects.find((p) => p.id === formData.project_id)

  // Filter active people and projects
  const activePeople = people.filter((p) => p.status === "activo")
  const activeProjects = projects.filter((p) => p.status === "activo")

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
                    onValueChange={(value) => setFormData({ ...formData, person_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar persona" />
                    </SelectTrigger>
                    <SelectContent>
                      {activePeople.map((person) => (
                        <SelectItem key={person.id} value={person.id}>
                          <div>
                            <div className="font-medium">{person.name}</div>
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
                    onValueChange={(value) => setFormData({ ...formData, project_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar proyecto" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeProjects.map((project) => (
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
                          "w-full justify-start text-left font-normal",
                          !formData.start_date && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.start_date ? (
                          format(formData.start_date, "PPP", { locale: es })
                        ) : (
                          <span>Seleccionar fecha</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.start_date}
                        onSelect={(date) => setFormData({ ...formData, start_date: date })}
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
                          "w-full justify-start text-left font-normal",
                          !formData.end_date && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.end_date ? (
                          format(formData.end_date, "PPP", { locale: es })
                        ) : (
                          <span>Seleccionar fecha</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.end_date}
                        onSelect={(date) => setFormData({ ...formData, end_date: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Dedicación: {formData.allocation[0]}%</Label>
                  <Slider
                    value={formData.allocation}
                    onValueChange={(value) => setFormData({ ...formData, allocation: value })}
                    max={100}
                    min={10}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>10%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>

              {/* Summary */}
              {selectedPerson && selectedProject && (
                <Card className="bg-muted/50">
                  <CardContent className="pt-6">
                    <h3 className="font-medium mb-2">Resumen de la Asignación</h3>
                    <div className="space-y-1 text-sm">
                      <div>
                        <strong>Persona:</strong> {selectedPerson.name} ({selectedPerson.profile})
                      </div>
                      <div>
                        <strong>Proyecto:</strong> {selectedProject.name}
                      </div>
                      <div>
                        <strong>Dedicación:</strong> {formData.allocation[0]}%
                      </div>
                      {formData.start_date && formData.end_date && (
                        <div>
                          <strong>Período:</strong> {format(formData.start_date, "dd/MM/yyyy")} -{" "}
                          {format(formData.end_date, "dd/MM/yyyy")}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-4 pt-6">
                <Button type="submit" className="flex-1" disabled={warnings.length > 0 || isSubmitting}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? "Creando..." : "Crear Asignación"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/assignments">Cancelar</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
