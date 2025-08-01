'use client'

import { Calendar, TrendingUp, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useState } from 'react'
import { AssignmentModal } from '@/components/assignment-modal'
import { useAssignments } from '@/hooks/use-assignments'

export function DashboardHeader() {
  const currentDate = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const formattedDate = currentDate.charAt(0).toUpperCase() + currentDate.slice(1).toLowerCase()

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const { createAssignment } = useAssignments()

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <p className="text-gray-600">{formattedDate}</p>
      </div>

      <div className="flex gap-3">
        <Link href="/assignments">
          <Button variant="outline" size="sm" data-test="view-timeline-button">
            <Calendar className="h-4 w-4 mr-2" />
            Ver Timeline
          </Button>
        </Link>
        <Button
          size="sm"
          onClick={() => setCreateModalOpen(true)}
          data-test="new-assignment-button"
        >
          <Plus className="h-4 w-4 mr-2" />
          Crear asignación
        </Button>
        <AssignmentModal
          open={createModalOpen}
          mode="new"
          onSave={async data => {
            await createAssignment(data)
            setCreateModalOpen(false)
          }}
          onCancel={() => setCreateModalOpen(false)}
        />
      </div>
    </div>
  )
}
