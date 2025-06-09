import { Resource, ResourceNames } from "@/types";
export const RESOURCES: Partial<Record<ResourceNames, Resource>> = {
  projects: {
    slug: "projects",
    singularLabel: "Proyecto",
    pluralLabel: "Proyectos",
    icon: "folder",
    path: "/projects",
  },
};
