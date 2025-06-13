import { supabase } from '@/lib/supabase/client'
import { parseDateFromString } from '@/lib/assignments'

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
  is_billable: boolean
}

export async function fetchOcupationReport(startDate: string, endDate: string): Promise<FTEReportData[]> {
  try {
    // Fetch all people
    const { data: people, error: peopleError } = await supabase
      .from('people')
      .select('id, first_name, last_name, profile, status')
      .eq('status', 'Active')

    if (peopleError) throw peopleError

    // Fetch all assignments in the date range
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('*')
      .gte('start_date', startDate)
      .lte('end_date', endDate)

    if (assignmentsError) throw assignmentsError

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
          start_date: startDate,
          end_date: endDate,
          assigned_role: 'Sin asignación',
          is_bench: true,
          is_billable: false
        })
      } else {
        // Calcular asignaciones por día para el rango completo
        const startDateObj = parseDateFromString(startDate)
        const endDateObj = parseDateFromString(endDate)
        const totalDays = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)) + 1
        
        // Para cada día, calcular la asignación total
        const dailyAllocations: { [date: string]: number } = {}
        
        for (let d = new Date(startDateObj); d <= endDateObj; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0]
          let totalAllocation = 0
          
          for (const assignment of personAssignments) {
            const assignmentStart = parseDateFromString(assignment.start_date)
            const assignmentEnd = parseDateFromString(assignment.end_date)
            
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
            is_bench: false,
            is_billable: assignment.is_billable
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
            start_date: startDate,
            end_date: endDate,
            assigned_role: 'Sin asignación',
            is_bench: true,
            is_billable: false
          })
        }
      }
    }

    return fteReportData

  } catch (error) {
    console.error('Error in fetchOcupationReport:', error)
    return []
  }
}
