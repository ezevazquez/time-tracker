'use client'

import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const handleLogin = async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'

    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline', // para obtener refresh_token
          prompt: 'consent',
        },
      },
    })
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Use your Google account to access the app</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full" onClick={handleLogin}>
            Login with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
