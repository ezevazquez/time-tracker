import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import type { Metadata } from "next"
import Link from "next/link"
import { Database, Wifi } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { isSupabaseConfigured } from "@/lib/supabase"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ResourceFlow - Gestión de Recursos",
  description: "Aplicación para la gestión y asignación de recursos a proyectos",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const supabaseConfigured = isSupabaseConfigured()

  return (
    <html lang="es">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <div className="flex flex-col min-h-screen">
            {/* Header */}
            <header className="border-b bg-background sticky top-0 z-30">
              <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <h1 className="text-2xl font-bold text-primary">ResourceFlow</h1>
                    <nav className="hidden md:flex space-x-6">
                      <Link href="/" className="text-sm font-medium text-primary">
                        Dashboard
                      </Link>
                      <Link href="/people" className="text-sm font-medium text-muted-foreground hover:text-primary">
                        Personas
                      </Link>
                      <Link href="/projects" className="text-sm font-medium text-muted-foreground hover:text-primary">
                        Proyectos
                      </Link>
                      <Link
                        href="/assignments"
                        className="text-sm font-medium text-muted-foreground hover:text-primary"
                      >
                        Asignaciones
                      </Link>
                      <Link href="/settings" className="text-sm font-medium text-muted-foreground hover:text-primary">
                        Configuración
                      </Link>
                    </nav>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Data Source Indicator */}
                    <Badge variant="outline" className="hidden sm:flex">
                      {supabaseConfigured ? (
                        <>
                          <Wifi className="h-3 w-3 mr-1" />
                          Supabase
                        </>
                      ) : (
                        <>
                          <Database className="h-3 w-3 mr-1" />
                          Datos Demo
                        </>
                      )}
                    </Badge>
                    <Button asChild>
                      <Link href="/assignments/new">
                        <Plus className="h-4 w-4 mr-2" />
                        Nueva Asignación
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </header>

            {children}
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
