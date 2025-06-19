import type { Assignment } from '@/types/assignment'

/**
 * Convierte allocation (0.0-1.0) a FTE
 * @param allocation - Valor entre 0.0 y 1.0 representando el porcentaje de tiempo
 * @returns FTE equivalente (1.0 = 1 FTE completo)
 */
export function allocationToFTE(allocation: number): number {
  return allocation
}

/**
 * Convierte FTE a allocation (0.0-1.0)
 * @param fte - FTE (1.0 = 1 FTE completo)
 * @returns Allocation entre 0.0 y 1.0
 */
export function fteToAllocation(fte: number): number {
  return fte
}

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
 * Margen de tolerancia para sobreasignación
 */
export const OVERALLOCATION_TOLERANCE = 1.05;

/**
 * Verifica si una asignación está sobreasignada basada en FTE
 */
export function isOverallocated(totalFte: number): boolean {
  return totalFte > OVERALLOCATION_TOLERANCE;
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
  if (isOverallocated(totalFte)) {
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
 * Calcula el FTE total asignado a un proyecto basado en sus asignaciones
 * @param assignments - Array de asignaciones del proyecto
 * @returns FTE total asignado
 */
export function calculateProjectAssignedFTE(assignments: Assignment[]): number {
  return assignments.reduce((total, assignment) => {
    // Calcular la duración en días
    const startDate = new Date(assignment.start_date)
    const endDate = new Date(assignment.end_date)
    const durationInDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    
    // Convertir a FTE mensual (30.44 días por mes)
    const daysPerMonth = 30.44
    const fteMonths = (assignment.allocation * durationInDays) / daysPerMonth
    
    return total + fteMonths
  }, 0)
}

/**
 * Calcula el porcentaje de utilización de FTE para un proyecto
 * @param assignedFTE - FTE asignado
 * @param totalFTE - FTE total del proyecto
 * @returns Porcentaje de utilización (0-100+)
 */
export function calculateFTEUtilization(assignedFTE: number, totalFTE: number): number {
  if (totalFTE === 0) return 0
  return Math.round((assignedFTE / totalFTE) * 100)
}

/**
 * Determina si un proyecto está sobre-asignado
 * @param assignedFTE - FTE asignado
 * @param totalFTE - FTE total del proyecto
 * @returns true si está sobre-asignado
 */
export function isProjectOverallocated(assignedFTE: number, totalFTE: number): boolean {
  return assignedFTE > totalFTE && totalFTE > 0
}

/**
 * Calcula el porcentaje de sobre-asignación
 * @param assignedFTE - FTE asignado
 * @param totalFTE - FTE total del proyecto
 * @returns Porcentaje de sobre-asignación (0 si no está sobre-asignado)
 */
export function calculateOverallocationPercentage(assignedFTE: number, totalFTE: number): number {
  if (!isProjectOverallocated(assignedFTE, totalFTE)) return 0
  return Math.round(((assignedFTE - totalFTE) / totalFTE) * 100)
} 