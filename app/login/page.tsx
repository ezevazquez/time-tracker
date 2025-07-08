'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { LoginForm } from '@/components/login-form'

export default function Page() {
  const router = useRouter()

  useEffect(() => {
  const checkSession = async () => {
    const { data } = await supabase.auth.getSession()
    const accessToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('sb-access-token='))

    if (!accessToken && data.session) {
      await supabase.auth.signOut() 
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      router.push('/')
    }
  }

  checkSession()
}, [router])

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  )
}
