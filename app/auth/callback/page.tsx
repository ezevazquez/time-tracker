'use client'

import { Suspense } from 'react'
import AuthCallbackHandler from './auth-callback-handler'

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<p className="text-center p-6">Signing in...</p>}>
      <AuthCallbackHandler />
    </Suspense>
  )
}
