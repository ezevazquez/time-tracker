export interface ActivityLog {
  id: string
  user_id: string | null
  display_name: string | null
  table_name: string | null
  field_name: string | null
  old_value: string | null
  new_value: string | null
  action: 'create' | 'update' | 'delete' | 'login' | string
  resource_type: 'projects' | 'clients' | 'assignments' | string
  resource_id: string
  metadata: Record<string, any> | null
  created_at: string
}
