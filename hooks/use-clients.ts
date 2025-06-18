'use client'

import { useState, useEffect } from 'react'
import { clientsService } from '@/lib/services/clients.service'
import { projectsService } from '@/lib/services/projects.service'
import type { Client } from '@/types/client'

export function useClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    clientsService.getAll()
      .then(setClients)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const createClient = async (client: Omit<Client, 'id' | 'created_at'>) => {
    const newClient = await clientsService.create(client)
    setClients(prev => [...prev, newClient])
    return newClient
  }

  const updateClient = async (id: string, updates: Partial<Client>) => {
    const updated = await clientsService.update(id, updates)
    setClients(prev => prev.map(c => (c.id === id ? updated : c)))
    return updated
  }

  const deleteClient = async (id: string) => {
    // Validar que el cliente no tenga proyectos asociados
    const projects = await projectsService.getAll()
    const hasProjects = projects.some(p => p.client_id === id)
    if (hasProjects) {
      throw new Error('No se puede borrar el cliente porque tiene proyectos asociados.')
    }
    await clientsService.delete(id)
    setClients(prev => prev.filter(c => c.id !== id))
  }

  return { clients, loading, error, createClient, updateClient, deleteClient }
}
