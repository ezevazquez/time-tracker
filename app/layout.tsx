'use client'

import { useEffect, useState } from 'react'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import Script from 'next/script'

import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { MainNav } from '@/components/main-nav'
import { AccountDropdown } from '@/components/account-dropdown'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'

import '@/app/globals.css'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [sessionExists, setSessionExists] = useState(false)
  const supabaseConfigured = isSupabaseConfigured()

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      setSessionExists(!!data?.session)
    }

    if (supabaseConfigured) {
      checkSession()
    }
  }, [supabaseConfigured])

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
            {sessionExists && (
              <header className="bg-white dark:bg-zinc-900 shadow-sm sticky top-0 z-30">
                <div className="container mx-auto px-6 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                      <h1 className="text-xl font-semibold text-primary tracking-tight">
                        <Link href="/">Revolt</Link>
                      </h1>
                      <div className="h-6 w-px bg-border mx-4 hidden sm:block" />
                      <MainNav />
                    </div>
                    <div className="flex items-center space-x-4 ml-auto">
                      <AccountDropdown />
                    </div>
                  </div>
                </div>
              </header>
            )}

            <main className="flex-1">{children}</main>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
