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

  const createAssignment = async (assignment: Omit<Assignment, 'id' | 'created_at' | 'updated_at'>) => {
    const newAssignment = await assignmentsService.create(assignment)
    setAssignments(prev => [...prev, newAssignment])
    return newAssignment
  }

  const updateAssignment = async (id: string, updates: Partial<Assignment>) => {
    const updated = await assignmentsService.update(id, updates)
    setAssignments(prev => prev.map(a => (a.id === id ? updated : a)))
    return updated
  }

  const deleteAssignment = async (id: string) => {
    await assignmentsService.delete(id)
    setAssignments(prev => prev.filter(a => a.id !== id))
  }

  return { assignments, loading, error, createAssignment, updateAssignment, deleteAssignment }
}
