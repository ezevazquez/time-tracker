import { supabase } from '@/lib/supabase/client'
import type { Assignment, AssignmentWithRelations } from '@/types/assignment'

interface OverallocationResult {
  isOverallocated: boolean
  overallocatedDays: any[]
  totalAllocation: number
}

// Function to generate a simple UUID
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

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
    const id = crypto.randomUUID()
    const insertData = {
      id,
      ...assignment,
      created_at: new Date().toISOString().split('T')[0],
    }

    const { data, error } = await supabase
      .from('assignments')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      throw new Error(`Error creating assignment: ${error.message}`)
    }

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

  async checkAssignmentOverallocation(
    assignmentId: string | null,
    personId: string,
    startDate: string,
    endDate: string,
    allocation: number
  ): Promise<OverallocationResult> {
    try {
      const { data, error } = await supabase.rpc('check_assignment_overallocation', {
        p_assignment_id: assignmentId,
        p_person_id: personId,
        p_start_date: startDate,
        p_end_date: endDate,
        p_allocation: allocation
      })

      if (error) {
        throw new Error(`Error checking overallocation: ${error.message}`)
      }

      const result: OverallocationResult = {
        isOverallocated: data && data.length > 0,
        overallocatedDays: data || [],
        totalAllocation: data && data.length > 0 ? data[0].total_allocation : 0
      }

      return result
    } catch (error) {
      throw new Error(`Error checking overallocation: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },
}
