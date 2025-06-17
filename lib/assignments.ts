import { eachDayOfInterval, isWithinInterval } from 'date-fns'
import type { Assignment } from '@/types/assignment'

/**
 * Convierte un porcentaje (0-100) a FTE (0.0-1.0)
 */
export function percentageToFte(percentage: number): number {
  return percentage / 100
}

/**
 * Convierte FTE (0.0-1.0) a porcentaje (0-100)
 */
export function fteToPercentage(fte: number): number {
  return Math.round(fte * 100)
}

/**
 * Convierte FTE a formato de base de datos (decimal)
 */
export function toDbAllocation(percentage: number): number {
  return percentageToFte(percentage)
}

/**
 * Convierte formato de base de datos (decimal) a porcentaje
 */
export function fromDbAllocation(dbAllocation: number): number {
  return fteToPercentage(dbAllocation)
}

/**
 * Verifica si una asignación está sobreasignada basada en FTE
 */
export function isOverallocated(totalFte: number): boolean {
  return totalFte > 1.0
}

/**
 * Obtiene el estado de utilización basado en FTE
 */
export function getUtilizationStatus(totalFte: number): {
  status: 'overallocated' | 'optimal' | 'underutilized'
  percentage: number
  color: string
  bgColor: string
} {
  const percentage = fteToPercentage(totalFte)
  
  if (totalFte > 1.0) {
    return {
      status: 'overallocated',
      percentage,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  } else if (totalFte < 0.5) {
    return {
      status: 'underutilized',
      percentage,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    }
  } else {
    return {
      status: 'optimal',
      percentage,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    }
  }
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

/**
 * Normaliza una fecha para que sea exactamente medianoche en la zona horaria local
 * Esto evita problemas de zona horaria al convertir a string
 */
export function normalizeDate(date: Date): Date {
  const year = date.getFullYear()
  const month = date.getMonth()
  const day = date.getDate()
  
  // Crear una nueva fecha a medianoche en la zona horaria local
  return new Date(year, month, day, 0, 0, 0, 0)
}

/**
 * Convierte una fecha a formato ISO sin zona horaria para evitar problemas de conversión
 * Usa una aproximación más robusta para evitar problemas de zona horaria
 */
export function toISODateString(date: Date): string {
  // Normalizar la fecha primero
  const normalizedDate = normalizeDate(date)
  
  // Extraer año, mes y día directamente sin considerar zona horaria
  const year = normalizedDate.getFullYear()
  const month = String(normalizedDate.getMonth() + 1).padStart(2, '0')
  const day = String(normalizedDate.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Función de debug para verificar fechas
 */
export function debugDate(date: Date | string, label: string = 'Date') {
  const parsed = typeof date === 'string' ? new Date(date) : date
  return {
    original: date,
    parsed: parsed,
    iso: parsed.toISOString(),
    local: parsed.toLocaleDateString(),
    timestamp: parsed.getTime()
  }
}

/**
 * Crea una fecha local sin problemas de zona horaria
 */
export function createLocalDate(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day)
}

/**
 * Convierte una fecha de string a Date local
 */
export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  return createLocalDate(year, month, day)
}

/**
 * Crea una fecha local sin problemas de zona horaria usando UTC
 */
export function createUTCDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day))
}

/**
 * Convierte una fecha a formato ISO usando UTC para evitar problemas de zona horaria
 */
export function toISODateStringUTC(date: Date): string {
  const utcDate = createUTCDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
  return utcDate.toISOString().split('T')[0]
}

/**
 * Parsea una fecha desde string sin problemas de zona horaria
 * Cuando Supabase devuelve "2025-06-09", esta función la convierte correctamente
 */
export function parseDateFromString(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  // Crear fecha en zona horaria local para evitar conversiones UTC
  return new Date(year, month - 1, day)
}
