"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AssignmentBar } from "./assignment-bar"
import { isWeekend, isSameDay, differenceInDays, startOfMonth, endOfMonth } from "date-fns"
import type { Person } from "@/types/people"
import type { Project } from "@/types/project"
import type { Assignment } from "@/types/assignment"
import { getDisplayName, getInitials } from "@/lib/people"
import { calculateRowLayout, parseDateFromString } from "@/lib/assignments"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface PersonRowProps {
  person: Person
  assignments: Assignment[]
  projects: Project[]
  days: Date[]
  visibleDateRange: { start: Date; end: Date }
  dayWidth: number
  sidebarWidth: number
  baseRowHeight: number
  totalWidth: number
  scrollLeft: number
  today: Date
  isEvenRow: boolean
  onDeleteAssignment?: (assignmentId: string) => void
}

export function PersonRow({
  person,
  assignments,
  projects,
  days,
  visibleDateRange,
  dayWidth,
  sidebarWidth,
  baseRowHeight,
  totalWidth,
  scrollLeft,
  today,
  isEvenRow,
  onDeleteAssignment,
}: PersonRowProps) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [assignmentToDelete, setAssignmentToDelete] = useState<Assignment | null>(null)

  const handleRequestDelete = (assignment: Assignment) => {
    setAssignmentToDelete(assignment)
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = () => {
    if (assignmentToDelete && onDeleteAssignment) {
      onDeleteAssignment(assignmentToDelete.id)
    }
    setDeleteModalOpen(false)
    setAssignmentToDelete(null)
  }

  // Calculate bar position and width
  const calculateBarDimensions = (assignment: Assignment) => {
    const startDate = parseDateFromString(assignment.start_date)
    const endDate = parseDateFromString(assignment.end_date)
    const visibleStart = startOfMonth(visibleDateRange.start)

    // Clamp dates to visible range boundaries
    const clampedStart = startDate < visibleStart ? visibleStart : startDate
    const clampedEnd = endDate > endOfMonth(visibleDateRange.end) ? endOfMonth(visibleDateRange.end) : endDate

    const startDayIndex = differenceInDays(clampedStart, visibleStart)
    const duration = differenceInDays(clampedEnd, clampedStart) + 1

    return {
      left: startDayIndex * dayWidth,
      width: Math.max(duration * dayWidth, 80), // Minimum width for better label visibility
      startDate,
      endDate,
      clampedStart,
      clampedEnd,
    }
  }

  // Sort assignments by start date for better stacking
  const sortedAssignments = [...assignments].sort((a, b) => {
    const dateA = parseDateFromString(a.start_date)
    const dateB = parseDateFromString(b.start_date)
    return dateA.getTime() - dateB.getTime()
  })

  // Calcular el rango de días actualmente visible en el viewport horizontal
  const VISIBILITY_MARGIN = 150; // píxeles
  let firstVisibleDayIdx = 0
  let lastVisibleDayIdx = days.length - 1
  if (typeof window !== 'undefined') {
    // El ancho visible del timeline (sin la sidebar)
    const timelineViewportWidth = document.querySelector('.resource-timeline-viewport')?.clientWidth || 800
    const viewportLeft = scrollLeft
    const viewportRight = scrollLeft + timelineViewportWidth
    // Calcular el índice del primer y último día visible
    firstVisibleDayIdx = Math.max(0, Math.floor((viewportLeft - sidebarWidth - VISIBILITY_MARGIN) / dayWidth))
    lastVisibleDayIdx = Math.min(days.length - 1, Math.ceil((viewportRight - sidebarWidth + VISIBILITY_MARGIN) / dayWidth))
  }
  const visibleDays = days.slice(firstVisibleDayIdx, lastVisibleDayIdx + 1)

  // Calcular el máximo de asignaciones activas en cualquier día visible
  const maxAssignmentsInADay = visibleDays.reduce((max, day) => {
    const activeCount = sortedAssignments.filter(a => {
      const start = parseDateFromString(a.start_date)
      const end = parseDateFromString(a.end_date)
      return start <= day && end >= day
    }).length
    return Math.max(max, activeCount)
  }, 0)

  // Calculate row layout with consistent bar heights, usando el máximo de asignaciones activas en un día visible
  const layout = calculateRowLayout(maxAssignmentsInADay, baseRowHeight)

  return (
    <div
      className={`
        flex border-b border-gray-100 hover:bg-gray-50/30 transition-colors
        ${isEvenRow ? "bg-white" : "bg-gray-50/20"}
      `}
      style={{ height: `${layout.rowHeight}px` }}
    >
      {/* Sidebar */}
      <div
        className="sticky left-0 z-20 bg-white border-r border-gray-200 flex items-center"
        style={{ width: `${sidebarWidth}px` }}
      >
        <div className="p-4 flex items-center space-x-3 w-full">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="text-sm bg-gray-100 text-gray-600">{getInitials(person)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 truncate">{getDisplayName(person)}</div>
            <div className="text-sm text-gray-500 truncate">{person.profile}</div>
            <div className="text-xs text-gray-400">{person.type}</div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative flex-1" style={{ width: `${totalWidth}px` }}>
        {/* Background days */}
        {days.map((day, i) => (
          <div
            key={i}
            className={`
              absolute top-0 bottom-0 border-r border-gray-50
              ${isWeekend(day) ? "bg-gray-50/50" : ""}
              ${isSameDay(day, today) ? "bg-blue-50/30" : ""}
            `}
            style={{
              left: `${i * dayWidth}px`,
              width: `${dayWidth}px`,
            }}
          />
        ))}

        {/* Assignment bars with consistent heights */}
        <TooltipProvider>
          {sortedAssignments.slice(0, layout.maxVisibleAssignments).map((assignment, idx) => {
            const project = projects.find((p) => p.id === assignment.project_id)
            if (!project) return null

            const dimensions = calculateBarDimensions(assignment)
            const top = layout.startY + idx * (layout.barHeight + layout.barSpacing)

            return (
              <AssignmentBar
                key={assignment.id}
                assignment={assignment}
                project={project}
                dimensions={dimensions}
                top={top}
                height={layout.barHeight}
                scrollLeft={scrollLeft}
                sidebarWidth={sidebarWidth}
                zIndex={10 - idx} // Higher z-index for earlier assignments
                onRequestDelete={() => handleRequestDelete(assignment)}
              />
            )
          })}
        </TooltipProvider>

        {/* Overflow indicator for more than 4 assignments */}
        {sortedAssignments.length > layout.maxVisibleAssignments && (
          <div
            className="absolute right-2 bg-gray-600 text-white text-xs px-2 py-1 rounded-full shadow-md z-20"
            style={{
              top: `${layout.rowHeight - 25}px`,
            }}
          >
            +{sortedAssignments.length - layout.maxVisibleAssignments} más
          </div>
        )}

        {/* Today marker */}
        {days.some((day) => isSameDay(day, today)) && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-10 pointer-events-none opacity-70"
            style={{
              left: `${differenceInDays(today, startOfMonth(visibleDateRange.start)) * dayWidth + dayWidth / 2}px`,
            }}
          />
        )}
      </div>

      {/* Modal de confirmación de borrado */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar asignación</DialogTitle>
          </DialogHeader>
          <p className="mb-4">¿Seguro que deseas eliminar esta asignación? Esta acción no se puede deshacer.</p>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleConfirmDelete}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 