// export type ResourceNames = string // (No existe, así que lo reemplazo por string)

export type ResourceAction = {
  label: string
  resourceName?: string
  onClick?: (id: string) => void
  path?: (id: string) => string
  icon: React.ElementType
}
