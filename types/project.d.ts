export interface Project {
  id: string
  name: string
  description: string | null
  start_date: string | null
  end_date: string | null
  status: 'In Progress' | 'Finished' | 'On Hold' | 'Not Started'
  created_at: string
  updated_at: string
  client_id: string | null
  activity_logs?: any[]
  fte: number | null // Total FTE requerido para el proyecto
  project_code?: string | null // Código automático de 2 letras + 2 números
  contract_type?: string | null
}

export interface ProjectWithClient extends Project {
  clients?: {
    id: string
    name: string
  }
}
