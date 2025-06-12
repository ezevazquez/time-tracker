import { supabase } from '@/lib/supabase/client'
import type { Person } from '@/types/people'

export const peopleService = {
  async getAll(): Promise<Person[]> {
    const { data, error } = await supabase.from('people').select('*').order('name')
    if (error) throw new Error(`Error fetching people: ${error.message}`)
    return data ?? []
  },

  async getById(id: string): Promise<Person | null> {
    const { data, error } = await supabase.from('people').select('*').eq('id', id).single()
    if (error) throw error
    return data
  },

  async create(person: Omit<Person, 'id' | 'created_at' | 'updated_at'>): Promise<Person> {
    const { data, error } = await supabase.from('people').insert(person).select().single()
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<Person>): Promise<Person> {
    const { data, error } = await supabase.from('people').update(updates).eq('id', id).select().single()
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('people').delete().eq('id', id)
    if (error) throw error
  },
}
