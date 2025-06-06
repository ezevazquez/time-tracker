import { ResourceNames } from "./ResourceNames";

export type ResourceAction = {
  label: string;
  resourceName?: ResourceNames;
  onClick?: (id: string) => void;
  path?: (id: string) => string;
  icon: React.ElementType;
};
