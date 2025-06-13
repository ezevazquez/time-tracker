'use client'

import { useState, useCallback } from 'react'
import { assignmentsService } from '@/lib/services/assignments.service'
import { toISODateString } from '@/lib/assignments'
import { fteToPercentage } from '@/lib/assignments'

interface ValidationResult {
  isValid: boolean
  message: string
  isOverallocated?: boolean
  totalAllocation?: number
  overallocatedDays?: any[]
}

export function useAssignmentValidation() {
  const [isValidating, setIsValidating] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const validateAssignment = useCallback(
    async (
      assignmentId: string | null,
      personId: string,
      startDate: string,
      endDate: string,
      allocation: number
    ): Promise<ValidationResult> => {
      if (!personId || !startDate || !endDate) {
        return { isValid: false, message: 'Faltan datos requeridos' }
      }

      try {
        const result = await assignmentsService.checkAssignmentOverallocation(
          assignmentId,
          personId,
          startDate,
          endDate,
          allocation
        )

        if (result.isOverallocated) {
          const totalAllocation = result.totalAllocation
          const percentage = Math.round(totalAllocation * 100)
          
          return {
            isValid: false,
            message: `Sobreasignación detectada: ${percentage}% (máximo 100%)`,
            isOverallocated: true,
            totalAllocation,
            overallocatedDays: result.overallocatedDays
          }
        }

        return { isValid: true, message: 'Asignación válida' }
      } catch (error) {
        return {
          isValid: false,
          message: `Error de validación: ${error instanceof Error ? error.message : 'Error desconocido'}`
        }
      }
    },
    []
  )

  const getOverallocationMessage = (result: ValidationResult): string => {
    if (!result.isOverallocated) {
      return 'No hay sobreasignación'
    }

    const totalAllocation = result.totalAllocation || 0
    const percentage = Math.round(totalAllocation * 100)
    const days = result.overallocatedDays?.length || 0

    return `Sobreasignación detectada: ${percentage}% en ${days} día(s)`
  }

  return {
    validateAssignment,
    getOverallocationMessage,
    isValidating,
    validationError
  }
} 