'use client'

import { useEffect, useState } from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import Link from "next/link"
import { Database, Wifi, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { isSupabaseConfigured, supabase } from "@/lib/supabase"
import Script from "next/script"
import { MainNav } from "@/components/main-nav"
import { LogoutButton } from "@/components/logout-button"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [sessionExists, setSessionExists] = useState(false)
  const supabaseConfigured = isSupabaseConfigured()

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      setSessionExists(!!data.session)
    }
    checkSession()
  }, [])

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <Script id="theme-script" strategy="beforeInteractive">
          {`
            try {
              if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark')
              } else {
                document.documentElement.classList.remove('dark')
              }
            } catch (_) {}
          `}
        </Script>
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <div className="flex flex-col min-h-screen">
            {/* Header */}
            {sessionExists && (
              <header className="border-b bg-background sticky top-0 z-30">
                <div className="container mx-auto px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <h1 className="text-2xl font-bold text-primary">
                        <Link href="/">Revolt</Link>
                      </h1>
                      <MainNav />
                    </div>
                    <div className="flex items-center space-x-2">
                      <LogoutButton />
                    </div>
                  </div>
                </div>
              </header>
            )}

            {children}
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
