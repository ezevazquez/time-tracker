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
import Link from "next/link"

// Mock data
const mockPeople = [
  { id: "1", name: "Ana García", profile: "Frontend Dev" },
  { id: "2", name: "Carlos López", profile: "UX Designer" },
  { id: "3", name: "María Rodríguez", profile: "Backend Dev" },
  { id: "4", name: "Juan Pérez", profile: "Project Manager" },
]

const mockProjects = [
  { id: "1", name: "E-commerce Platform" },
  { id: "2", name: "Mobile App Redesign" },
  { id: "3", name: "API Integration" },
]

const mockAssignments = [
  {
    id: "1",
    person_id: "1",
    project_id: "1",
    start_date: "2024-01-15",
    end_date: "2024-04-30",
    allocation: 0.8,
    created_at: "2024-01-10",
  },
  {
    id: "2",
    person_id: "2",
    project_id: "2",
    start_date: "2024-02-01",
    end_date: "2024-05-15",
    allocation: 1.0,
    created_at: "2024-01-25",
  },
  {
    id: "3",
    person_id: "3",
    project_id: "1",
    start_date: "2024-01-15",
    end_date: "2024-06-30",
    allocation: 0.6,
    created_at: "2024-01-12",
  },
  {
    id: "4",
    person_id: "1",
    project_id: "2",
    start_date: "2024-03-01",
    end_date: "2024-05-31",
    allocation: 0.5,
    created_at: "2024-02-25",
  },
]

export default function AssignmentsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [personFilter, setPersonFilter] = useState("all")
  const [projectFilter, setProjectFilter] = useState("all")

  const filteredAssignments = mockAssignments.filter((assignment) => {
    const person = mockPeople.find((p) => p.id === assignment.person_id)
    const project = mockProjects.find((p) => p.id === assignment.project_id)

    const matchesSearch =
      person?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project?.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPerson = personFilter === "all" || assignment.person_id === personFilter
    const matchesProject = projectFilter === "all" || assignment.project_id === projectFilter

    return matchesSearch && matchesPerson && matchesProject
  })

  const getPersonName = (personId: string) => {
    return mockPeople.find((p) => p.id === personId)?.name || "Desconocido"
  }

  const getProjectName = (projectId: string) => {
    return mockProjects.find((p) => p.id === projectId)?.name || "Desconocido"
  }

  const getAllocationBadge = (allocation: number) => {
    if (allocation >= 1.0) return "bg-red-100 text-red-800"
    if (allocation >= 0.8) return "bg-yellow-100 text-yellow-800"
    return "bg-green-100 text-green-800"
  }

  // Check for overallocations
  const checkOverallocations = () => {
    const personAllocations: { [key: string]: { [key: string]: number } } = {}

    mockAssignments.forEach((assignment) => {
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
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-2xl font-bold text-primary">
                ResourceFlow
              </Link>
              <nav className="hidden md:flex space-x-6">
                <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-primary">
                  Dashboard
                </Link>
                <Link href="/people" className="text-sm font-medium text-muted-foreground hover:text-primary">
                  Personas
                </Link>
                <Link href="/projects" className="text-sm font-medium text-muted-foreground hover:text-primary">
                  Proyectos
                </Link>
                <Link href="/assignments" className="text-sm font-medium text-primary">
                  Asignaciones
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
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
                  {mockPeople.map((person) => (
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
                  {mockProjects.map((project) => (
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
                          <DropdownMenuItem className="text-red-600">
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
    </div>
  )
}
