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

  async create(project: Omit<Project, 'created_at' | 'updated_at'>): Promise<Project> {
    const { project_code, ...projectWithoutCode } = project as any
    const { data, error } = await supabase
      .from('projects')
      .insert(projectWithoutCode)
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
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('assignments')
      .select('allocation, start_date, end_date')
      .eq('project_id', projectId)
      .gte('end_date', today) // Solo asignaciones activas

    if (error) throw error
    
    const totalAssigned = data?.reduce((sum, assignment) => {
      // Calcular la duración en días
      const startDate = new Date(assignment.start_date)
      const endDate = new Date(assignment.end_date)
      const durationInDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
      
      // Convertir a FTE mensual (30.44 días por mes)
      const daysPerMonth = 30.44
      const fteMonths = (assignment.allocation * durationInDays) / daysPerMonth
      
      return sum + fteMonths
    }, 0) || 0
    
    return totalAssigned
  }
}
