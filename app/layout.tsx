'use client'

import { useEffect } from 'react'
import '@/app/globals.css'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { Header } from '@/components/header'
// import { Analytics } from "@vercel/analytics/next"

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  
  useEffect(() => {
    try {
    //  we force the document to be in light mode
      document.documentElement.classList.remove('dark')
    } catch (e) {
      // ignoring errors
    }
  }, [])

  return (
    <html lang="es" suppressHydrationWarning>
      <head></head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <div className="flex flex-col min-h-screen">
            {/* Header */}
            <Header />
            <main className="flex-1 min-h-0">
              {children}
              {/* <Analytics /> */}
            </main>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
