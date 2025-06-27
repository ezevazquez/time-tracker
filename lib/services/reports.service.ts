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

    // Fetch all assignments that overlap with the date range
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('*, projects(*)')
      .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`)

    if (assignmentsError) throw assignmentsError

    const fteReportData: FTEReportData[] = []
    const rangeStart = parseDateFromString(startDate)
    const rangeEnd = parseDateFromString(endDate)
    const daysInRange = Math.floor((rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)) + 1

    for (const person of people) {
      const personAssignments = assignments.filter(a => a.person_id === person.id)
      // Generar un array de días con allocation y proyecto
      const days: { date: Date, allocation: number, projects: any[], is_billable: boolean[] }[] = []
      for (let i = 0; i < daysInRange; i++) {
        const day = new Date(rangeStart)
        day.setDate(day.getDate() + i)
        // Asignaciones activas ese día
        const activeAssignments = personAssignments.filter(a => {
          const aStart = parseDateFromString(a.start_date)
          const aEnd = parseDateFromString(a.end_date)
          return day >= aStart && day <= aEnd
        })
        const allocation = activeAssignments.reduce((sum, a) => sum + a.allocation, 0)
        const projects = activeAssignments.map(a => Array.isArray(a.projects) ? a.projects[0] : a.projects)
        const is_billable = activeAssignments.map(a => a.is_billable !== false)
        days.push({ date: new Date(day), allocation, projects, is_billable })
      }
      // Agrupar días consecutivos con el mismo allocation y proyecto(s)
      let current = null
      for (let i = 0; i <= days.length; i++) {
        const d = days[i]
        const key = d ? `${d.allocation}|${d.projects.map(p => p?.id || 'bench').join(',')}` : null
        if (!current) {
          if (d) {
            current = { start: d.date, end: d.date, allocation: d.allocation, projects: d.projects, is_billable: d.is_billable }
          }
        } else {
          const currentKey = `${current.allocation}|${current.projects.map(p => p?.id || 'bench').join(',')}`
          if (!d || key !== currentKey) {
            // Calcular días del período
            const periodDays = Math.floor((current.end.getTime() - current.start.getTime()) / (1000 * 60 * 60 * 24)) + 1
            // Emitir row para el período actual
            if (current.allocation === 0) {
              // Bench 100%
              fteReportData.push({
                person_id: person.id,
                person_first_name: person.first_name,
                person_last_name: person.last_name,
                person_profile: person.profile,
                person_status: person.status,
                project_name: 'Bench',
                project_status: 'Bench',
                allocation: 1.0 * periodDays / daysInRange,
                allocation_percentage: 100,
                start_date: current.start.toISOString().slice(0, 10),
                end_date: current.end.toISOString().slice(0, 10),
                is_bench: true,
                is_billable: false
              })
            } else {
              // Si hay proyectos, emitir una row por proyecto y una por bench si allocation < 1
              const totalAllocation = current.allocation
              for (let idx = 0; idx < current.projects.length; idx++) {
                const project = current.projects[idx]
                const is_billable = current.is_billable[idx]
                if (project) {
                  fteReportData.push({
                    person_id: person.id,
                    person_first_name: person.first_name,
                    person_last_name: person.last_name,
                    person_profile: person.profile,
                    person_status: person.status,
                    project_name: project?.name || 'Proyecto sin nombre',
                    project_status: project?.status || 'Sin estado',
                    allocation: (project ? project.allocation || totalAllocation : totalAllocation) * periodDays / daysInRange,
                    allocation_percentage: Math.round((project ? project.allocation || totalAllocation : totalAllocation) * 100),
                    start_date: current.start.toISOString().slice(0, 10),
                    end_date: current.end.toISOString().slice(0, 10),
                    is_bench: false,
                    is_billable
                  })
                }
              }
              if (totalAllocation < 1) {
                fteReportData.push({
                  person_id: person.id,
                  person_first_name: person.first_name,
                  person_last_name: person.last_name,
                  person_profile: person.profile,
                  person_status: person.status,
                  project_name: 'Bench',
                  project_status: 'Bench',
                  allocation: (1 - totalAllocation) * periodDays / daysInRange,
                  allocation_percentage: Math.round((1 - totalAllocation) * 100),
                  start_date: current.start.toISOString().slice(0, 10),
                  end_date: current.end.toISOString().slice(0, 10),
                  is_bench: true,
                  is_billable: false
                })
              }
            }
            current = d ? { start: d.date, end: d.date, allocation: d.allocation, projects: d.projects, is_billable: d.is_billable } : null
          } else {
            // Continuar el período
            if (d) current.end = d.date
          }
        }
      }
    }
    return fteReportData
  } catch (error) {
    console.error('Error in fetchOcupationReport:', error)
    return []
  }
}
