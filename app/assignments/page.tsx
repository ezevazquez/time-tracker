"use client"

import { useState, useEffect, useMemo } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Filter, Plus, Edit, Trash2, AlertTriangle } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { DatePickerWithRange } from "@/components/date-range-picker"
import { usePeople, useProjects, useAssignments } from "@/hooks/use-data"
import { ReportModal } from "@/components/report-modal"

const defaultDateRange = {
  from: new Date(),
  to: (() => {
    const to = new Date()
    to.setFullYear(to.getFullYear() + 1)
    return to
  })(),
}

export default function AssignmentsPage() {
  const [mounted, setMounted] = useState(false)
  const [filters, setFilters] = useState({
    person: "",
    project: "",
    dateRange: defaultDateRange,
    overallocatedOnly: false,
  })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const { people, loading: peopleLoading } = usePeople()
  const { projects, loading: projectsLoading } = useProjects()
  const { assignments, loading: assignmentsLoading, deleteAssignment } = useAssignments()

  const loading = peopleLoading || projectsLoading || assignmentsLoading

  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      if (filters.person && assignment.person_id !== filters.person) return false
      if (filters.project && assignment.project_id !== filters.project) return false

      const start = new Date(assignment.start_date)
      const end = new Date(assignment.end_date)
      if (end < filters.dateRange.from || start > filters.dateRange.to) return false

      if (filters.overallocatedOnly && assignment.allocation <= 100) return false

      return true
    })
  }, [assignments, filters])

  const handleDeleteAssignment = async (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta asignación?")) {
      try {
        await deleteAssignment(id)
      } catch (error) {
        console.error("Error deleting assignment:", error)
        alert("Error al eliminar la asignación")
      }
    }
  }

  const clearFilters = () => {
    setFilters({
      person: "",
      project: "",
      dateRange: defaultDateRange,
      overallocatedOnly: false,
    })
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Inicializando aplicación...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando asignaciones...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="flex-1 container mx-auto px-4 py-6">
      {/* Header + filtros como dropdown */}
      <div className="relative mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Asignaciones</h1>
          <div className="flex gap-2">
            <ReportModal />
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="mr-2 h-4 w-4" />
              {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
            </Button>
            <Link href="/assignments/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nueva asignación
              </Button>
            </Link>
          </div>
        </div>

        {/* Dropdown Filters Panel */}
        {showFilters && (
          <div className="absolute z-50 mt-2 w-full">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Filtros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Persona</Label>
                    <Select
                      value={filters.person}
                      onValueChange={(value) => setFilters((prev) => ({ ...prev, person: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todas las personas" />
                      </SelectTrigger>
                      <SelectContent>
                        {people.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Proyecto</Label>
                    <Select
                      value={filters.project}
                      onValueChange={(value) => setFilters((prev) => ({ ...prev, project: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos los proyectos" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Rango de Fechas</Label>
                    <DatePickerWithRange
                      date={filters.dateRange}
                      setDate={(dateRange) => setFilters((prev) => ({ ...prev, dateRange }))}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Filtros Especiales</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="overallocated"
                        checked={filters.overallocatedOnly}
                        onCheckedChange={(checked) =>
                          setFilters((prev) => ({
                            ...prev,
                            overallocatedOnly: checked as boolean,
                          }))
                        }
                      />
                      <Label htmlFor="overallocated" className="text-sm">
                        Solo sobreasignados
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <Button variant="outline" onClick={clearFilters}>
                    Limpiar Filtros
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Tabla de asignaciones */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Período</TableHead>
                  <TableHead>Persona</TableHead>
                  <TableHead>Proyecto</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead className="text-center">Asignación</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-muted-foreground">
                        <p>No se encontraron asignaciones</p>
                        <p className="text-sm">
                          Ajustá los filtros o{" "}
                          <Link href="/assignments/new" className="text-primary hover:underline">
                            creá una nueva asignación
                          </Link>
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAssignments.map((a) => {
                    const person = people.find((p) => p.id === a.person_id)
                    const project = projects.find((p) => p.id === a.project_id)
                    const isOverallocated = a.allocation > 100

                    return (
                      <TableRow key={a.id}>
                        <TableCell>
                          <div className="text-sm">
                            <div>{format(new Date(a.start_date), "dd MMM yyyy", { locale: es })}</div>
                            <div className="text-muted-foreground">
                              {format(new Date(a.end_date), "dd MMM yyyy", { locale: es })}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{person?.name || "N/A"}</div>
                            <div className="text-sm text-muted-foreground">{person?.profile || ""}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{project?.name || "N/A"}</div>
                            <div className="text-sm text-muted-foreground">{project?.status || ""}</div>
                          </div>
                        </TableCell>
                        <TableCell>{a.assigned_role || "Sin especificar"}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Badge variant={isOverallocated ? "destructive" : "secondary"} className="text-xs">
                              {a.allocation}%
                            </Badge>
                            {isOverallocated && <AlertTriangle className="h-4 w-4 text-destructive" />}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {isOverallocated && (
                              <Badge variant="destructive" className="text-xs w-fit">
                                Sobreasignado
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs w-fit">
                              {project?.status || "N/A"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
                              <Link href={`/assignments/${a.id}/edit`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAssignment(a.id)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
