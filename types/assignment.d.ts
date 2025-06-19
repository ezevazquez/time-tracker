export interface Assignment {
  id: string
  project_id: string
  person_id: string
  start_date: string
  end_date: string
  allocation: number // entre 0.0 y 1.0
  created_at: string
  updated_at: string
  is_billable: boolean
}

export interface AssignmentWithRelations extends Assignment {
  people?: {
    id: string
    name: string
    status: string
  }
  projects?: {
    id: string
    name: string
    status: string
  }
}
