"use client"

import type React from "react"

import { Auth0Provider } from "@auth0/auth0-react"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN || ""
  const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || ""
  const redirectUri = typeof window !== "undefined"
  ? `${window.location.origin}/auth/callback`
  : ""


  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: redirectUri,
      }}
    >
      {children}
    </Auth0Provider>
  )
}

