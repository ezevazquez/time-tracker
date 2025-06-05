'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const exchangeCode = async () => {
      const code = searchParams.get('code')

      if (!code) {
        console.warn('No code in URL')
        router.replace('/auth/auth-code-error')
        return
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('Error exchanging code:', error.message)
        router.replace('/auth/auth-code-error')
        return
      }

      router.replace('/')
    }

    exchangeCode()
  }, [searchParams, router])

  return null
}
