'use client'

import { useState, useEffect } from 'react'
import { peopleService } from '@/lib/services/people.service'
import type { Person } from '@/types/people'

export function usePeople() {
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    peopleService.getAll()
      .then(setPeople)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const createPerson = async (person: Omit<Person, 'id' | 'created_at' | 'updated_at'>) => {
    const newPerson = await peopleService.create(person)
    setPeople(prev => [...prev, newPerson])
    return newPerson
  }

  const updatePerson = async (id: string, updates: Partial<Person>) => {
    const updated = await peopleService.update(id, updates)
    setPeople(prev => prev.map(p => (p.id === id ? updated : p)))
    return updated
  }

  const deletePerson = async (id: string) => {
    await peopleService.delete(id)
    setPeople(prev => prev.filter(p => p.id !== id))
  }

  return { people, loading, error, createPerson, updatePerson, deletePerson }
}
