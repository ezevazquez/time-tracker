"use client";
import React, { useEffect } from "react";
import { ResourceLayout } from "@/components/ui/layouts/resource-layout";
import { RESOURCES } from "@/app/constants/resources";
import { useProjects } from "@/hooks/use-data";
import { useParams } from "next/navigation";
import { Project } from "@/lib/supabase";
export default function ProjectShowPage() {
  const { loading, error, deleteProject, getProject } = useProjects();
  const [project, setProject] = React.useState<Project | null>(null);
  const { id } = useParams();

  if (typeof id !== "string") {
    throw new Error("ID de proyecto inválido.");
  }

  useEffect(() => {
    const fetchProject = async () => {
      const data = await getProject(id);
      setProject(data);
    };
    fetchProject();
  }, [id]);

  useEffect(() => {
    console.log("Project data:", project);
  }, [project]);

  return (
    <ResourceLayout
      title={project ? project.name : "Cargando proyecto..."}
      description="Esta página mostrará los detalles del proyecto seleccionado."
      resource={RESOURCES.projects}
      isLoading={loading}
    >
      <></>
    </ResourceLayout>
  );
}
