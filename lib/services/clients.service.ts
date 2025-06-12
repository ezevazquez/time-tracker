import { supabase } from '@/lib/supabase/client'
import type { Client } from '@/types/client'

export const clientsService = {
  async getAll(): Promise<Client[]> {
    const { data, error } = await supabase.from('clients').select('*').order('name')
    if (error) throw new Error(`Error fetching clients: ${error.message}`)
    return data ?? []
  },

  async getById(id: string): Promise<Client | null> {
    const { data, error } = await supabase.from('clients').select('*').eq('id', id).single()
    if (error) throw error
    return data
  },

  async create(client: Omit<Client, 'id' | 'created_at'>): Promise<Client> {
    const { data, error } = await supabase.from('clients').insert(client).select().single()
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<Client>): Promise<Client> {
    const { data, error } = await supabase.from('clients').update(updates).eq('id', id).select().single()
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('clients').delete().eq('id', id)
    if (error) throw error
  },
}
