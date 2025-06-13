import { supabase } from '@/lib/supabase/client'

interface FTEReportData {
  person_id: string
  person_first_name: string
  person_last_name: string
  person_profile: string
  person_status: string
  project_name: string
  project_status: string
  allocation: number
  allocation_percentage: number
  start_date: string
  end_date: string
  assigned_role?: string
  is_bench: boolean
}

export async function fetchOcupationReport(initial: string, final: string) {
  try {
    // Obtener todas las personas activas
    const { data: people, error: peopleError } = await supabase
      .from('people')
      .select('id, first_name, last_name, profile, status')
      .eq('status', 'Active')

    if (peopleError) {
      console.error('Error fetching people:', peopleError)
      return []
    }

    // Obtener todas las asignaciones en el rango de fechas
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select(`
        id,
        person_id,
        start_date,
        end_date,
        allocation,
        assigned_role,
        projects (
          name,
          status
        )
      `)
      .gte('start_date', initial)
      .lte('end_date', final)

    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError)
      return []
    }

    console.log('People:', people)
    console.log('Assignments:', assignments)

    const fteReportData: FTEReportData[] = []

    // Para cada persona, calcular sus asignaciones y bench
    for (const person of people) {
      const personAssignments = assignments.filter(a => a.person_id === person.id)
      
      if (personAssignments.length === 0) {
        // Persona sin asignaciones = 100% bench
        fteReportData.push({
          person_id: person.id,
          person_first_name: person.first_name,
          person_last_name: person.last_name,
          person_profile: person.profile,
          person_status: person.status,
          project_name: 'Bench',
          project_status: 'Bench',
          allocation: 1.0,
          allocation_percentage: 100,
          start_date: initial,
          end_date: final,
          assigned_role: 'Sin asignación',
          is_bench: true
        })
      } else {
        // Calcular asignaciones por día para el rango completo
        const startDate = new Date(initial)
        const endDate = new Date(final)
        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
        
        // Para cada día, calcular la asignación total
        const dailyAllocations: { [date: string]: number } = {}
        
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0]
          let totalAllocation = 0
          
          for (const assignment of personAssignments) {
            const assignmentStart = new Date(assignment.start_date)
            const assignmentEnd = new Date(assignment.end_date)
            
            if (d >= assignmentStart && d <= assignmentEnd) {
              totalAllocation += assignment.allocation
            }
          }
          
          dailyAllocations[dateStr] = totalAllocation
        }

        // Crear filas para cada asignación
        for (const assignment of personAssignments) {
          const project = Array.isArray(assignment.projects) ? assignment.projects[0] : assignment.projects
          
          fteReportData.push({
            person_id: person.id,
            person_first_name: person.first_name,
            person_last_name: person.last_name,
            person_profile: person.profile,
            person_status: person.status,
            project_name: project?.name || 'Proyecto sin nombre',
            project_status: project?.status || 'Sin estado',
            allocation: assignment.allocation,
            allocation_percentage: Math.round(assignment.allocation * 100),
            start_date: assignment.start_date,
            end_date: assignment.end_date,
            assigned_role: assignment.assigned_role || '',
            is_bench: false
          })
        }

        // Calcular bench (tiempo libre)
        const totalAssigned = personAssignments.reduce((sum, a) => sum + a.allocation, 0)
        const benchAllocation = Math.max(0, 1.0 - totalAssigned)
        
        if (benchAllocation > 0) {
          fteReportData.push({
            person_id: person.id,
            person_first_name: person.first_name,
            person_last_name: person.last_name,
            person_profile: person.profile,
            person_status: person.status,
            project_name: 'Bench',
            project_status: 'Bench',
            allocation: benchAllocation,
            allocation_percentage: Math.round(benchAllocation * 100),
            start_date: initial,
            end_date: final,
            assigned_role: 'Sin asignación',
            is_bench: true
          })
        }
      }
    }

    console.log('FTE Report Data:', fteReportData)
    return fteReportData

  } catch (error) {
    console.error('Error in fetchOcupationReport:', error)
    return []
  }
}
