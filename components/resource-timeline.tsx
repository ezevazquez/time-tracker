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
}

export const ResourceTimeline = forwardRef<{ scrollToToday: () => void }, ResourceTimelineProps>(
  ({ people, projects, assignments, filters, onFiltersChange, onClearFilters, onScrollToTodayRef }, ref) => {
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

    // Debug: log people and filteredPeople
    console.log('people:', people)

    return (
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
              {filteredPeople.map((person, personIndex) => {
                const personAssignments = getPersonAssignments(person.id)

                return (
                  <PersonRow
                    key={person.id}
                    person={person}
                    assignments={personAssignments}
                    projects={projects}
                    days={days}
                    visibleDateRange={visibleDateRange}
                    dayWidth={DAY_WIDTH}
                    sidebarWidth={SIDEBAR_WIDTH}
                    baseRowHeight={BASE_ROW_HEIGHT}
                    totalWidth={totalWidth}
                    scrollLeft={scrollLeft}
                    today={today}
                    isEvenRow={personIndex % 2 === 0}
                  />
                )
              })}

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
    )
  },
)

ResourceTimeline.displayName = "ResourceTimeline"
