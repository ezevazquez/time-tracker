import { ResourceColumn, ResourceNames } from "@/types";
import { clientsColumns } from "./clientsColumns";
export const ResourceColumnsMap: Partial<
  Record<ResourceNames, ResourceColumn<any>[]>
> = {
  clients: clientsColumns,
};
