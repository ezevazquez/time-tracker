import { supabase } from '@/lib/supabase/client'

export interface Profile {
  id: string
  name: string
  description?: string
}

export async function getProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase.from('profiles').select('*').order('name', { ascending: true })
  if (error) throw error
  return data as Profile[]
}

export async function createProfile(profile: Omit<Profile, 'id'>): Promise<Profile> {
  const { data, error } = await supabase.from('profiles').insert([profile]).select().single()
  if (error) throw error
  return data as Profile
}

export async function updateProfile(id: string, profile: Partial<Omit<Profile, 'id'>>): Promise<Profile> {
  const { data, error } = await supabase.from('profiles').update(profile).eq('id', id).select().single()
  if (error) throw error
  return data as Profile
}

export async function deleteProfile(id: string): Promise<void> {
  const { error } = await supabase.from('profiles').delete().eq('id', id)
  if (error) throw error
} 