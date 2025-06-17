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
      // Obtener todas las asignaciones que se superponen con el rango de fechas
      let query = supabase
        .from('assignments')
        .select('id, allocation, start_date, end_date')
        .eq('person_id', personId)
        .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`)

      // Excluir la asignación actual si estamos editando
      if (assignmentId) {
        query = query.neq('id', assignmentId)
      }

      const { data: overlappingAssignments, error } = await query

      if (error) {
        throw new Error(`Error fetching overlapping assignments: ${error.message}`)
      }

      // Calcular la asignación total existente
      const totalExistingAllocation = (overlappingAssignments || []).reduce((sum, a) => sum + (a.allocation || 0), 0)
      
      // Calcular la asignación total con la nueva asignación
      const totalAllocation = totalExistingAllocation + allocation

      // Verificar si hay sobreasignación
      const isOverallocated = totalAllocation > 1.0

      // Si hay sobreasignación, calcular los días problemáticos
      let overallocatedDays: any[] = []
      if (isOverallocated) {
        // Generar todos los días del rango de la nueva asignación
        const start = new Date(startDate)
        const end = new Date(endDate)
        const days: any[] = []
        
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const currentDate = d.toISOString().split('T')[0]
          
          // Calcular la asignación total para este día específico
          let dayTotalAllocation = allocation // La nueva asignación siempre está presente
          
          // Sumar asignaciones existentes que cubren este día
          for (const existingAssignment of overlappingAssignments || []) {
            const existingStart = new Date(existingAssignment.start_date)
            const existingEnd = new Date(existingAssignment.end_date)
            const currentDay = new Date(currentDate)
            
            if (currentDay >= existingStart && currentDay <= existingEnd) {
              dayTotalAllocation += existingAssignment.allocation || 0
            }
          }
          
          // Solo incluir días que realmente tienen sobreasignación
          if (dayTotalAllocation > 1.0) {
            days.push({
              date: currentDate,
              total_allocation: dayTotalAllocation,
              message: `Asignación total: ${Math.round(dayTotalAllocation * 100)}%`
            })
          }
        }
        
        overallocatedDays = days
      }

      const result: OverallocationResult = {
        isOverallocated,
        overallocatedDays,
        totalAllocation
      }

      return result
    } catch (error) {
      throw new Error(`Error checking overallocation: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },
}
