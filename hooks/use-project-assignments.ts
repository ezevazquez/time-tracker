'use client'

import { useState, useCallback } from 'react'
import { useAssignments } from '@/hooks/use-assignments'
import type { Assignment } from '@/types/assignment'

export function useProjectAssignments() {
  const { assignments, createAssignment, updateAssignment, deleteAssignment } = useAssignments()
  const [auditLogVersion, setAuditLogVersion] = useState<number>(0)
  const [isUpdating, setIsUpdating] = useState<boolean>(false)

  const refreshAuditLog = useCallback(() => {
    setAuditLogVersion(prev => prev + 1)
  }, [])

  const createAssignmentWithAudit = useCallback(async (assignment: Omit<Assignment, 'id' | 'created_at' | 'updated_at'>) => {
    setIsUpdating(true)
    try {
      await createAssignment(assignment)
      // Use requestAnimationFrame to ensure the UI update happens after the database operation
      requestAnimationFrame(() => {
        setAuditLogVersion(prev => prev + 1)
        setIsUpdating(false)
      })
    } catch (error) {
      setIsUpdating(false)
      throw error
    }
  }, [createAssignment])

  const updateAssignmentWithAudit = useCallback(async (id: string, updates: Partial<Assignment>) => {
    setIsUpdating(true)
    try {
      await updateAssignment(id, updates)
      // Use requestAnimationFrame to ensure the UI update happens after the database operation
      requestAnimationFrame(() => {
        setAuditLogVersion(prev => prev + 1)
        setIsUpdating(false)
      })
    } catch (error) {
      setIsUpdating(false)
      throw error
    }
  }, [updateAssignment])

  const deleteAssignmentWithAudit = useCallback(async (id: string) => {
    setIsUpdating(true)
    try {
      await deleteAssignment(id)
      // Use requestAnimationFrame to ensure the UI update happens after the database operation
      requestAnimationFrame(() => {
        setAuditLogVersion(prev => prev + 1)
        setIsUpdating(false)
      })
    } catch (error) {
      setIsUpdating(false)
      throw error
    }
  }, [deleteAssignment])

  return {
    assignments,
    auditLogVersion,
    isUpdating,
    refreshAuditLog,
    createAssignment: createAssignmentWithAudit,
    updateAssignment: updateAssignmentWithAudit,
    deleteAssignment: deleteAssignmentWithAudit,
  }
}