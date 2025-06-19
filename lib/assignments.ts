import { eachDayOfInterval, isWithinInterval } from 'date-fns'
import type { Assignment } from '@/types/assignment'

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

/**
 * Proper sticky positioning - only sticky when bar is partially scrolled
 */
export function calculateStickyPosition(
  barLeft: number,
  barWidth: number,
  scrollLeft: number,
  sidebarWidth: number,
): {
  labelLeft: number
  labelMaxWidth: number
  isSticky: boolean
} {
  const barRight = barLeft + barWidth
  const STICKY_MARGIN = 240; // px, margen de anticipación para sticky
  const viewportLeft = scrollLeft + sidebarWidth - STICKY_MARGIN
  const STICKY_LEFT_POSITION = 1 // Small offset from sidebar edge for visual separation

  // Default position - label starts at the left edge of the bar (position 0)
  let labelLeft = 0
  let labelMaxWidth = barWidth
  let isSticky = false

  // Only apply sticky positioning when the bar is PARTIALLY scrolled out of view
  if (barLeft < viewportLeft && barRight > viewportLeft) {
    // The bar's left edge has scrolled past the viewport left edge
    // BUT the bar is still partially visible
    isSticky = true

    // Position the label at a fixed distance from the sidebar edge
    labelLeft = viewportLeft - barLeft + STICKY_LEFT_POSITION

    // Calculate available width for the label (from sticky position to end of bar)
    const availableWidth = barRight - (viewportLeft + STICKY_LEFT_POSITION)
    labelMaxWidth = Math.max(availableWidth, 120) // Minimum width for readability

    // Ensure we don't exceed the bar's total width
    if (labelLeft + labelMaxWidth > barWidth) {
      labelMaxWidth = barWidth - labelLeft
    }

    // Ensure labelLeft doesn't go negative
    labelLeft = Math.max(0, labelLeft)
  } else {
    // Bar is fully visible or completely out of view - no sticky needed
    isSticky = false
    labelLeft = 0
    labelMaxWidth = barWidth
  }

  // Ensure minimum width for readability
  labelMaxWidth = Math.max(labelMaxWidth, 100)

  return {
    labelLeft,
    labelMaxWidth,
    isSticky,
  }
}

/**
 * Calculate row layout for consistent bar heights
 */
export function calculateRowLayout(assignmentCount: number, baseRowHeight: number) {
  const CONSISTENT_BAR_HEIGHT = 32 // Fixed height for all bars
  const MIN_ROW_HEIGHT = 100
  const VERTICAL_PADDING = 8
  const BAR_SPACING = 4

  // Calculate required row height based on number of assignments
  const maxVisibleAssignments = Math.min(assignmentCount, 4)
  const requiredHeight =
    CONSISTENT_BAR_HEIGHT * maxVisibleAssignments + BAR_SPACING * (maxVisibleAssignments - 1) + VERTICAL_PADDING * 2

  const rowHeight = Math.max(MIN_ROW_HEIGHT, requiredHeight)
  const startY = VERTICAL_PADDING

  return {
    rowHeight,
    barHeight: CONSISTENT_BAR_HEIGHT,
    barSpacing: BAR_SPACING,
    startY,
    maxVisibleAssignments,
  }
}

/**
 * Generate a consistent color based on a string (project name)
 */
export function stringToColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }

  // Resource Guru inspired color palette
  const colors = [
    "#4F46E5", // indigo
    "#059669", // emerald
    "#DC2626", // red
    "#7C3AED", // violet
    "#DB2777", // pink
    "#0891B2", // cyan
    "#CA8A04", // yellow
    "#EA580C", // orange
    "#16A34A", // green
    "#9333EA", // purple
  ]

  return colors[Math.abs(hash) % colors.length]
}
