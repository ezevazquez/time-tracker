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
import { useState, useRef, useCallback } from 'react'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { ASSIGNMENT_ALLOCATION_VALUES } from '@/constants/assignments'
import { toast } from '@/hooks/use-toast'
import { useAssignments } from '@/hooks/use-assignments'
import { DatePickerWithRange } from '@/components/date-range-picker'

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
  onCreateAssignment?: (assignment: Omit<Assignment, 'id' | 'created_at' | 'updated_at'>) => Promise<any>
  isContextMenuOpen?: boolean
  setContextMenuOpen?: (open: boolean) => void
  onRequestEdit?: (assignment: Assignment) => void
  onRequestCreate?: (assignment: Omit<Assignment, 'id' | 'created_at' | 'updated_at'>) => void
  isDraggingAssignment?: boolean
  overrideBar?: { assignmentId: string, left: number } | null
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
  onCreateAssignment,
  isContextMenuOpen = false,
  setContextMenuOpen,
  onRequestEdit,
  onRequestCreate,
  isDraggingAssignment = false,
  overrideBar = null,
}: PersonRowProps) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [assignmentToDelete, setAssignmentToDelete] = useState<Assignment | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionStartIdx, setSelectionStartIdx] = useState<number | null>(null)
  const [selectionEndIdx, setSelectionEndIdx] = useState<number | null>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const { createAssignment } = useAssignments()
  const [hoveredDayIdx, setHoveredDayIdx] = useState<number | null>(null)
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | null>(null)

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

  // Handlers para selección de días
  const handleDayMouseDown = (dayIdx: number) => {
    setIsSelecting(true)
    setSelectionStartIdx(dayIdx)
    setSelectionEndIdx(dayIdx)
  }
  const handleDayMouseEnter = (dayIdx: number) => {
    if (isSelecting && selectionStartIdx !== null) {
      setSelectionEndIdx(dayIdx)
    }
  }

  // Calcular el rango seleccionado
  let selectedRange: [number, number] | null = null
  if (selectionStartIdx !== null && selectionEndIdx !== null) {
    selectedRange = [
      Math.min(selectionStartIdx, selectionEndIdx),
      Math.max(selectionStartIdx, selectionEndIdx)
    ]
  }

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    // Solo click izquierdo y si no hay menú contextual abierto
    if (e.button !== 0) return;
    if (isContextMenuOpen) return;
    setIsSelecting(false)
    if (selectedRange) {
      setDateRange({ from: days[selectedRange[0]], to: days[selectedRange[1]] })
      if (onRequestCreate && dateRange) {
        onRequestCreate({
          person_id: person.id,
          project_id: '', // El usuario debe seleccionar el proyecto en el modal
          start_date: dateRange.from.toISOString().slice(0, 10),
          end_date: dateRange.to.toISOString().slice(0, 10),
          allocation: 100,
          is_billable: true,
        })
      }
    }
  }, [isContextMenuOpen, selectedRange, days, person.id, dateRange, onRequestCreate])

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
  const VISIBILITY_MARGIN = 400; // píxeles
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
        className="sticky left-0 z-20 bg-white border-r border-gray-200 flex flex-col items-start justify-start"
        style={{ width: `${sidebarWidth}px` }}
      >
        <div className="p-4 flex items-start space-x-3 w-full">
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
      <div className="relative flex-1" style={{ width: `${totalWidth}px` }}
        ref={timelineRef}
        onMouseUp={handleMouseUp}
      >
        {/* Background days */}
        {days.map((day, i) => (
          <div
            key={i}
            className={[
              "absolute top-0 bottom-0 border-r border-gray-100 transition-colors duration-75",
              isSameDay(day, today) ? "bg-blue-50/30" : "",
              hoveredDayIdx === i && !isDraggingAssignment
                ? "bg-gray-300/60"
                : isWeekend(day)
                  ? "bg-gray-100/70"
                  : "bg-white"
            ].join(" ")}
            style={{
              left: `${i * dayWidth}px`,
              width: `${dayWidth}px`,
              zIndex: 1,
            }}
            onMouseDown={() => handleDayMouseDown(i)}
            onMouseEnter={() => { handleDayMouseEnter(i); setHoveredDayIdx(i) }}
            onMouseLeave={() => setHoveredDayIdx(null)}
          />
        ))}
        {/* Barra de selección visual */}
        {selectedRange && isSelecting && (
          <div
            className="absolute top-0 bottom-0 bg-gray-400/40 rounded-md pointer-events-none"
            style={{
              left: `${selectedRange[0] * dayWidth}px`,
              width: `${(selectedRange[1] - selectedRange[0] + 1) * dayWidth}px`,
              zIndex: 2,
            }}
          />
        )}

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
                dimensions={{
                  ...dimensions,
                  left: overrideBar && overrideBar.assignmentId === assignment.id ? overrideBar.left : dimensions.left,
                }}
                top={top}
                height={layout.barHeight}
                scrollLeft={scrollLeft}
                sidebarWidth={sidebarWidth}
                zIndex={10 - idx}
                onRequestDelete={() => handleRequestDelete(assignment)}
                onRequestEdit={onRequestEdit ? () => onRequestEdit(assignment) : undefined}
                isContextMenuOpen={isContextMenuOpen}
                setContextMenuOpen={setContextMenuOpen}
                isDraggingAssignment={isDraggingAssignment}
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