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
  projectColors: Record<string, string>
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
  projectColors,
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

  const CONSISTENT_BAR_HEIGHT = 32;
  const BAR_SPACING = 4;
  const VERTICAL_PADDING = 8;

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
    // Si se está haciendo drag de una barra, no crear asignación
    if (isDraggingAssignment) {
      setIsSelecting(false);
      setSelectionStartIdx(null);
      setSelectionEndIdx(null);
      return;
    }
    setIsSelecting(false)
    if (selectedRange) {
      const from = days[selectedRange[0]];
      const to = days[selectedRange[1]];
      if (onRequestCreate) {
        onRequestCreate({
          person_id: person.id,
          project_id: '', // El usuario debe seleccionar el proyecto en el modal
          start_date: from.toISOString().slice(0, 10),
          end_date: to.toISOString().slice(0, 10),
          allocation: 100,
          is_billable: true,
        });
      }
      setDateRange({ from, to }); // Si necesitas el estado para otra cosa
    }
  }, [isContextMenuOpen, isDraggingAssignment, selectedRange, days, person.id, onRequestCreate]);

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

  // Algoritmo para apilar barras solapadas
  function getAssignmentLevels(assignments: Assignment[]) {
    // Ordenar por fecha de inicio
    const sorted = [...assignments].sort((a, b) => {
      const dateA = parseDateFromString(a.start_date)
      const dateB = parseDateFromString(b.start_date)
      return dateA.getTime() - dateB.getTime()
    })
    // Cada nivel es un array de asignaciones ya ubicadas
    const levels: Assignment[][] = []
    const result: { assignment: Assignment; level: number }[] = []
    sorted.forEach(assignment => {
      const startA = parseDateFromString(assignment.start_date)
      const endA = parseDateFromString(assignment.end_date)
      // Buscar el primer nivel donde no se solape
      let foundLevel = 0
      for (; foundLevel < levels.length; foundLevel++) {
        const level = levels[foundLevel]
        // ¿Se solapa con alguna asignación ya ubicada en este nivel?
        const overlaps = level.some(b => {
          const startB = parseDateFromString(b.start_date)
          const endB = parseDateFromString(b.end_date)
          return startA <= endB && endA >= startB
        })
        if (!overlaps) break
      }
      // Si no hay nivel disponible, crea uno nuevo
      if (!levels[foundLevel]) levels[foundLevel] = []
      levels[foundLevel].push(assignment)
      result.push({ assignment, level: foundLevel })
    })
    return result
  }

  // Calcular niveles de apilado
  const assignmentLevels = getAssignmentLevels(assignments)
  const maxLevel = assignmentLevels.reduce((max, a) => Math.max(max, a.level), 0)

  // Calcular los índices de los días estrictamente visibles (sin VISIBILITY_MARGIN)
  let strictFirstVisibleDayIdx = 0
  let strictLastVisibleDayIdx = days.length - 1
  if (typeof window !== 'undefined') {
    const timelineViewportWidth = document.querySelector('.resource-timeline-viewport')?.clientWidth || 800
    const viewportLeft = scrollLeft
    const viewportRight = scrollLeft + timelineViewportWidth
    strictFirstVisibleDayIdx = Math.max(0, Math.floor((viewportLeft - sidebarWidth) / dayWidth))
    strictLastVisibleDayIdx = Math.min(days.length - 1, Math.ceil((viewportRight - sidebarWidth) / dayWidth))
  }
  const strictlyVisibleDays = days.slice(strictFirstVisibleDayIdx, strictLastVisibleDayIdx + 1)

  // Calcular el máximo de solapamientos en los días estrictamente visibles
  let maxOverlap = 0
  strictlyVisibleDays.forEach(day => {
    const overlap = assignments.filter(a => {
      const start = parseDateFromString(a.start_date)
      const end = parseDateFromString(a.end_date)
      return start <= day && end >= day
    }).length
    if (overlap > maxOverlap) maxOverlap = overlap
  })

  // Calcular la altura mínima como si tuviera 2 asignaciones
  const minRowHeight = (CONSISTENT_BAR_HEIGHT + BAR_SPACING) * 2 + VERTICAL_PADDING * 2;

  // Calcular la altura de la fila
  let rowHeight = minRowHeight;
  if (maxOverlap > 1) {
    rowHeight = Math.max(
      minRowHeight,
      (CONSISTENT_BAR_HEIGHT + BAR_SPACING) * maxOverlap + VERTICAL_PADDING * 2
    );
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

  // Calcular si hay asignaciones superpuestas visibles en el viewport
  // 1. Obtener las asignaciones que están activas en días visibles
  const visibleAssignments = sortedAssignments.filter(a => {
    const start = parseDateFromString(a.start_date)
    const end = parseDateFromString(a.end_date)
    // Si la asignación se solapa con algún día visible
    return visibleDays.some(day => start <= day && end >= day)
  })

  // 2. Calcular el máximo de asignaciones activas en cualquier día visible
  const maxAssignmentsInADayVisible = visibleDays.reduce((max, day) => {
    const activeCount = sortedAssignments.filter(a => {
      const start = parseDateFromString(a.start_date)
      const end = parseDateFromString(a.end_date)
      return start <= day && end >= day
    }).length
    return Math.max(max, activeCount)
  }, 0)

  // Si hay solapamiento visible, expandir. Si no, altura base.
  if (maxAssignmentsInADayVisible > 1) {
    // Calcular niveles de apilado solo con asignaciones visibles
    const visibleAssignments = sortedAssignments.filter(a => {
      return visibleDays.some(day => {
        const start = parseDateFromString(a.start_date)
        const end = parseDateFromString(a.end_date)
        return start <= day && end >= day
      })
    })
    const visibleAssignmentLevels = getAssignmentLevels(visibleAssignments)
    const visibleMaxLevel = visibleAssignmentLevels.reduce((max, a) => Math.max(max, a.level), 0)
    rowHeight = Math.max(baseRowHeight, (CONSISTENT_BAR_HEIGHT + BAR_SPACING) * (visibleMaxLevel + 1) + VERTICAL_PADDING * 2)
  }

  return (
    <div
      className={`
        flex border-b border-gray-100 hover:bg-gray-50/30 transition-colors
        ${isEvenRow ? "bg-white" : "bg-gray-50/20"}
      `}
      style={{ height: `${rowHeight}px` }}
      data-test={`person-row-${person.id}`}
    >
      {/* Sidebar */}
      <div
        className="sticky left-0 z-20 bg-white border-r border-gray-200 flex flex-col items-start justify-start"
        style={{ width: `${sidebarWidth}px` }}
        data-test={`person-sidebar-${person.id}`}
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
            data-test={`day-${i}`}
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
          {assignmentLevels.map(({ assignment, level }) => {
            const project = projects.find((p) => p.id === assignment.project_id)
            if (!project) return null

            const dimensions = calculateBarDimensions(assignment)
            const top = VERTICAL_PADDING + level * (CONSISTENT_BAR_HEIGHT + BAR_SPACING)

            // Solo usar overrideBar si tiene left y width (resize), si no, usar solo dimensions originales
            const isResizeOverride =
              overrideBar &&
              overrideBar.assignmentId === assignment.id &&
              typeof (overrideBar as any).width === 'number';

            const barDimensions = {
              ...dimensions,
              left: isResizeOverride ? overrideBar!.left : dimensions.left,
              width: isResizeOverride ? (overrideBar as any).width : dimensions.width,
            };

            const bgColor = projectColors[project.id] || '#D9F9F2'

            return (
              <AssignmentBar
                key={assignment.id}
                assignment={assignment}
                project={project}
                dimensions={barDimensions}
                top={top}
                height={CONSISTENT_BAR_HEIGHT}
                scrollLeft={scrollLeft}
                sidebarWidth={sidebarWidth}
                zIndex={10 - level}
                onRequestDelete={() => handleRequestDelete(assignment)}
                onRequestEdit={onRequestEdit ? () => onRequestEdit(assignment) : undefined}
                onRequestDuplicate={onRequestCreate ? () => {
                  // Duplicar: mismo proyecto, mismas fechas, misma asignación, pero sin persona
                  onRequestCreate({
                    person_id: '', // El usuario debe elegir la persona
                    project_id: assignment.project_id,
                    start_date: assignment.start_date,
                    end_date: assignment.end_date,
                    allocation: assignment.allocation,
                    is_billable: assignment.is_billable,
                  });
                } : undefined}
                isContextMenuOpen={isContextMenuOpen}
                setContextMenuOpen={setContextMenuOpen}
                isDraggingAssignment={isDraggingAssignment}
                disableAllTooltips={isContextMenuOpen}
                overrideBar={isResizeOverride ? (overrideBar as { assignmentId: string; left: number; width: number }) : undefined}
                bgColor={bgColor}
              />
            )
          })}
        </TooltipProvider>

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