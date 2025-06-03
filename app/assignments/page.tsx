"use client"

import { useState } from "react"
import { Plus, Search, MoreHorizontal, Edit, Trash2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAssignments, usePeople, useProjects } from "@/hooks/use-data"
import { toast } from "sonner"
import Link from "next/link"

export default function AssignmentsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [personFilter, setPersonFilter] = useState("all")
  const [projectFilter, setProjectFilter] = useState("all")

  const { assignments, loading: assignmentsLoading, error: assignmentsError, deleteAssignment } = useAssignments()
  const { people, loading: peopleLoading, error: peopleError } = usePeople()
  const { projects, loading: projectsLoading, error: projectsError } = useProjects()

  const loading = assignmentsLoading || peopleLoading || projectsLoading
  const error = assignmentsError || peopleError || projectsError

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

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <p>Error: {error}</p>
        </div>
      </div>
    )
  }

  const filteredAssignments = assignments.filter((assignment) => {
    const person = people.find((p) => p.id === assignment.person_id)
    const project = projects.find((p) => p.id === assignment.project_id)

    const matchesSearch =
      person?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project?.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPerson = personFilter === "all" || assignment.person_id === personFilter
    const matchesProject = projectFilter === "all" || assignment.project_id === projectFilter

    return matchesSearch && matchesPerson && matchesProject
  })

  const getPersonName = (personId: string) => {
    return people.find((p) => p.id === personId)?.name || "Desconocido"
  }

  const getProjectName = (projectId: string) => {
    return projects.find((p) => p.id === projectId)?.name || "Desconocido"
  }

  const getAllocationBadge = (allocation: number) => {
    if (allocation >= 1.0) return "bg-red-100 text-red-800"
    if (allocation >= 0.8) return "bg-yellow-100 text-yellow-800"
    return "bg-green-100 text-green-800"
  }

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta asignación?")) {
      try {
        await deleteAssignment(id)
        toast.success("Asignación eliminada correctamente")
      } catch (error) {
        toast.error("Error al eliminar la asignación")
      }
    }
  }

  // Check for overallocations
  const checkOverallocations = () => {
    const personAllocations: { [key: string]: { [key: string]: number } } = {}

    assignments.forEach((assignment) => {
      const startDate = assignment.start_date
      const endDate = assignment.end_date

      if (!personAllocations[assignment.person_id]) {
        personAllocations[assignment.person_id] = {}
      }

      // Simple check for overlapping periods (this could be more sophisticated)
      const key = `${startDate}-${endDate}`
      if (!personAllocations[assignment.person_id][key]) {
        personAllocations[assignment.person_id][key] = 0
      }
      personAllocations[assignment.person_id][key] += assignment.allocation
    })

    const overallocations = []
    for (const personId in personAllocations) {
      for (const period in personAllocations[personId]) {
        if (personAllocations[personId][period] > 1.0) {
          overallocations.push({
            person: getPersonName(personId),
            period,
            allocation: personAllocations[personId][period],
          })
        }
      }
    }

    return overallocations
  }

  const overallocations = checkOverallocations()

  return (
    <main className="flex-1 container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Asignaciones</h1>
          <p className="text-muted-foreground">Gestiona la asignación de personas a proyectos</p>
        </div>
        <Button asChild>
          <Link href="/assignments/new">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Asignación
          </Link>
        </Button>
      </div>

      {/* Overallocation Alert */}
      {overallocations.length > 0 && (
        <Alert className="mb-6 border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Sobreasignaciones detectadas:</strong> {overallocations.length} persona(s) tienen más del 100% de
            asignación en algunos períodos.
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por persona o proyecto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={personFilter} onValueChange={setPersonFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por persona" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las personas</SelectItem>
                {people.map((person) => (
                  <SelectItem key={person.id} value={person.id}>
                    {person.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por proyecto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los proyectos</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Assignments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Asignaciones ({filteredAssignments.length})</CardTitle>
          <CardDescription>Asignaciones activas en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Persona</TableHead>
                <TableHead>Proyecto</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Dedicación</TableHead>
                <TableHead>Creado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell className="font-medium">{getPersonName(assignment.person_id)}</TableCell>
                  <TableCell>{getProjectName(assignment.project_id)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{new Date(assignment.start_date).toLocaleDateString("es-ES")}</div>
                      <div className="text-muted-foreground">
                        hasta {new Date(assignment.end_date).toLocaleDateString("es-ES")}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getAllocationBadge(assignment.allocation)}>
                      {Math.round(assignment.allocation * 100)}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(assignment.created_at).toLocaleDateString("es-ES")}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/assignments/${assignment.id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(assignment.id)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  )
}
