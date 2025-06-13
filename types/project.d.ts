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
    fte: number | null // Total FTE requerido para el proyecto
  }
  
  export interface ProjectWithClient extends Project {
    clients?: {
      id: string
      name: string
    }
  }
  