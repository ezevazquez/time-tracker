"use client"

import { useEffect } from "react"
import { useAuth0 } from "@auth0/auth0-react"
import { useRouter } from "next/navigation"

export default function AuthCallback() {
  const { handleRedirectCallback, isLoading, isAuthenticated } = useAuth0()
  const router = useRouter()

  useEffect(() => {
    const run = async () => {
      try {
        await handleRedirectCallback()
      } catch (error) {
        console.error("Error handling redirect callback:", error)
      }
    }
    run()
  }, [handleRedirectCallback])

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard")
    }
  }, [isLoading, isAuthenticated, router])

  return (
    <div className="flex h-screen w-full items-center justify-center">
      Finalizing login...
    </div>
  )
}
