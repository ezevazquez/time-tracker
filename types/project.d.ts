import { ActivityLog } from './ActivityLog'

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
  activity_logs?: ActivityLog[]
}

export interface ProjectWithClient extends Project {
  clients?: {
    id: string
    name: string
  }
}
