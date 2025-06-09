import { supabase } from "./supabase"

export async function fetchOcupationReport(initial: string, final: string) {
  const { data, error } = await supabase.rpc('ocupation_report_between', {
    initial_date: initial,
    final_date: final,
  })
  if (error) {
    console.error("Error fetching report:", error)
    return []
  }
  return data
}
