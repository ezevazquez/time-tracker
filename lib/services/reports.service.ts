import { supabase } from '@/lib/supabase/client'

export async function fetchOcupationReport(initial: string, final: string) {
  // First, let's try the RPC function
  const { data: rpcData, error: rpcError } = await supabase.rpc('ocupation_report_between', {
    initial_date: initial,
    final_date: final,
  })

  if (!rpcError && rpcData) {
    console.log('RPC data:', rpcData)
    
    // RPC doesn't include profile, so we need to fetch it separately
    const personIds = [...new Set(rpcData.map((item: any) => item.person_id))]
    
    if (personIds.length > 0) {
      const { data: peopleData, error: peopleError } = await supabase
        .from('people')
        .select('id, profile')
        .in('id', personIds)
      
      if (!peopleError && peopleData) {
        // Create a map of person_id to profile
        const profileMap = peopleData.reduce((acc, person) => {
          acc[person.id] = person.profile
          return acc
        }, {} as Record<string, string>)
        
        // Enhance RPC data with profile information
        const enhancedData = rpcData.map((item: any) => ({
          ...item,
          person_profile: profileMap[item.person_id] || 'Sin perfil'
        }))
        
        console.log('Enhanced RPC data with profiles:', enhancedData)
        return enhancedData
      }
    }
    
    // If we can't get profiles, return RPC data as is
    return rpcData
  }

  // If RPC fails, fallback to direct query
  console.log('RPC failed, using direct query. Error:', rpcError)
  
  const { data, error } = await supabase
    .from('assignments')
    .select(`
      id,
      start_date,
      end_date,
      allocation,
      assigned_role,
      people (
        first_name,
        last_name,
        profile,
        status
      ),
      projects (
        name,
        status
      )
    `)
    .gte('start_date', initial)
    .lte('end_date', final)
    .order('start_date', { ascending: true })

  if (error) {
    console.error('Error fetching report:', error)
    return []
  }

  console.log('Raw data from Supabase:', data)

  // Transform the data to match the expected format
  const transformedData = data?.map(item => {
    const person = Array.isArray(item.people) ? item.people[0] : item.people
    const project = Array.isArray(item.projects) ? item.projects[0] : item.projects
    
    console.log('Person data:', person)
    console.log('Project data:', project)
    
    return {
      assignment_id: item.id,
      person_first_name: person?.first_name || '',
      person_last_name: person?.last_name || '',
      person_profile: person?.profile || 'Sin perfil',
      person_status: person?.status || '',
      project_name: project?.name || '',
      project_status: project?.status || '',
      assignment_start_date: item.start_date,
      assignment_end_date: item.end_date,
      allocation: item.allocation || 0,
      assigned_role: item.assigned_role || ''
    }
  }) || []

  console.log('Transformed data:', transformedData)
  return transformedData
}
