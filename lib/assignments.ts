import { eachDayOfInterval, isWithinInterval } from 'date-fns'
import type { Assignment } from '@/types/assignment'

/**
 * Convierte un valor en porcentaje (UI) a decimal (DB)
 * Ej: 50 → 0.5
 */
export function toDbAllocation(percent: number): number {
  return percent / 100
}

/**
 * Convierte un valor decimal (DB) a porcentaje (UI)
 * Ej: 0.5 → 50
 */
export function toUiAllocation(decimal: number): number {
  return decimal * 100
}

/**
 * Verifica si una nueva asignación excede el 100% en algún día del rango.
 */
export function willExceedDailyAllocation(
  existingAssignments: Assignment[],
  range: { start: Date; end: Date },
  newAllocation: number
): boolean {
  const days = eachDayOfInterval(range)

  return days.some(day => {
    const total = getTotalAllocation(existingAssignments, day)
    return total + newAllocation > 1
  })
}

/**
 * Calcula la suma total de asignación en un día determinado.
 */
export function getTotalAllocation(assignments: Assignment[], day: Date): number {
  return assignments
    .filter(a =>
      isWithinInterval(day, {
        start: new Date(a.start_date),
        end: new Date(a.end_date),
      })
    )
    .reduce((sum, a) => sum + a.allocation, 0)
}

/**
 * Filtra asignaciones activas para una fecha específica (por default, hoy).
 */
export function getCurrentAssignments(assignments: Assignment[], today = new Date()): Assignment[] {
  return assignments.filter(a =>
    isWithinInterval(today, {
      start: new Date(a.start_date),
      end: new Date(a.end_date),
    })
  )
}

/**
 * Agrupa asignaciones por persona.
 */
export function groupAssignmentsByPerson(assignments: Assignment[]): Record<string, Assignment[]> {
  return assignments.reduce((acc, assignment) => {
    const personId = assignment.person_id
    if (!acc[personId]) acc[personId] = []
    acc[personId].push(assignment)
    return acc
  }, {} as Record<string, Assignment[]>)
}
