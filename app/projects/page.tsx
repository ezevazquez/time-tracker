"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Calendar,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getStatusBadge } from "@/utils/getStatusBadge";
import { getStatusLabel } from "@/utils/getStatusLabel";
import { getDuration } from "@/utils/getDuration";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProjects } from "@/hooks/use-data";
import { toast } from "sonner";
import Link from "next/link";
import { ResourceLayout } from "@/components/ui/layouts/resource-layout";
import { RESOURCES } from "@/constants/resources";
import { ButtonCreateResource } from "@/components/ui/button-create";
import { TableResource } from "@/components/ui/table-resource";
import { projectColumns } from "@/constants/resource-columns/projectColumns";
import { ResourceAction, ResourceColumn } from "@/types";
import { Project } from "@/lib/supabase";
import path from "path";

export default function ProjectsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { projects, loading, error, deleteProject } = useProjects();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando proyectos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.description &&
        project.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus =
      statusFilter === "all" || project.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (id: string) => {
    if (
      confirm(
        `¿Estás seguro de que quieres eliminar el proyecto este proyecto?`
      )
    ) {
      try {
        await deleteProject(id);
        toast.success("Proyecto eliminado correctamente");
      } catch (error) {
        toast.error("Error al eliminar el proyecto");
      }
    }
  };

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
  ];

  return (
    <ResourceLayout
      resource={RESOURCES.projects}
      isLoading={loading}
      action={<ButtonCreateResource resource={RESOURCES.projects} />}
    >
      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
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
          </div>
        </CardContent>
      </Card>

      {/* Projects Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Proyectos ({filteredProjects.length})</CardTitle>
          <CardDescription>Proyectos registrados en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <TableResource
            items={filteredProjects}
            columns={projectColumns as ResourceColumn<Project>[]}
            actions={actions}
          ></TableResource>
        </CardContent>
      </Card>
    </ResourceLayout>
  );
}
