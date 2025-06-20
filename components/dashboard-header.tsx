'use client'

import { Calendar, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useState } from 'react'
import { AssignmentModal } from '@/components/assignment-modal'

export function DashboardHeader() {
  const currentDate = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const formattedDate = currentDate.charAt(0).toUpperCase() + currentDate.slice(1).toLowerCase()

  const [createModalOpen, setCreateModalOpen] = useState(false)

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
        <Button size="sm" onClick={() => setCreateModalOpen(true)}>
          <TrendingUp className="h-4 w-4 mr-2" />
          Nueva Asignación
        </Button>
        <AssignmentModal
          open={createModalOpen}
          mode="new"
          onSave={async (data) => {
            // Aquí deberías llamar a tu función de creación de asignación
            setCreateModalOpen(false)
          }}
          onCancel={() => setCreateModalOpen(false)}
        />
      </div>
    </div>
  )
}
