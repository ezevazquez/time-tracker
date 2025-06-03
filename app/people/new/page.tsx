"use client"

import type React from "react"
import { useState } from "react"
import { ArrowLeft, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { usePeople } from "@/hooks/use-data"
import { toast } from "sonner"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function NewPersonPage() {
  const router = useRouter()
  const { createPerson } = usePeople()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    profile: "",
    start_date: undefined as Date | undefined,
    end_date: undefined as Date | undefined,
    status: "Active" as "Active" | "Paused" | "Terminated",
    type: "Internal" as "Internal" | "External",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.start_date) {
      toast.error("La fecha de inicio es requerida")
      return
    }

    setLoading(true)

    try {
      await createPerson({
        name: formData.name,
        profile: formData.profile,
        start_date: formData.start_date.toISOString().split("T")[0],
        end_date: formData.end_date ? formData.end_date.toISOString().split("T")[0] : null,
        status: formData.status,
        type: formData.type,
      })

      toast.success("Persona creada correctamente")
      router.push("/people")
    } catch (error) {
      toast.error("Error al crear la persona")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex-1 container mx-auto px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" asChild>
            <Link href="/people">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Agregar Persona</h1>
            <p className="text-muted-foreground">Registra un nuevo colaborador en el sistema</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Información de la Persona</CardTitle>
            <CardDescription>Completa los datos del colaborador</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre Completo *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Ana García"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile">Perfil/Rol *</Label>
                  <Input
                    id="profile"
                    value={formData.profile}
                    onChange={(e) => setFormData({ ...formData, profile: e.target.value })}
                    placeholder="Ej: Frontend Developer"
                    required
                  />
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

                <div className="space-y-2">
                  <Label htmlFor="status">Estado *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "Active" | "Paused" | "Terminated") =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Activo</SelectItem>
                      <SelectItem value="Paused">Pausado</SelectItem>
                      <SelectItem value="Terminated">Fuera</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Tipo *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: "Internal" | "External") => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Internal">Interno</SelectItem>
                      <SelectItem value="External">Externo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <Button type="submit" className="flex-1" disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? "Guardando..." : "Guardar Persona"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/people">Cancelar</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
