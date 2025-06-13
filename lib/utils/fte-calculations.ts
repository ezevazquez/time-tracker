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