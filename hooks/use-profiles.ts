import { useEffect, useState } from 'react'
import { getProfiles, Profile } from '@/lib/services/profiles.service'

export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getProfiles()
      .then(setProfiles)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return { profiles, loading, error }
} 