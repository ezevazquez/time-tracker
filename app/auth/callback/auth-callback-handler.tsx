'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackHandler() {
  const router = useRouter()

  useEffect(() => {
    const hash = window.location.hash
    const params = new URLSearchParams(hash.substring(1)) // quita el #

    const access_token = params.get('access_token')
    const refresh_token = params.get('refresh_token')

    console.log('🔑 Access Token:', access_token)
    console.log('🔄 Refresh Token:', refresh_token)

    if (!access_token || !refresh_token) {
      router.replace('/auth/auth-code-error')
      return
    }

    supabase.auth.setSession({ access_token, refresh_token })
      .then(({ error }) => {
        if (error) {
          console.error('❌ Failed to set session:', error.message)
          router.replace('/auth/auth-code-error')
        } else {
          router.replace('/')
        }
      })
  }, [router])

  return <p className="p-6">Processing login...</p>
}
