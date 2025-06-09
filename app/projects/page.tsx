"use client"

import { useState } from "react"
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TableResource } from "@/components/ui/table-resource"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useProjects } from "@/hooks/use-data"
import { toast } from "sonner"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { projectColumns } from "@/constants/resource-columns/projectColumns"
import { ResourceAction, ResourceColumn } from "@/types"
import { Project } from "@/lib/supabase"

export default function ProjectsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const { projects, loading, error, deleteProject } = useProjects()
  const router = useRouter()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando proyectos...</p>
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

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === "all" || project.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este proyecto?")) {
      try {
        await deleteProject(id)
        toast.success("Proyecto eliminado correctamente")
      } catch (error) {
        toast.error("Error al eliminar el proyecto")
        console.error("Error deleting project:", error)
      }
    }
  }

  const actions: ResourceAction[] = [
    {
      label: "Ver",
      resourceName: "projects",
      icon: Eye,
      path: (id) => `projects/${id}/show`,
    },
    {
      label: "Editar",
      resourceName: "projects",
      icon: Edit,
      path: (id) => `projects/${id}/edit`,
    },
    {
      label: "Eliminar",
      resourceName: "projects",
      icon: Trash2,
      onClick: (id) => handleDelete(id),
    },
  ]

  return (
    <main className="flex-1 container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Proyectos</h1>
          <p className="text-muted-foreground">Gestiona los proyectos en curso</p>
        </div>
        <Button asChild>
          <Link href="/projects/new">
            <Plus className="h-4 w-4 mr-2" />
            Crear Proyecto
          </Link>
        </Button>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="pt-6 flex flex-col sm:flex-row gap-4">
          <div className="relative w-full sm:w-2/3">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="In Progress">En Progreso</SelectItem>
              <SelectItem value="On Hold">En Pausa</SelectItem>
              <SelectItem value="Finished">Finalizado</SelectItem>
              <SelectItem value="Not Started">No Iniciado</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Proyectos</CardTitle>
          <CardDescription>Proyectos registrados en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <TableResource
            items={filteredProjects}
            columns={projectColumns as ResourceColumn<Project>[]}
            actions={actions}
          />
        </CardContent>
      </Card>
    </main>
  )
}
