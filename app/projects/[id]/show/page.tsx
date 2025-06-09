"use client";
import React, { useEffect } from "react";
import { ResourceLayout } from "@/components/ui/layouts/resource-layout";
import { RESOURCES } from "@/constants/resources";
import { useProjects } from "@/hooks/use-data";
import { useParams } from "next/navigation";
import { Project, ProjectWithClient } from "@/lib/supabase";
import { ButtonCreateResource } from "@/components/ui/button-create";

export default function ProjectShowPage() {
  const { loading, error, deleteProject, getProject } = useProjects();
  const [project, setProject] = React.useState<ProjectWithClient | null>(null);
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
      description={project?.description || "No hay descripción disponible"}
      resource={RESOURCES.projects}
      isLoading={loading}
      status={project?.status}
      headerContent={
        project && (
          <div className="font-semibold">
            {project?.clients ? project?.clients.name : "Sin cliente"}
          </div>
        )
      }
      action={project && <ButtonCreateResource resource={RESOURCES.projects} />}
    >
      <></>
    </ResourceLayout>
  );
}
