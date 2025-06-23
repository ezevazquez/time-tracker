'use client'

import { useState, useEffect } from 'react'
import { assignmentsService } from '@/lib/services/assignments.service'
import type { Assignment, AssignmentWithRelations } from '@/types/assignment'

export function useAssignments() {
  const [assignments, setAssignments] = useState<AssignmentWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    assignmentsService.getAll()
      .then(setAssignments)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const refreshAssignments = async () => {
    setLoading(true)
    try {
      const data = await assignmentsService.getAll()
      setAssignments(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const createAssignment = async (assignment: Omit<Assignment, 'id' | 'created_at' | 'updated_at'>) => {
    await assignmentsService.create(assignment)
    await refreshAssignments()
  }

  const updateAssignment = async (id: string, updates: Partial<Assignment>) => {
    const updated = await assignmentsService.update(id, updates)
    setAssignments(prev => prev.map(a => a.id === id ? { ...a, ...updated } : a))
  }

  const deleteAssignment = async (id: string) => {
    await assignmentsService.delete(id)
    await refreshAssignments()
  }

  return { assignments, loading, error, createAssignment, updateAssignment, deleteAssignment }
}
