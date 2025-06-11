import { supabase } from './client'

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  return !!url && !!key && (url.includes('.supabase.co') || url.includes('localhost'))
}

export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('people').select('id', { count: 'exact', head: true })
    return error ? { success: false, error: error.message } : { success: true, count: data }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
