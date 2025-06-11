import { supabase } from '@/lib/supabase/client'
import type { Assignment, AssignmentWithRelations } from '@/types/assignment'

export const assignmentsService = {
  async getAll(): Promise<AssignmentWithRelations[]> {
    const { data, error } = await supabase
      .from('assignments')
      .select('*, people(*), projects(*)')
      .order('start_date', { ascending: true })
    if (error) throw new Error(`Error fetching assignments: ${error.message}`)
    return data ?? []
  },

  async getById(id: string): Promise<Assignment | null> {
    const { data, error } = await supabase.from('assignments').select('*').eq('id', id).single()
    if (error) throw error
    return data
  },

  async create(
    assignment: Omit<Assignment, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Assignment> {
    const { data, error } = await supabase.from('assignments').insert(assignment).select().single()
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<Assignment>): Promise<Assignment> {
    const { data, error } = await supabase
      .from('assignments')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('assignments').delete().eq('id', id)
    if (error) throw error
  },
  
  async getTotalAllocationForPersonInRange(
    personId: string,
    startDate: string,
    endDate: string,
    excludeAssignmentId?: string
  ): Promise<{ projectedMax: number }> {
    let query = supabase
      .from('assignments')
      .select('allocation, start_date, end_date, id')
      .eq('person_id', personId)
      .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`)

    if (excludeAssignmentId) {
      query = query.neq('id', excludeAssignmentId)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Error fetching overlapping assignments: ${error.message}`)
    }

    const projectedMax = (data ?? []).reduce((sum, a) => sum + (a.allocation ?? 0), 0)

    return { projectedMax }
  },
}
