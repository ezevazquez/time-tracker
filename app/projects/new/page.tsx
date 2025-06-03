"use client"

import React, { useState } from "react"
import { ArrowLeft, Save, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useProjects } from "@/hooks/use-data"
import { useToast } from "@/hooks/use-toast"

export default function NewProjectPage() {
  const router = useRouter()
  const { createProject } = useProjects()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "activo" as "activo" | "en pausa" | "cerrado",
    start_date: undefined as Date | undefined,
    end_date: undefined as Date | undefined,
    budget: "",
    client: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [warnings, setWarnings] = useState<string[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      setWarnings(["El nombre del proyecto es obligatorio"])
      return
    }

    if (!formData.start_date) {
      setWarnings(["La fecha de inicio es obligatoria"])
      return
    }

    try {
      setIsSubmitting(true)
      await createProject({
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        status: formData.status,
        start_date: formData.start_date.toISOString().split("T")[0],
        end_date: formData.end_date?.toISOString().split("T")[0] || null,
      })

      toast({
        title: "Proyecto creado",
        description: "El proyecto se ha creado exitosamente.",
      })

      router.push("/projects")
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear el proyecto",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const checkForWarnings = () => {
    const newWarnings: string[] = []

    if (!formData.name.trim()) {
      newWarnings.push("El nombre del proyecto es obligatorio")
    }

    if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
      newWarnings.push("La fecha de inicio debe ser anterior a la fecha de fin")
    }

    if (formData.budget && isNaN(Number.parseFloat(formData.budget))) {
      newWarnings.push("El presupuesto debe ser un número válido")
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
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: E-commerce Platform"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client">Cliente</Label>
                  <Input
                    id="client"
                    value={formData.client}
                    onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                    placeholder="Ej: Acme Corp"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "activo" | "en pausa" | "cerrado") =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="en pausa">En Pausa</SelectItem>
                      <SelectItem value="cerrado">Cerrado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget">Presupuesto</Label>
                  <Input
                    id="budget"
                    type="number"
                    step="0.01"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Fecha de Inicio</Label>
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
                  <Label>Fecha de Fin</Label>
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

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe el proyecto..."
                  rows={4}
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
                      {formData.client && (
                        <div>
                          <strong>Cliente:</strong> {formData.client}
                        </div>
                      )}
                      <div>
                        <strong>Estado:</strong> {formData.status}
                      </div>
                      {formData.budget && (
                        <div>
                          <strong>Presupuesto:</strong> €{formData.budget}
                        </div>
                      )}
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
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={!formData.name.trim() || warnings.length > 0 || isSubmitting}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? "Creando..." : "Crear Proyecto"}
                </Button>
                <Button type="button" variant="outline" asChild>
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
