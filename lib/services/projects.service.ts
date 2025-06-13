import { supabase } from '@/lib/supabase/client'
import type { Project } from '@/types/project'

export const projectsService = {
  async getAll(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        clients (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        clients (
          id,
          name
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  async create(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .insert(project)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async update(id: string, project: Partial<Project>): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .update({ ...project, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async getAssignedFTE(projectId: string): Promise<number> {
    const { data, error } = await supabase
      .from('assignments')
      .select('allocation')
      .eq('project_id', projectId)
      .gte('end_date', new Date().toISOString().split('T')[0]) // Solo asignaciones activas

    if (error) throw error
    
    const totalAssigned = data?.reduce((sum, assignment) => sum + assignment.allocation, 0) || 0
    return totalAssigned
  }
}
