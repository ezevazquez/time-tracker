'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { CalendarDays } from 'lucide-react'
import Link from 'next/link'
import {
  format,
  eachDayOfInterval,
  isWeekend,
  isSameDay,
  addMonths,
  subMonths,
  differenceInDays,
  startOfMonth,
  endOfMonth,
  isSameMonth,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { FiltersPopover } from './filters-popover'
import type { Person } from '@/types/people'
import type { Project } from '@/types/project'
import type { AssignmentWithRelations } from '@/types/assignment'
import { fteToPercentage, parseDateFromString } from '@/lib/assignments'
import { getDisplayName, getInitials } from '@/lib/people'

interface ResourceTimelineProps {
  people: Person[]
  projects: Project[]
  assignments: AssignmentWithRelations[]
  filters: {
    personProfile: string
    projectStatus: string
    dateRange: { from: Date; to: Date }
    overallocatedOnly: boolean
  }
  onFiltersChange: (filters: any) => void
  onClearFilters: () => void
}

// Generate a color based on a string (project name)
function stringToColor(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }

  // Resource Guru inspired color palette
  const colors = [
    '#4F46E5', // indigo
    '#059669', // emerald
    '#DC2626', // red
    '#7C3AED', // violet
    '#DB2777', // pink
    '#0891B2', // cyan
    '#CA8A04', // yellow
    '#EA580C', // orange
    '#16A34A', // green
    '#9333EA', // purple
  ]

  return colors[Math.abs(hash) % colors.length]
}

export function ResourceTimeline({
  people,
  projects,
  assignments,
  filters,
  onFiltersChange,
  onClearFilters,
}: ResourceTimelineProps) {
  // State for visible date range (for infinite scroll)
  const [visibleDateRange, setVisibleDateRange] = useState({
    start: subMonths(new Date(), 1),
    end: addMonths(new Date(), 2),
  })

  // State for tracking scroll position to show sticky labels
  const [scrollLeft, setScrollLeft] = useState(0)

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const lastScrollPosition = useRef(0)
  const isScrollingRef = useRef(false)

  // Constants for layout
  const DAY_WIDTH = 40
  const ROW_HEIGHT = 80
  const SIDEBAR_WIDTH = 240
  const HEADER_HEIGHT = 60
  const TOP_BAR_HEIGHT = 48 // Reduced height

  // Track scroll position
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    const handleScrollUpdate = () => {
      setScrollLeft(scrollContainer.scrollLeft)
    }

    scrollContainer.addEventListener('scroll', handleScrollUpdate)
    return () => {
      scrollContainer.removeEventListener('scroll', handleScrollUpdate)
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
    return assignments.filter(assignment => {
      const startDate = parseDateFromString(assignment.start_date)
      const endDate = parseDateFromString(assignment.end_date)
      return (
        assignment.person_id === personId &&
        startDate <= endOfMonth(visibleDateRange.end) &&
        endDate >= startOfMonth(visibleDateRange.start)
      )
    })
  }

  // Get active people and projects
  const activePeople = people.filter(p => p.status === 'Active' || p.status === 'Paused')

  const timelineData = activePeople.map(person => {
    const personAssignments = assignments.filter(a => a.person_id === person.id)
    return {
      person,
      assignments: personAssignments
    }
  })

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
        setVisibleDateRange(prev => ({ ...prev, start: newStart }))

        // Maintain scroll position when adding content to the left
        setTimeout(() => {
          const newScrollPosition = scrollLeft + DAY_WIDTH * getDaysInMonth(newStart)
          scrollContainer.scrollLeft = newScrollPosition
          isScrollingRef.current = false
        }, 10)
      }

      // If we're near the right edge, add a month to the end
      if (scrollRight < 300 && scrollLeft > lastScrollPosition.current) {
        isScrollingRef.current = true
        setVisibleDateRange(prev => ({ ...prev, end: addMonths(prev.end, 1) }))
        setTimeout(() => {
          isScrollingRef.current = false
        }, 10)
      }

      lastScrollPosition.current = scrollLeft
    }

    scrollContainer.addEventListener('scroll', handleScroll)
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll)
    }
  }, [visibleDateRange, DAY_WIDTH])

  // Helper function to get days in a month
  function getDaysInMonth(date: Date): number {
    return differenceInDays(endOfMonth(date), startOfMonth(date)) + 1
  }

  // Function to scroll to today
  const scrollToToday = () => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    const visibleStart = startOfMonth(visibleDateRange.start)
    const today = new Date()
    const todayIndex = differenceInDays(today, visibleStart)

    // Position today at 25% of the visible width (left-aligned) instead of centered
    const scrollPosition = todayIndex * DAY_WIDTH - scrollContainer.clientWidth * 0.2

    scrollContainer.scrollTo({
      left: Math.max(0, scrollPosition),
      behavior: 'smooth',
    })
  }

  // Calculate bar position and width for Resource Guru style
  const calculateBarDimensions = (assignment: AssignmentWithRelations) => {
    const startDate = parseDateFromString(assignment.start_date)
    const endDate = parseDateFromString(assignment.end_date)
    const visibleStart = startOfMonth(visibleDateRange.start)

    // Clamp dates to visible range boundaries
    const clampedStart = startDate < visibleStart ? visibleStart : startDate
    const clampedEnd =
      endDate > endOfMonth(visibleDateRange.end) ? endOfMonth(visibleDateRange.end) : endDate

    const startDayIndex = differenceInDays(clampedStart, visibleStart)
    const duration = differenceInDays(clampedEnd, clampedStart) + 1

    return {
      left: startDayIndex * DAY_WIDTH,
      width: Math.max(duration * DAY_WIDTH, 40),
      startDate,
      endDate,
      clampedStart,
      clampedEnd,
    }
  }

  // Group days by month for header display
  const monthGroups = useMemo(() => {
    const groups: { month: Date; days: Date[] }[] = []
    let currentMonth: Date | null = null
    let currentDays: Date[] = []

    days.forEach(day => {
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
      groups.push({ month: currentMonth, days: currentDays })
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
    const todayIndex = differenceInDays(today, visibleStart)
    const scrollPosition = todayIndex * DAY_WIDTH - scrollContainer.clientWidth / 2

    scrollContainer.scrollLeft = Math.max(0, scrollPosition)
  }, [])

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-white">
      {/* Fixed Top Bar */}
      <div
        className="flex-shrink-0 bg-white border-b border-gray-200 px-6 flex items-center justify-between"
        style={{ height: `${TOP_BAR_HEIGHT}px` }}
      >
        {/* Left: Today Button */}
        <Button onClick={scrollToToday} variant="outline" size="sm" className="h-8">
          <CalendarDays className="h-4 w-4 mr-2" />
          Hoy
        </Button>

        {/* Right: Filters Button */}
        <FiltersPopover
          people={people}
          projects={projects}
          filters={filters}
          onFiltersChange={onFiltersChange}
          onClearFilters={onClearFilters}
          showDateRange={false}
        />
      </div>

      {/* Timeline container - takes remaining height */}
      <div className="flex-1 min-h-0 relative">
        {/* Main scrollable container */}
        <div
          ref={scrollContainerRef}
          className="absolute inset-0 overflow-auto"
          style={{
            overflowX: 'auto',
            overflowY: 'auto',
          }}
        >
          {/* Timeline grid container */}
          <div className="relative" style={{ minWidth: `${SIDEBAR_WIDTH + totalWidth}px` }}>
            {/* Sticky header row */}
            <div
              className="sticky top-0 z-20 bg-white border-b border-gray-200 flex"
              style={{ height: `${HEADER_HEIGHT}px` }}
            >
              {/* Header left corner - Team Member label */}
              <div
                className="sticky left-0 z-30 bg-gray-50 border-r border-gray-200 flex items-center px-4"
                style={{ width: `${SIDEBAR_WIDTH}px` }}
              >
                <div className="font-medium text-gray-700 text-sm uppercase tracking-wide">
                  Miembro del equipo
                </div>
              </div>

              {/* Header timeline section */}
              <div style={{ width: `${totalWidth}px` }}>
                {/* Month labels */}
                <div className="flex h-6 border-b border-gray-100">
                  {monthGroups.map((group, i) => (
                    <div
                      key={i}
                      className="flex-shrink-0 bg-gray-50/80 border-r border-gray-200 px-2 text-xs font-medium text-gray-700 flex items-center"
                      style={{ width: `${group.days.length * DAY_WIDTH}px` }}
                    >
                      {format(group.month, 'MMMM yyyy', { locale: es })}
                    </div>
                  ))}
                </div>

                {/* Day columns */}
                <div className="flex">
                  {days.map((day, i) => (
                    <div
                      key={i}
                      className={`
                  flex flex-col items-center justify-center text-sm border-r border-gray-100
                  ${isWeekend(day) ? 'bg-gray-100/70' : 'bg-white'}
                  ${isSameDay(day, today) ? 'bg-blue-50 border-blue-200' : ''}
                `}
                      style={{ width: `${DAY_WIDTH}px`, height: `${HEADER_HEIGHT - 24}px` }}
                    >
                      <div
                        className={`font-medium ${isSameDay(day, today) ? 'text-blue-600' : 'text-gray-900'}`}
                      >
                        {format(day, 'dd')}
                      </div>
                      <div
                        className={`text-xs ${isSameDay(day, today) ? 'text-blue-500' : 'text-gray-400'}`}
                      >
                        {format(day, 'EEE', { locale: es })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Content rows */}
            <TooltipProvider>
              {activePeople.map((person, personIndex) => {
                const personAssignments = getPersonAssignments(person.id)

                const renderAssignmentLabel = (
                  project: Project,
                  assignment: AssignmentWithRelations
                ) => (
                  <div className="px-3 py-2 text-white font-medium truncate h-full flex items-center text-sm">
                    <span className="truncate">{project.name}</span>
                    <span className="ml-2 bg-black/30 text-white text-xs px-1.5 py-0.5 rounded-full whitespace-nowrap">
                      {fteToPercentage(assignment.allocation)}%
                    </span>
                  </div>
                )

                return (
                  <div
                    key={person.id}
                    className={`
          flex border-b border-gray-100 hover:bg-gray-50/30 transition-colors
          ${personIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/20'}
        `}
                    style={{ height: `${ROW_HEIGHT}px` }}
                  >
                    {/* Sidebar */}
                    <div
                      className="sticky left-0 z-10 bg-white border-r border-gray-200 flex items-center"
                      style={{ width: `${SIDEBAR_WIDTH}px` }}
                    >
                      <div className="p-4 flex items-center space-x-3 w-full">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="text-sm bg-gray-100 text-gray-600">
                            {getInitials(person)}
                          </AvatarFallback>
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
                ${isWeekend(day) ? 'bg-gray-50/50' : ''}
                ${isSameDay(day, today) ? 'bg-blue-50/30' : ''}
              `}
                          style={{
                            left: `${i * DAY_WIDTH}px`,
                            width: `${DAY_WIDTH}px`,
                          }}
                        />
                      ))}

                      {/* Assignment bars */}
                      {personAssignments.map((assignment, idx) => {
                        const project = projects.find(p => p.id === assignment.project_id)
                        if (!project) return null

                        const dimensions = calculateBarDimensions(assignment)
                        const bgColor = stringToColor(project.name)

                        const totalAssignments = personAssignments.length
                        const assignmentHeight = Math.min(ROW_HEIGHT * 0.7, 36)
                        const verticalGap =
                          (ROW_HEIGHT - assignmentHeight * totalAssignments) /
                          (totalAssignments + 1)
                        const top = verticalGap + idx * (assignmentHeight + verticalGap)

                        // Calculate sticky behavior
                        const barStart = dimensions.left
                        const barEnd = dimensions.left + dimensions.width
                        const labelMaxWidth = barEnd - scrollLeft
                        const isSticky = scrollLeft > barStart && scrollLeft < barEnd

                        return (
                          <Tooltip key={assignment.id}>
                            <TooltipTrigger asChild>
                              <Link href={`/assignments/${assignment.id}/edit`} className="block">
                                <div
                                  className="absolute rounded-lg shadow-md cursor-pointer transition-all hover:shadow-lg hover:translate-y-[-2px] group border border-white/20 overflow-hidden"
                                  style={{
                                    backgroundColor: bgColor,
                                    left: `${dimensions.left}px`,
                                    width: `${dimensions.width}px`,
                                    top: `${top}px`,
                                    height: `${assignmentHeight}px`,
                                    zIndex: 5,
                                  }}
                                >
                                  <div
                                    className={`${isSticky ? 'sticky' : ''}`}
                                    style={{
                                      left: `${SIDEBAR_WIDTH}px`,
                                      maxWidth: `${labelMaxWidth}px`,
                                      background: isSticky ? 'inherit' : 'none',
                                    }}
                                  >
                                    {renderAssignmentLabel(project, assignment)}
                                  </div>
                                </div>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              className="bg-gray-900 text-white border-gray-700 p-3 max-w-xs"
                            >
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: bgColor }}
                                  ></div>
                                  <p className="font-medium">{project.name}</p>
                                </div>
                                <p className="text-sm">
                                  {format(dimensions.startDate, 'dd MMM')} -{' '}
                                  {format(dimensions.endDate, 'dd MMM yyyy')}
                                </p>
                                <p className="text-sm">
                                  {fteToPercentage(assignment.allocation)}% asignación
                                </p>
                                {assignment.assigned_role && (
                                  <p className="text-sm">Rol: {assignment.assigned_role}</p>
                                )}
                                <p className="text-sm">
                                  Facturable: {assignment.is_billable ? 'Sí' : 'No'}
                                </p>
                                {project.description && (
                                  <p className="text-xs opacity-75">{project.description}</p>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        )
                      })}

                      {/* Today marker */}
                      {days.some(day => isSameDay(day, today)) && (
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-10 pointer-events-none opacity-70"
                          style={{
                            left: `${differenceInDays(today, startOfMonth(visibleDateRange.start)) * DAY_WIDTH + DAY_WIDTH / 2}px`,
                          }}
                        />
                      )}
                    </div>
                  </div>
                )
              })}

              {activePeople.length === 0 && (
                <div className="p-12 text-center text-gray-500">
                  <div className="text-lg font-medium mb-2">No hay miembros activos del equipo</div>
                  <div className="text-sm">
                    Agrega personas con estado "Activo" para ver sus asignaciones
                  </div>
                </div>
              )}
            </TooltipProvider>
          </div>
        </div>
      </div>
    </div>
  )
}
