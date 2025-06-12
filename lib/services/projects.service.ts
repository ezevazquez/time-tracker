import { supabase } from '@/lib/supabase/client'
import type { Project } from '@/types/project'

export const projectsService = {
  async getAll(): Promise<Project[]> {
    const { data, error } = await supabase.from('projects').select('*').order('name')
    if (error) throw new Error(`Error fetching projects: ${error.message}`)
    return data ?? []
  },

  async getById(id: string): Promise<Project | null> {
    const { data, error } = await supabase.from('projects').select('*').eq('id', id).single()
    if (error) throw error
    return data
  },

  async create(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project> {
    const { data, error } = await supabase.from('projects').insert(project).select().single()
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<Project>): Promise<Project> {
    const { data, error } = await supabase.from('projects').update(updates).eq('id', id).select().single()
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) throw error
  },
}
