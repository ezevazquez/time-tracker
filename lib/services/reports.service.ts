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
  client_name: string | null
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
      .select('*, projects(*, clients(name))')
      .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`)

    if (assignmentsError) throw assignmentsError

    const fteReportData: FTEReportData[] = []
    const rangeStart = parseDateFromString(startDate)
    const rangeEnd = parseDateFromString(endDate)
    const daysInRange = Math.floor((rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)) + 1

    for (const person of people) {
      const personAssignments = assignments.filter(a => a.person_id === person.id)
      // Para cada día del rango, calcular allocation por proyecto
      const days: { date: Date, projectId: string, project: any, allocation: number, is_billable: boolean }[] = []
      for (let i = 0; i < daysInRange; i++) {
        const day = new Date(rangeStart)
        day.setDate(day.getDate() + i)
        // Map de projectId a allocation ese día
        const projectAllocMap: Record<string, { project: any, allocation: number, is_billable: boolean }> = {}
        let totalAllocation = 0
        for (const a of personAssignments) {
          const aStart = parseDateFromString(a.start_date)
          const aEnd = parseDateFromString(a.end_date)
          if (day >= aStart && day <= aEnd) {
            const project = Array.isArray(a.projects) ? a.projects[0] : a.projects
            const projectId = project?.id || 'unknown'
            if (!projectAllocMap[projectId]) {
              projectAllocMap[projectId] = { project, allocation: 0, is_billable: a.is_billable !== false }
            }
            projectAllocMap[projectId].allocation += a.allocation
            totalAllocation += a.allocation
          }
        }
        // Push rows por proyecto
        for (const projectId in projectAllocMap) {
          days.push({
            date: new Date(day),
            projectId,
            project: projectAllocMap[projectId].project,
            allocation: projectAllocMap[projectId].allocation,
            is_billable: projectAllocMap[projectId].is_billable
          })
        }
        // Si allocation total < 1, agregar Bench
        if (totalAllocation < 1) {
          days.push({
            date: new Date(day),
            projectId: 'bench',
            project: null,
            allocation: 1 - totalAllocation,
            is_billable: false
          })
        }
      }
      // Agrupar por proyectoId
      const projectRows: Record<string, { allocationSum: number, days: Date[], project: any, is_billable: boolean }> = {}
      for (const d of days) {
        if (!projectRows[d.projectId]) {
          projectRows[d.projectId] = { allocationSum: 0, days: [], project: d.project, is_billable: d.is_billable }
        }
        projectRows[d.projectId].allocationSum += d.allocation
        projectRows[d.projectId].days.push(d.date)
      }
      // Emitir una sola row por proyecto y por Bench
      for (const projectId in projectRows) {
        const { allocationSum, days: projectDays, project, is_billable } = projectRows[projectId]
        // Calcular fechas de actividad
        const sortedDays = projectDays.sort((a, b) => a.getTime() - b.getTime())
        const start = sortedDays[0]
        const end = sortedDays[sortedDays.length - 1]
        fteReportData.push({
          person_id: person.id,
          person_first_name: person.first_name,
          person_last_name: person.last_name,
          person_profile: person.profile,
          person_status: person.status,
          project_name: projectId === 'bench' ? 'Bench' : (project?.name || 'Proyecto sin nombre'),
          project_status: projectId === 'bench' ? 'Bench' : (project?.status || 'Sin estado'),
          client_name: projectId === 'bench' ? null : (project?.clients?.name || null),
          allocation: allocationSum / daysInRange,
          allocation_percentage: Math.round((allocationSum / daysInRange) * 100),
          start_date: start.toISOString().slice(0, 10),
          end_date: end.toISOString().slice(0, 10),
          is_bench: projectId === 'bench',
          is_billable
        })
      }
    }
    return fteReportData
  } catch (error) {
    console.error('Error in fetchOcupationReport:', error)
    return []
  }
}
