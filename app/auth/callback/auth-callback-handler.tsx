'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackHandler() {
  const router = useRouter()

  useEffect(() => {
    const hash = window.location.hash
    const queryParams = new URLSearchParams(window.location.search)
    const redirectedFrom = queryParams.get("redirectedFrom") || "/"
    const params = new URLSearchParams(hash.substring(1)) // quita el #
    const access_token = params.get('access_token')
    const refresh_token = params.get('refresh_token')

    if (!access_token || !refresh_token) {
      router.replace('/auth/auth-code-error')
      return
    }

    document.cookie = `sb-access-token=${access_token}; path=/;`
    supabase.auth.setSession({ access_token, refresh_token })
      .then(({ error }) => {
        if (error) {
          console.error('❌ Failed to set session:', error.message)
          router.replace('/auth/auth-code-error')
        } else {
          router.replace(redirectedFrom)
        }
      })
  }, [router])

  return <p className="p-6">Processing login...</p>
}
