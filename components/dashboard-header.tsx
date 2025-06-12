'use client'

import { Calendar, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function DashboardHeader() {
  const currentDate = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const formattedDate = currentDate.charAt(0).toUpperCase() + currentDate.slice(1).toLowerCase()

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <p className="text-gray-600">{formattedDate}</p>
      </div>

      <div className="flex gap-3">
        <Link href="/assignments">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Ver Timeline
          </Button>
        </Link>
        <Link href="/assignments/new">
          <Button size="sm">
            <TrendingUp className="h-4 w-4 mr-2" />
            Nueva Asignación
          </Button>
        </Link>
      </div>
    </div>
  )
}
