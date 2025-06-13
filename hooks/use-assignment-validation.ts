'use client'

import { useState } from 'react'
import { assignmentsService } from '@/lib/services/assignments.service'
import { format } from 'date-fns'
import { fteToPercentage } from '@/lib/assignments'

interface ValidationResult {
  isOverallocated: boolean
  overallocatedDates: Array<{ date: string; totalAllocation: number }>
  maxAllocation: number
  isValid: boolean
}

export function useAssignmentValidation() {
  const [isValidating, setIsValidating] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const validateAssignment = async (
    assignmentId: string | null,
    personId: string,
    startDate: Date,
    endDate: Date,
    allocation: number // This should be FTE (0.0-1.0)
  ): Promise<ValidationResult> => {
    console.log('🔍 validateAssignment llamado con:', {
      assignmentId,
      personId,
      startDate,
      endDate,
      allocation
    })

    setIsValidating(true)
    setValidationError(null)

    try {
      const formattedStartDate = format(startDate, 'yyyy-MM-dd')
      const formattedEndDate = format(endDate, 'yyyy-MM-dd')

      console.log('📞 Llamando a checkAssignmentOverallocation con:', {
        assignmentId,
        personId,
        formattedStartDate,
        formattedEndDate,
        allocation
      })

      const result = await assignmentsService.checkAssignmentOverallocation(
        assignmentId,
        personId,
        formattedStartDate,
        formattedEndDate,
        allocation
      )

      console.log('📊 Resultado de checkAssignmentOverallocation:', result)

      const maxAllocation = result.overallocatedDates.length > 0 
        ? Math.max(...result.overallocatedDates.map(d => d.totalAllocation))
        : allocation

      const validationResult = {
        isOverallocated: result.isOverallocated,
        overallocatedDates: result.overallocatedDates,
        maxAllocation,
        isValid: !result.isOverallocated
      }

      console.log('✅ Resultado final de validación:', validationResult)
      return validationResult
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error de validación'
      console.error('❌ Error en validateAssignment:', error)
      setValidationError(errorMessage)
      throw error
    } finally {
      setIsValidating(false)
    }
  }

  const getOverallocationMessage = (result: ValidationResult): string => {
    if (!result.isOverallocated) return ''

    const maxPercentage = fteToPercentage(result.maxAllocation)
    const dateCount = result.overallocatedDates.length

    if (dateCount === 1) {
      const date = new Date(result.overallocatedDates[0].date)
      return `Sobreasignación del ${maxPercentage}% el ${format(date, 'dd/MM/yyyy')}`
    } else {
      return `Sobreasignación del ${maxPercentage}% en ${dateCount} días del período`
    }
  }

  return {
    validateAssignment,
    getOverallocationMessage,
    isValidating,
    validationError
  }
} 