export interface Person {
    id: string
    name: string
    profile: string
    start_date: string
    end_date: string | null
    status: 'Activo' | 'Pausado' | 'Terminado'
    type: 'Internal' | 'External'
    created_at: string
    updated_at: string
    first_name: string
    last_name: string
  }
  