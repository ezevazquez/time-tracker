"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function ClientRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const hasOAuthParams = searchParams.has("code") && searchParams.has("state")
    if (!hasOAuthParams) {
      router.replace("/dashboard")
    }
  }, [searchParams, router])

  return null
}
