import { eachDayOfInterval, isWithinInterval } from 'date-fns'
import type { Assignment } from './supabase'

// Valores permitidos (centralizados)
export const ALLOCATION_VALUES = [0.25, 0.5, 0.75, 1]

// Conversión: porcentaje → decimal (ej: 50 → 0.5)
export const toDbAllocation = (percent: number): number => percent / 100

// Conversión: decimal → porcentaje (ej: 0.5 → 50)
export const toUiAllocation = (decimal: number): number => decimal * 100

// Verifica si una nueva asignación haría superar el 100% en algún día
export function willExceedDailyAllocation(
  existingAssignments: Assignment[],
  range: { start: Date; end: Date },
  newAllocation: number
): boolean {
  const days = eachDayOfInterval(range)

  return days.some(day => {
    const total = existingAssignments
      .filter(a =>
        isWithinInterval(day, {
          start: new Date(a.start_date),
          end: new Date(a.end_date),
        })
      )
      .reduce((sum, a) => sum + a.allocation, 0)

    return total + newAllocation > 1
  })
}

export const ASSIGNMENT_STATUS_VALUES = ['active', 'ended'] as const
export type AssignmentStatus = (typeof ASSIGNMENT_STATUS_VALUES)[number]
