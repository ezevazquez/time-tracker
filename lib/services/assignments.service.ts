import { supabase } from '@/lib/supabase/client'
import type { Assignment, AssignmentWithRelations } from '@/types/assignment'

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
    console.log('AssignmentsService.create called with:', assignment)
    
    // Generate an id and add it to the insert data
    const insertData = {
      id: generateId(),
      ...assignment
    }
    
    console.log('Insert data (with generated id):', insertData)
    
    const { data, error } = await supabase.from('assignments').insert(insertData).select().single()
    
    console.log('Supabase response - data:', data)
    console.log('Supabase response - error:', error)
    
    if (error) {
      console.error('Supabase error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      throw error
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
  ): Promise<{ isOverallocated: boolean; overallocatedDates: Array<{ date: string; totalAllocation: number }> }> {
    console.log('🚀 checkAssignmentOverallocation llamado con:', {
      assignmentId,
      personId,
      startDate,
      endDate,
      allocation
    })

    const { data, error } = await supabase.rpc('check_assignment_overallocation', {
      _assignment_id: assignmentId,
      _person_id: personId,
      _start_date: startDate,
      _end_date: endDate,
      _allocation: allocation
    })

    console.log('📡 Respuesta de Supabase RPC:', { data, error })

    if (error) {
      console.error('❌ Error en RPC:', error)
      throw new Error(`Error checking assignment overallocation: ${error.message}`)
    }

    const overallocatedDates = data || []
    const isOverallocated = overallocatedDates.length > 0

    const result = {
      isOverallocated,
      overallocatedDates: overallocatedDates.map((item: any) => ({
        date: item.overallocated_date,
        totalAllocation: item.total_allocation
      }))
    }

    console.log('📊 Resultado procesado:', result)
    return result
  },
}
