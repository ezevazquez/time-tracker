"use client"

import { useState, useRef, useEffect, useMemo, useCallback, useImperativeHandle, forwardRef } from "react"
import { PersonRow } from "./person-row"
import { TimelineHeader } from "./timeline-header"
import {
  eachDayOfInterval,
  addMonths,
  subMonths,
  differenceInDays,
  startOfMonth,
  endOfMonth,
  isSameMonth,
  format,
  addDays,
  min as dateMin,
  max as dateMax,
} from "date-fns"
import type { Person } from "@/types/people"
import type { Project } from "@/types/project"
import type { Assignment } from "@/types/assignment"
import { parseDateFromString } from "@/lib/assignments"
import { DndContext, DragStartEvent, DragEndEvent, closestCenter, Collision, UniqueIdentifier } from '@dnd-kit/core'
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AssignmentModal } from './assignment-modal'

interface ResourceTimelineProps {
  people: Person[]
  projects: Project[]
  assignments: Assignment[]
  filters: {
    personProfile: string
    projectStatus: string
    dateRange: { from: Date; to: Date }
    overallocatedOnly: boolean
  }
  onFiltersChange: (filters: any) => void
  onClearFilters: () => void
  onScrollToTodayRef?: (ref: (() => void) | null) => void
  onDeleteAssignment?: (assignmentId: string) => void
  onCreateAssignment?: (assignment: Omit<Assignment, 'id' | 'created_at' | 'updated_at'>) => Promise<any>
  onUpdateAssignment?: (id: string, updates: Partial<Assignment>) => Promise<any>
}

// Paleta de 15 colores intercalados por familia
const PROJECT_COLORS = [
  // Pasteles
  '#A7F3D0', // Verde pastel
  '#BFDBFE', // Azul pastel
  '#DDD6FE', // Violeta pastel
  '#FDE68A', // Amarillo pastel
  '#FBCFE8', // Rosa pastel
  '#FECACA', // Rojo pastel
  '#FCD34D', // Naranja pastel
  // Intermedios
  '#3CBFAE', // Verde intermedio
  '#4B6CC1', // Azul intermedio
  '#8B5FBF', // Púrpura intermedio
  '#FF9F59', // Naranja intermedio
  '#F47174', // Rosa intermedio
  '#2CA58D', // Verde intermedio oscuro
  '#3973B7', // Azul intermedio oscuro
  '#7C3AED', // Púrpura intermedio oscuro
  // Oscuros
  '#1E8C6B', // Verde fuerte oscuro
  '#1C3FAA', // Azul fuerte oscuro
  '#6D28D9', // Púrpura fuerte oscuro
  '#FF6700', // Naranja fuerte oscuro
  '#C81E4A', // Rosa fuerte oscuro
]

function getProjectColor(projectId: string, projects: { id: string }[]) {
  const idx = projects.findIndex(p => p.id === projectId)
  return PROJECT_COLORS[idx % PROJECT_COLORS.length]
}

export const ResourceTimeline = forwardRef<{ scrollToToday: () => void }, ResourceTimelineProps>(
  ({ people, projects, assignments, filters, onFiltersChange, onClearFilters, onScrollToTodayRef, onDeleteAssignment, onCreateAssignment, onUpdateAssignment }, ref) => {
    // State for visible date range (for infinite scroll)
    const [visibleDateRange, setVisibleDateRange] = useState({
      start: startOfMonth(new Date()),
      end: addMonths(endOfMonth(new Date()), 2),
    })

    // State for tracking scroll position
    const [scrollLeft, setScrollLeft] = useState(0)

    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const lastScrollPosition = useRef(0)
    const isScrollingRef = useRef(false)

    // Constants for layout
    const DAY_WIDTH = 40
    const BASE_ROW_HEIGHT = 80 // Base height, will be adjusted per row
    const SIDEBAR_WIDTH = 240
    const HEADER_HEIGHT = 60

    // Handler para drop de asignaciones
    const [draggedAssignment, setDraggedAssignment] = useState<null | Assignment>(null)
    const [dropTarget, setDropTarget] = useState<null | { personId: string, dayIdx: number }>(null)
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [editModalData, setEditModalData] = useState<any>(null)
    // Estado global para menú contextual
    const [contextMenuOpen, setContextMenuOpen] = useState(false)

    // Estado para modal de creación
    const [createModalOpen, setCreateModalOpen] = useState(false)
    const [createModalInitialData, setCreateModalInitialData] = useState<any>(null)

    // Track scroll position with throttling for better performance
    useEffect(() => {
      const scrollContainer = scrollContainerRef.current
      if (!scrollContainer) return

      let ticking = false

      const handleScrollUpdate = () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            setScrollLeft(scrollContainer.scrollLeft)
            ticking = false
          })
          ticking = true
        }
      }

      scrollContainer.addEventListener("scroll", handleScrollUpdate, { passive: true })

      return () => {
        scrollContainer.removeEventListener("scroll", handleScrollUpdate)
      }
    }, [])

    // Generate all days in the visible date range
    const days = useMemo(() => {
      return eachDayOfInterval({
        start: startOfMonth(visibleDateRange.start),
        end: endOfMonth(visibleDateRange.end),
      })
    }, [visibleDateRange])

    // Get assignments for a person within the visible date range
    const getPersonAssignments = (personId: string) => {
      const result = assignments.filter((assignment) => {
        const startDate = parseDateFromString(assignment.start_date)
        const endDate = parseDateFromString(assignment.end_date)
        return (
          assignment.person_id === personId &&
          startDate <= endOfMonth(visibleDateRange.end) &&
          endDate >= startOfMonth(visibleDateRange.start)
        )
      })
      // Log assignments for this person
      console.log('[TIMELINE] getPersonAssignments', { personId, result })
      return result
    }

    // Show all people, even if they have no assignments
    const filteredPeople = useMemo(() => people, [people])

    // Handle scroll to dynamically load more months
    useEffect(() => {
      const scrollContainer = scrollContainerRef.current
      if (!scrollContainer) return

      const handleScroll = () => {
        if (isScrollingRef.current) return

        const { scrollLeft, scrollWidth, clientWidth } = scrollContainer
        const scrollRight = scrollWidth - scrollLeft - clientWidth

        // If we're near the left edge, add a month to the start
        if (scrollLeft < 300 && scrollLeft < lastScrollPosition.current) {
          isScrollingRef.current = true
          const newStart = subMonths(visibleDateRange.start, 1)
          setVisibleDateRange((prev) => ({ ...prev, start: newStart }))

          // Maintain scroll position when adding content to the left
          setTimeout(() => {
            const daysInNewMonth = differenceInDays(endOfMonth(newStart), startOfMonth(newStart)) + 1
            const newScrollPosition = scrollLeft + DAY_WIDTH * daysInNewMonth
            scrollContainer.scrollLeft = newScrollPosition
            isScrollingRef.current = false
          }, 10)
        }

        // If we're near the right edge, add a month to the end
        if (scrollRight < 300 && scrollLeft > lastScrollPosition.current) {
          isScrollingRef.current = true
          setVisibleDateRange((prev) => ({ ...prev, end: addMonths(prev.end, 1) }))
          setTimeout(() => {
            isScrollingRef.current = false
          }, 10)
        }

        lastScrollPosition.current = scrollLeft
      }

      scrollContainer.addEventListener("scroll", handleScroll)
      return () => {
        scrollContainer.removeEventListener("scroll", handleScroll)
      }
    }, [visibleDateRange, DAY_WIDTH])

    // Function to scroll to today
    const scrollToToday = useCallback(() => {
      const scrollContainer = scrollContainerRef.current
      if (!scrollContainer) return

      const visibleStart = startOfMonth(visibleDateRange.start)
      const today = new Date()
      const todayIndex = differenceInDays(today, visibleStart)

      const scrollPosition = todayIndex * DAY_WIDTH - scrollContainer.clientWidth * 0.2

      scrollContainer.scrollTo({
        left: Math.max(0, scrollPosition),
        behavior: "smooth",
      })
    }, [visibleDateRange.start, DAY_WIDTH])

    // Group days by month for header display
    const monthGroups = useMemo(() => {
      const groups: { month: Date; days: Date[] }[] = []
      let currentMonth: Date | null = null
      let currentDays: Date[] = []

      days.forEach((day) => {
        if (!currentMonth || !isSameMonth(day, currentMonth)) {
          if (currentMonth && currentDays.length) {
            groups.push({ month: currentMonth, days: [...currentDays] })
          }
          currentMonth = day
          currentDays = [day]
        } else {
          currentDays.push(day)
        }
      })

      if (currentMonth && currentDays.length) {
        groups.push({ month: currentMonth, days: [...currentDays] })
      }

      return groups
    }, [days])

    const today = new Date()
    const totalWidth = days.length * DAY_WIDTH

    // Scroll to today on initial render
    useEffect(() => {
      const scrollContainer = scrollContainerRef.current
      if (!scrollContainer) return

      const visibleStart = startOfMonth(visibleDateRange.start)
      const today = new Date()
      const todayIndex = differenceInDays(today, visibleStart)

      const scrollPosition = todayIndex * DAY_WIDTH - scrollContainer.clientWidth * 0.2
      scrollContainer.scrollLeft = Math.max(0, scrollPosition)
    }, [visibleDateRange.start, DAY_WIDTH])

    // Expose scrollToToday function to parent
    useImperativeHandle(
      ref,
      () => ({
        scrollToToday,
      }),
      [scrollToToday],
    )

    // Notify parent of scrollToToday function
    useEffect(() => {
      if (onScrollToTodayRef) {
        onScrollToTodayRef(scrollToToday)
      }
    }, [onScrollToTodayRef, scrollToToday])

    // Estado para resize robusto: índices de día de ambos bordes y los últimos índices usados en el preview
    const [resizeState, setResizeState] = useState<{
      type: 'left' | 'right' | null,
      initialLeftIdx: number,
      initialRightIdx: number,
      days: Date[],
      previewLeftIdx: number,
      previewRightIdx: number
    }>({ type: null, initialLeftIdx: 0, initialRightIdx: 0, days: [], previewLeftIdx: 0, previewRightIdx: 0 });

    const handleDragStart = (event: DragStartEvent) => {
      const found = assignments.find(a => a.id === event.active.id)
      if (found) setDraggedAssignment(found)
      // Si es resize, guardar índices de día de ambos bordes y array de días
      const isResizeLeft = event.active.id.toString().startsWith('resize-left-')
      const isResizeRight = event.active.id.toString().startsWith('resize-right-')
      if (isResizeLeft || isResizeRight) {
        const barId = isResizeLeft
          ? event.active.id.toString().replace('resize-left-', '')
          : event.active.id.toString().replace('resize-right-', '')
        const visibleStart = startOfMonth(visibleDateRange.start);
        const days = eachDayOfInterval({
          start: visibleStart,
          end: endOfMonth(visibleDateRange.end),
        });
        const assignment = assignments.find(a => a.id === barId);
        if (!assignment) return;
        const initialLeftIdx = days.findIndex(d => d.toISOString().slice(0, 10) === assignment.start_date);
        const initialRightIdx = days.findIndex(d => d.toISOString().slice(0, 10) === assignment.end_date);
        setResizeState({
          type: isResizeLeft ? 'left' : 'right',
          initialLeftIdx,
          initialRightIdx,
          days,
          previewLeftIdx: initialLeftIdx,
          previewRightIdx: initialRightIdx
        });
      } else {
        setResizeState({ type: null, initialLeftIdx: 0, initialRightIdx: 0, days: [], previewLeftIdx: 0, previewRightIdx: 0 });
      }
    }

    // Custom collision detection: solo permite drop en la misma row/persona
    function collisionDetection(args: any): Collision[] {
      const { active, droppableContainers } = args
      // Solo permitir drop en la misma persona
      if (!active || !active.data?.current?.assignment) return []
      const assignment = active.data.current.assignment
      // Buscar solo el droppable de la misma persona
      return droppableContainers.filter((container: any) => {
        return container.data?.current?.personId === assignment.person_id
      }).map((container: any) => ({ id: container.id, data: container.data }))
    }

    // Estado para el dialog de confirmación de fechas
    const [confirmDialog, setConfirmDialog] = useState<{ open: boolean, newStart: Date, newEnd: Date, assignment: Assignment | null, snappedLeft?: number } | null>(null)
    // Estado temporal para override de posición y tamaño de la barra (preview de resize)
    const [overrideBar, setOverrideBar] = useState<{ assignmentId: string, left: number, width?: number } | null>(null)

    const handleDragEnd = (event: DragEndEvent) => {
      setDraggedAssignment(null)
      // Log assignments before update
      console.log('[TIMELINE] assignments BEFORE update', assignments)
      const active = event.active
      // Detectar si es un drag de resize handle
      const isResizeLeft = active.id.toString().startsWith('resize-left-')
      const isResizeRight = active.id.toString().startsWith('resize-right-')
      let assignmentId = active.id.toString()
      if (isResizeLeft) assignmentId = assignmentId.replace('resize-left-', '')
      if (isResizeRight) assignmentId = assignmentId.replace('resize-right-', '')
      const assignment = assignments.find(a => a.id === assignmentId)
      if (!assignment) return
      const visibleStart = startOfMonth(visibleDateRange.start)
      const days = eachDayOfInterval({
        start: visibleStart,
        end: endOfMonth(visibleDateRange.end),
      })
      const DAY_WIDTH = 40;
      if (isResizeLeft || isResizeRight) {
        // Resize handle logic
        // Calcular el snap del borde arrastrado
        const originalStartIdx = days.findIndex(d => d.toISOString().slice(0, 10) === assignment.start_date);
        const originalEndIdx = days.findIndex(d => d.toISOString().slice(0, 10) === assignment.end_date);
        let newStart = parseDateFromString(assignment.start_date);
        let newEnd = parseDateFromString(assignment.end_date);
        if (isResizeLeft) {
          const initialLeft = active.data?.current?.dimensions?.left ?? 0;
          const snappedX = event.delta.x;
          const snappedDayIdx = Math.floor((initialLeft + snappedX) / DAY_WIDTH);
          const clampedIdx = Math.max(0, Math.min(days.length - 1, snappedDayIdx));
          // No permitir que el inicio pase el fin
          if (clampedIdx >= originalEndIdx) return;
          newStart = days[clampedIdx];
          // Si la fecha no cambia, no mostrar diálogo
          if (newStart.toISOString().slice(0, 10) === assignment.start_date) return;
        } else if (isResizeRight) {
          const initialRight = (active.data?.current?.dimensions?.left ?? 0) + (active.data?.current?.dimensions?.width ?? 0);
          const snappedX = event.delta.x;
          const snappedRightIdx = Math.floor((initialRight + snappedX) / DAY_WIDTH);
          const clampedIdx = Math.max(0, Math.min(days.length - 1, snappedRightIdx));
          // No permitir que el fin sea antes del inicio
          if (clampedIdx <= originalStartIdx) return;
          newEnd = days[clampedIdx];
          // Si la fecha no cambia, no mostrar diálogo
          if (newEnd.toISOString().slice(0, 10) === assignment.end_date) return;
        }
        setConfirmDialog({
          open: true,
          newStart,
          newEnd,
          assignment,
          snappedLeft: undefined,
        });
        return;
      }
      // Drag normal de barra
      let snappedDayIdx = null;
      let snappedLeft = 0;
      if (active && active.data && active.data.current && typeof active.data.current.initialLeft === 'number') {
        const initialLeft = active.data.current.initialLeft;
        const snappedX = event.delta.x;
        snappedLeft = Math.floor((initialLeft + snappedX) / DAY_WIDTH) * DAY_WIDTH;
        snappedDayIdx = Math.floor((initialLeft + snappedX) / DAY_WIDTH);
        // Clamp snappedDayIdx
        if (snappedDayIdx < 0) snappedDayIdx = 0;
        if (snappedDayIdx >= days.length) snappedDayIdx = days.length - 1;
        // Si la fecha no cambia, no mostrar diálogo
        const newStartDate = days[snappedDayIdx]
        const originalDuration = differenceInDays(parseDateFromString(assignment.end_date), parseDateFromString(assignment.start_date))
        const newEndDate = new Date(newStartDate)
        newEndDate.setDate(newStartDate.getDate() + originalDuration)
        if (
          newStartDate.toISOString().slice(0, 10) === assignment.start_date &&
          newEndDate.toISOString().slice(0, 10) === assignment.end_date
        ) {
          return;
        }
        // Guardar override temporal de la barra
        setOverrideBar({ assignmentId: assignment.id, left: snappedLeft })
        // Mostrar dialog de confirmación
        setConfirmDialog({
          open: true,
          newStart: newStartDate,
          newEnd: newEndDate,
          assignment,
          snappedLeft,
        })
      } else if (event.over && event.over.data && event.over.data.current && 'dayIdx' in event.over.data.current) {
        snappedDayIdx = event.over.data.current.dayIdx;
        snappedLeft = snappedDayIdx * DAY_WIDTH;
      }
      if (snappedDayIdx === null) return;
      // Calcular la nueva fecha de inicio y fin según el snap
      const newStartDate = days[snappedDayIdx]
      const originalDuration = differenceInDays(parseDateFromString(assignment.end_date), parseDateFromString(assignment.start_date))
      const newEndDate = new Date(newStartDate)
      newEndDate.setDate(newStartDate.getDate() + originalDuration)
      // Si la fecha no cambia, no mostrar diálogo
      if (
        newStartDate.toISOString().slice(0, 10) === assignment.start_date &&
        newEndDate.toISOString().slice(0, 10) === assignment.end_date
      ) {
        return;
      }
      // Guardar override temporal de la barra
      setOverrideBar({ assignmentId: assignment.id, left: snappedLeft })
      // Mostrar dialog de confirmación
      setConfirmDialog({
        open: true,
        newStart: newStartDate,
        newEnd: newEndDate,
        assignment,
        snappedLeft,
      })
      // Log assignments after update (will update after confirm)
      setTimeout(() => {
        console.log('[TIMELINE] assignments AFTER update (setTimeout)', assignments)
      }, 1000)
    }

    // Handler para edición desde menú contextual
    const handleRequestEdit = (assignment: Assignment) => {
      setEditModalData(assignment)
      setEditModalOpen(true)
    }

    // Ejemplo: al crear una nueva asignación
    const handleOpenCreateModal = (initialData?: any) => {
      setCreateModalInitialData(initialData || {})
      setCreateModalOpen(true)
    }

    // Estado para el formulario de edición
    const [editForm, setEditForm] = useState<{
      project_id: string;
      allocation: number;
      is_billable: boolean;
      dateRange: { from: Date; to: Date } | null;
    }>({
      project_id: '',
      allocation: 1,
      is_billable: true,
      dateRange: null,
    });

    // Sincronizar datos al abrir modal
    useEffect(() => {
      if (editModalOpen && editModalData?.assignment) {
        const a = editModalData.assignment;
        setEditForm({
          project_id: a.project_id,
          allocation: a.allocation,
          is_billable: a.is_billable,
          dateRange: a.start_date && a.end_date ? {
            from: new Date(a.start_date),
            to: new Date(a.end_date),
          } : null,
        });
      }
    }, [editModalOpen, editModalData]);

    // Guardar cambios (aquí deberías llamar a tu función de update real)
    const handleEditAssignment = () => {
      // Log assignments before edit
      console.log('[TIMELINE] assignments BEFORE edit', assignments)
      // Aquí deberías implementar la lógica real de guardado
      setEditModalOpen(false);
      setTimeout(() => {
        console.log('[TIMELINE] assignments AFTER edit (setTimeout)', assignments)
      }, 1000)
    };

    // Custom snap modifier: sticky horizontal a los días
    function snapToDayWidthModifier({ transform }: { transform: { x: number; y: number; scaleX?: number; scaleY?: number } }) {
      const DAY_WIDTH = 40;
      return {
        x: Math.round(transform.x / DAY_WIDTH) * DAY_WIDTH,
        y: 0, // fuerza el eje Y a 0 para evitar movimiento vertical
        scaleX: transform.scaleX ?? 1,
        scaleY: transform.scaleY ?? 1,
      };
    }

    useEffect(() => {
      function preventVerticalScroll(e: WheelEvent) {
        if (e.deltaY !== 0) {
          e.preventDefault();
        }
      }
      function preventTouchMove(e: TouchEvent) {
        e.preventDefault();
      }
      const scrollContainer = scrollContainerRef.current;

      if (draggedAssignment) {
        window.addEventListener('wheel', preventVerticalScroll, { passive: false });
        window.addEventListener('touchmove', preventTouchMove, { passive: false });
        document.body.style.overflow = 'hidden';
        if (scrollContainer) {
          scrollContainer.addEventListener('wheel', preventVerticalScroll, { passive: false });
          scrollContainer.addEventListener('touchmove', preventTouchMove, { passive: false });
          scrollContainer.style.overflowY = 'hidden';
        }
      } else {
        window.removeEventListener('wheel', preventVerticalScroll);
        window.removeEventListener('touchmove', preventTouchMove);
        document.body.style.overflow = '';
        if (scrollContainer) {
          scrollContainer.removeEventListener('wheel', preventVerticalScroll);
          scrollContainer.removeEventListener('touchmove', preventTouchMove);
          scrollContainer.style.overflowY = 'visible';
        }
      }
      return () => {
        window.removeEventListener('wheel', preventVerticalScroll);
        window.removeEventListener('touchmove', preventTouchMove);
        document.body.style.overflow = '';
        if (scrollContainer) {
          scrollContainer.removeEventListener('wheel', preventVerticalScroll);
          scrollContainer.removeEventListener('touchmove', preventTouchMove);
          scrollContainer.style.overflowY = 'visible';
        }
      };
    }, [draggedAssignment]);

    console.log('TIMELINE DEBUG:', {
      visibleDateRangeStart: visibleDateRange.start,
      visibleDateRangeEnd: visibleDateRange.end,
      today: new Date(),
    })

    useEffect(() => {
      if (!assignments.length) return;
      // Encontrar la asignación más temprana y más tardía
      const minStart = assignments.reduce((min, a) => dateMin([min, parseDateFromString(a.start_date)]), parseDateFromString(assignments[0].start_date));
      const maxEnd = assignments.reduce((max, a) => dateMax([max, parseDateFromString(a.end_date)]), parseDateFromString(assignments[0].end_date));
      // Expandir 5 días antes y después
      const expandedStart = addDays(minStart, -5);
      const expandedEnd = addDays(maxEnd, 5);
      // Si el visibleDateRange no cubre este rango, expandirlo
      if (expandedStart < visibleDateRange.start || expandedEnd > visibleDateRange.end) {
        setVisibleDateRange(prev => ({
          start: expandedStart < prev.start ? expandedStart : prev.start,
          end: expandedEnd > prev.end ? expandedEnd : prev.end,
        }));
      }
    }, [assignments, visibleDateRange.start, visibleDateRange.end]);

    return (
      <DndContext
        onDragStart={handleDragStart}
        onDragMove={event => {
          const active = event.active
          const isResizeLeft = active.id.toString().startsWith('resize-left-')
          const isResizeRight = active.id.toString().startsWith('resize-right-')
          let assignmentId = active.id.toString()
          if (isResizeLeft) assignmentId = assignmentId.replace('resize-left-', '')
          if (isResizeRight) assignmentId = assignmentId.replace('resize-right-', '')
          const assignment = assignments.find(a => a.id === assignmentId)
          if (!assignment) return
          if (isResizeLeft || isResizeRight) {
            const DAY_WIDTH = 40;
            const { type, initialLeftIdx, initialRightIdx, days } = resizeState;
            const deltaDays = Math.round(event.delta.x / DAY_WIDTH);
            let newLeftIdx = initialLeftIdx;
            let newRightIdx = initialRightIdx;
            if (type === 'left') {
              newLeftIdx = Math.max(0, Math.min(initialRightIdx - 1, initialLeftIdx + deltaDays));
            } else if (type === 'right') {
              newRightIdx = Math.max(initialLeftIdx + 1, Math.min(days.length - 1, initialRightIdx + deltaDays));
            }
            const left = newLeftIdx * DAY_WIDTH;
            const width = (newRightIdx - newLeftIdx + 1) * DAY_WIDTH;
            setOverrideBar({ assignmentId, left, width });
            // Guardo los índices usados en el preview
            setResizeState(prev => ({ ...prev, previewLeftIdx: newLeftIdx, previewRightIdx: newRightIdx }));
          } else {
            setOverrideBar(null)
          }
        }}
        onDragEnd={event => {
          // Uso los índices del preview para calcular las fechas
          if ((resizeState.type === 'left' || resizeState.type === 'right') && resizeState.days.length > 0) {
            const { previewLeftIdx, previewRightIdx, days } = resizeState;
            const newStartDate = days[previewLeftIdx];
            const newEndDate = days[previewRightIdx];
            setConfirmDialog({
              open: true,
              newStart: newStartDate,
              newEnd: newEndDate,
              assignment: assignments.find(a => a.id === (overrideBar?.assignmentId ?? "") ) ?? null,
            });
          }
          setOverrideBar(null)
          setResizeState({ type: null, initialLeftIdx: 0, initialRightIdx: 0, days: [], previewLeftIdx: 0, previewRightIdx: 0 })
          handleDragEnd(event)
        }}
        collisionDetection={collisionDetection}
        modifiers={[restrictToHorizontalAxis, snapToDayWidthModifier]}
      >
        <div className="h-full flex flex-col bg-white">

          {/* Timeline container */}
          <div className="flex-1 min-h-0 relative">
            <div
              ref={scrollContainerRef}
              className="absolute inset-0 overflow-x-auto resource-timeline-viewport"
              style={{
                overflowX: "auto",
                overflowY: "visible",
              }}
            >
              <div className="relative" style={{ minWidth: `${SIDEBAR_WIDTH + totalWidth}px` }}>
                {/* Timeline header */}
                <TimelineHeader
                  days={days}
                  monthGroups={monthGroups}
                  today={today}
                  dayWidth={DAY_WIDTH}
                  sidebarWidth={SIDEBAR_WIDTH}
                  headerHeight={HEADER_HEIGHT}
                  totalWidth={totalWidth}
                  onScrollToToday={scrollToToday}
                />

                {/* Person rows with dynamic heights */}
                {filteredPeople.map((person, idx) => (
                  <PersonRow
                    key={person.id}
                    person={person}
                    assignments={getPersonAssignments(person.id)}
                    projects={projects}
                    days={days}
                    visibleDateRange={visibleDateRange}
                    dayWidth={DAY_WIDTH}
                    sidebarWidth={SIDEBAR_WIDTH}
                    baseRowHeight={BASE_ROW_HEIGHT}
                    totalWidth={totalWidth}
                    scrollLeft={scrollLeft}
                    today={today}
                    isEvenRow={idx % 2 === 0}
                    onDeleteAssignment={onDeleteAssignment}
                    onCreateAssignment={(assignment) => { handleOpenCreateModal(assignment); return Promise.resolve(); }}
                    isContextMenuOpen={contextMenuOpen}
                    setContextMenuOpen={setContextMenuOpen}
                    onRequestEdit={handleRequestEdit}
                    onRequestCreate={handleOpenCreateModal}
                    isDraggingAssignment={!!draggedAssignment}
                    overrideBar={overrideBar}
                    projectColors={projects.reduce((acc, p) => { acc[p.id] = getProjectColor(p.id, projects); return acc }, {} as Record<string, string>)}
                  />
                ))}

                {/* Empty state */}
                {filteredPeople.length === 0 && (
                  <div 
                    className="absolute p-12 text-center text-gray-500 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg shadow-sm"
                    style={{
                      left: `${SIDEBAR_WIDTH + differenceInDays(today, startOfMonth(visibleDateRange.start)) * DAY_WIDTH - 200}px`,
                      top: '100px',
                      width: '400px'
                    }}
                  >
                    <div className="text-lg font-medium mb-2">No hay miembros activos del equipo</div>
                    <div className="text-sm">Agrega personas con estado "Activo" para ver sus asignaciones</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <AssignmentModal
          open={createModalOpen}
          mode="new"
          initialData={createModalInitialData}
          onSave={async (data) => {
            await onCreateAssignment?.(data);
            setCreateModalOpen(false);
          }}
          onCancel={() => setCreateModalOpen(false)}
        />
        <AssignmentModal
          open={editModalOpen}
          mode="edit"
          initialData={editModalData}
          onSave={async (data) => {
            if (editModalData && editModalData.id && onUpdateAssignment) {
              // Log assignments before update
              console.log('[TIMELINE] assignments BEFORE onUpdateAssignment', assignments)
              await onUpdateAssignment(editModalData.id, data)
              // Log assignments after update
              setTimeout(() => {
                console.log('[TIMELINE] assignments AFTER onUpdateAssignment', assignments)
              }, 1000)
            }
            setEditModalOpen(false);
          }}
          onCancel={() => setEditModalOpen(false)}
        />
        {/* Dialog de confirmación de fechas tras drag */}
        {confirmDialog?.open && (
          <Dialog open={confirmDialog.open} onOpenChange={open => {
            if (!open) {
              setConfirmDialog(null)
              setOverrideBar(null)
            }
          }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>¿Actualizar fechas de la asignación?</DialogTitle>
              </DialogHeader>
              <div className="mb-4">
                ¿Seguro que querés actualizar la asignación a las fechas<br />
                <b>{format(confirmDialog.newStart, 'dd-MM-yyyy')}</b> a <b>{format(confirmDialog.newEnd, 'dd-MM-yyyy')}</b>?
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setConfirmDialog(null); setOverrideBar(null); }}>Cancelar</Button>
                <Button variant="default" onClick={async () => {
                  if (confirmDialog.assignment && onUpdateAssignment) {
                    await onUpdateAssignment(confirmDialog.assignment.id, {
                      start_date: confirmDialog.newStart.toISOString().slice(0, 10),
                      end_date: confirmDialog.newEnd.toISOString().slice(0, 10),
                    })
                  }
                  setConfirmDialog(null)
                  setOverrideBar(null)
                }}>Confirmar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </DndContext>
    )
  },
)

ResourceTimeline.displayName = "ResourceTimeline"
