'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Home, Calendar, Users, Building2, Briefcase, Menu, X } from 'lucide-react'
import { cn } from '@/utils/classnames'
import { Button } from '@/components/ui/button'

export function MainNav() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isHomeActive = pathname === '/'
  const isAssignmentsActive = pathname === '/assignments' || pathname?.startsWith('/assignments')
  const isProjectsActive = pathname === '/projects' || pathname?.startsWith('/projects')
  const isClientsActive = pathname === '/clients' || pathname?.startsWith('/clients')
  const isPeopleActive = pathname === '/people' || pathname?.startsWith('/people')

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center space-x-1">
        {/* Home */}
        <Link
          href="/"
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:bg-gray-100',
            isHomeActive
              ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
              : 'text-gray-700 hover:text-gray-900'
          )}
        >
          <Home className="h-4 w-4" />
          Home
        </Link>

        {/* Asignaciones */}
        <Link
          href="/assignments"
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:bg-gray-100',
            isAssignmentsActive
              ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
              : 'text-gray-700 hover:text-gray-900'
          )}
        >
          <Calendar className="h-4 w-4" />
          Asignaciones
        </Link>

        {/* Proyectos */}
        <Link
          href="/projects"
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:bg-gray-100',
            isProjectsActive
              ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
              : 'text-gray-700 hover:text-gray-900'
          )}
        >
          <Briefcase className="h-4 w-4" />
          Proyectos
        </Link>

        {/* Clientes */}
        <Link
          href="/clients"
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:bg-gray-100',
            isClientsActive
              ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
              : 'text-gray-700 hover:text-gray-900'
          )}
        >
          <Building2 className="h-4 w-4" />
          Clientes
        </Link>

        {/* Personas */}
        <Link
          href="/people"
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:bg-gray-100',
            isPeopleActive
              ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
              : 'text-gray-700 hover:text-gray-900'
          )}
        >
          <Users className="h-4 w-4" />
          Equipo
        </Link>
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed top-[60px] left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-[9999]">
            <div className="px-4 py-3 space-y-1">
              {/* Home */}
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors',
                  isHomeActive
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                )}
              >
                <Home className="h-4 w-4" />
                Home
              </Link>

              {/* Asignaciones */}
              <Link
                href="/assignments"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors',
                  isAssignmentsActive
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                )}
              >
                <Calendar className="h-4 w-4" />
                Asignaciones
              </Link>

              {/* Proyectos */}
              <Link
                href="/projects"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors',
                  isProjectsActive
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                )}
              >
                <Briefcase className="h-4 w-4" />
                Proyectos
              </Link>

              {/* Clientes */}
              <Link
                href="/clients"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors',
                  isClientsActive
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                )}
              >
                <Building2 className="h-4 w-4" />
                Clientes
              </Link>

              {/* Personas */}
              <Link
                href="/people"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors',
                  isPeopleActive
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                )}
              >
                <Users className="h-4 w-4" />
                Equipo
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
