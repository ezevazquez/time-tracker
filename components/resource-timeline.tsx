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
      return assignments.filter((assignment) => {
        const startDate = parseDateFromString(assignment.start_date)
        const endDate = parseDateFromString(assignment.end_date)
        return (
          assignment.person_id === personId &&
          startDate <= endOfMonth(visibleDateRange.end) &&
          endDate >= startOfMonth(visibleDateRange.start)
        )
      })
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

    const handleDragStart = (event: DragStartEvent) => {
      const found = assignments.find(a => a.id === event.active.id)
      if (found) setDraggedAssignment(found)
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
    // Estado temporal para override de posición de la barra
    const [overrideBar, setOverrideBar] = useState<{ assignmentId: string, left: number } | null>(null)

    const handleDragEnd = (event: DragEndEvent) => {
      setDraggedAssignment(null)
      const active = event.active
      const assignment = assignments.find(a => a.id === active.id)
      if (!assignment) return
      let snappedDayIdx = null;
      let snappedLeft = 0;
      // Usar el array de días del mes completo para snap y fechas
      const visibleStart = startOfMonth(visibleDateRange.start)
      const days = eachDayOfInterval({
        start: visibleStart,
        end: endOfMonth(visibleDateRange.end),
      })
      if (active && active.data && active.data.current && typeof active.data.current.initialLeft === 'number') {
        const DAY_WIDTH = 40;
        const initialLeft = active.data.current.initialLeft;
        // Usar el delta real del drag para calcular el desplazamiento
        const snappedX = event.delta.x;
        snappedLeft = Math.floor((initialLeft + snappedX) / DAY_WIDTH) * DAY_WIDTH;
        snappedDayIdx = Math.floor((initialLeft + snappedX) / DAY_WIDTH);
        // Clamp snappedDayIdx
        if (snappedDayIdx < 0) snappedDayIdx = 0;
        if (snappedDayIdx >= days.length) snappedDayIdx = days.length - 1;
        console.log('DRAG FINAL DEBUG:', {
          initialLeft,
          snappedX,
          snappedDayIdx,
          newStartDate: days[snappedDayIdx],
          days,
          daysLength: days.length,
          visibleStart: startOfMonth(visibleDateRange.start),
          visibleEnd: endOfMonth(visibleDateRange.end),
        })
      } else if (event.over && event.over.data && event.over.data.current && 'dayIdx' in event.over.data.current) {
        snappedDayIdx = event.over.data.current.dayIdx;
        const DAY_WIDTH = 40;
        snappedLeft = snappedDayIdx * DAY_WIDTH;
      }
      if (snappedDayIdx === null) return;
      // Calcular la nueva fecha de inicio y fin según el snap
      const newStartDate = days[snappedDayIdx]
      const originalDuration = differenceInDays(parseDateFromString(assignment.end_date), parseDateFromString(assignment.start_date))
      const newEndDate = new Date(newStartDate)
      newEndDate.setDate(newStartDate.getDate() + originalDuration)
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
      // Aquí deberías implementar la lógica real de guardado
      setEditModalOpen(false);
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

    return (
      <DndContext
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        collisionDetection={collisionDetection}
        modifiers={[restrictToHorizontalAxis, snapToDayWidthModifier]}
      >
        <div className="h-full flex flex-col bg-white">

          {/* Timeline container */}
          <div className="flex-1 min-h-0 relative">
            <div
              ref={scrollContainerRef}
              className="absolute inset-0 overflow-x-auto"
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
                    onCreateAssignment={onCreateAssignment}
                    isContextMenuOpen={contextMenuOpen}
                    setContextMenuOpen={setContextMenuOpen}
                    onRequestEdit={handleRequestEdit}
                    onRequestCreate={handleOpenCreateModal}
                    isDraggingAssignment={!!draggedAssignment}
                    overrideBar={overrideBar}
                  />
                ))}

                {/* Empty state */}
                {filteredPeople.length === 0 && (
                  <div className="p-12 text-center text-gray-500">
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
              await onUpdateAssignment(editModalData.id, data)
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
