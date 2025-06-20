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
} from "date-fns"
import type { Person } from "@/types/people"
import type { Project } from "@/types/project"
import type { Assignment } from "@/types/assignment"
import { parseDateFromString } from "@/lib/assignments"
import { DndContext, DragStartEvent, DragEndEvent } from '@dnd-kit/core'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { DatePickerWithRange } from "@/components/date-range-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ASSIGNMENT_ALLOCATION_VALUES } from "@/constants/assignments"

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
}

export const ResourceTimeline = forwardRef<{ scrollToToday: () => void }, ResourceTimelineProps>(
  ({ people, projects, assignments, filters, onFiltersChange, onClearFilters, onScrollToTodayRef, onDeleteAssignment, onCreateAssignment }, ref) => {
    // State for visible date range (for infinite scroll)
    const [visibleDateRange, setVisibleDateRange] = useState({
      start: subMonths(new Date(), 1),
      end: addMonths(new Date(), 2),
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
    const handleDragEnd = (event: DragEndEvent) => {
      setDraggedAssignment(null)
      const data = event.over && event.over.data && event.over.data.current
      if (
        data &&
        typeof data === 'object' &&
        'personId' in data &&
        'dayIdx' in data
      ) {
        setDropTarget(data as { personId: string; dayIdx: number })
        // Abrir modal de edición rápida con los datos nuevos
        setEditModalData({
          assignmentId: event.active.id,
          newPersonId: data.personId,
          newDayIdx: data.dayIdx,
        })
        setEditModalOpen(true)
      }
    }

    // Handler para edición desde menú contextual
    const handleRequestEdit = (assignment: Assignment) => {
      setEditModalData({ assignmentId: assignment.id, assignment });
      setEditModalOpen(true);
    };

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

    return (
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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
        {/* Modal de edición de asignación */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar asignación</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Fechas</div>
                {editForm.dateRange && (
                  <DatePickerWithRange
                    date={editForm.dateRange}
                    setDate={dateRange => setEditForm(f => ({ ...f, dateRange }))}
                  />
                )}
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Proyecto</div>
                <Select
                  value={editForm.project_id}
                  onValueChange={value => setEditForm(f => ({ ...f, project_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar proyecto" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">% Asignación</div>
                <Select
                  value={String(editForm.allocation)}
                  onValueChange={value => setEditForm(f => ({ ...f, allocation: Number(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar %" />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSIGNMENT_ALLOCATION_VALUES.map(val => (
                      <SelectItem key={val} value={String(val)}>{val * 100}%</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_billable_edit"
                  checked={editForm.is_billable}
                  onChange={e => setEditForm(f => ({ ...f, is_billable: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <label htmlFor="is_billable_edit" className="text-sm">Facturable</label>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button onClick={handleEditAssignment} disabled={!editForm.project_id || !editForm.dateRange || !editForm.dateRange.from || !editForm.dateRange.to}>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DndContext>
    )
  },
)

ResourceTimeline.displayName = "ResourceTimeline"
