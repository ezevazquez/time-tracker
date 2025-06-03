"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"
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
} from "date-fns"
import { es } from "date-fns/locale"
import type { Person, Project, AssignmentWithRelations } from "@/lib/supabase"

interface ResourceTimelineProps {
  people: Person[]
  projects: Project[]
  assignments: AssignmentWithRelations[]
  viewMode: string
  setViewMode: (mode: string) => void
  dateRange: { from: Date; to: Date }
  setDateRange: (range: { from: Date; to: Date }) => void
}

// Generate a color based on a string (project name)
function stringToColor(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }

  // Resource Guru inspired color palette
  const colors = [
    "#4F46E5", // indigo
    "#059669", // emerald
    "#DC2626", // red
    "#7C3AED", // violet
    "#DB2777", // pink
    "#0891B2", // cyan
    "#CA8A04", // yellow
    "#EA580C", // orange
    "#16A34A", // green
    "#9333EA", // purple
  ]

  return colors[Math.abs(hash) % colors.length]
}

export function ResourceTimeline({
  people,
  projects,
  assignments,
  viewMode,
  setViewMode,
  dateRange,
  setDateRange,
}: ResourceTimelineProps) {
  // State for visible date range (for infinite scroll)
  const [visibleDateRange, setVisibleDateRange] = useState({
    start: subMonths(new Date(), 1),
    end: addMonths(new Date(), 2),
  })

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const lastScrollPosition = useRef(0)
  const isScrollingRef = useRef(false)

  // Constants for layout
  const DAY_WIDTH = 40 // Increased width for better readability
  const ROW_HEIGHT = 80 // Increased height for larger assignment blocks
  const SIDEBAR_WIDTH = 240 // Wider sidebar for better readability
  const HEADER_HEIGHT = 50 // Taller header for better readability

  // Generate all days in the visible date range
  const days = useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(visibleDateRange.start),
      end: endOfMonth(visibleDateRange.end),
    })
  }, [visibleDateRange])

  // Get active people
  const activePeople = people.filter((p) => p.status === "Active")

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
          const newScrollPosition = scrollLeft + DAY_WIDTH * getDaysInMonth(newStart)
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

  // Helper function to get days in a month
  function getDaysInMonth(date: Date): number {
    return differenceInDays(endOfMonth(date), startOfMonth(date)) + 1
  }

  // Get assignments for a person within the visible date range
  const getPersonAssignments = (personId: string) => {
    return assignments.filter((assignment) => {
      const startDate = new Date(assignment.start_date)
      const endDate = new Date(assignment.end_date)
      return (
        assignment.person_id === personId &&
        startDate <= endOfMonth(visibleDateRange.end) &&
        endDate >= startOfMonth(visibleDateRange.start)
      )
    })
  }

  // Calculate bar position and width for Resource Guru style
  const calculateBarDimensions = (assignment: AssignmentWithRelations) => {
    const startDate = new Date(assignment.start_date)
    const endDate = new Date(assignment.end_date)
    const visibleStart = startOfMonth(visibleDateRange.start)

    // Clamp dates to visible range boundaries
    const clampedStart = startDate < visibleStart ? visibleStart : startDate
    const clampedEnd = endDate > endOfMonth(visibleDateRange.end) ? endOfMonth(visibleDateRange.end) : endDate

    const startDayIndex = differenceInDays(clampedStart, visibleStart)
    const duration = differenceInDays(clampedEnd, clampedStart) + 1

    return {
      left: startDayIndex * DAY_WIDTH,
      width: Math.max(duration * DAY_WIDTH, 40), // Minimum width for very short assignments
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
  }, []) // Empty dependency array ensures this only runs once

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] w-full bg-white">
      {/* Timeline header with view selector */}
      <div className="flex justify-between items-center p-4 border-b bg-white z-40">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Resource Timeline</h2>
          <p className="text-sm text-gray-500">
            {format(startOfMonth(visibleDateRange.start), "MMM yyyy")} -{" "}
            {format(endOfMonth(visibleDateRange.end), "MMM yyyy")}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <label className="text-sm font-medium text-gray-700">View:</label>
          <Select value={viewMode} onValueChange={setViewMode}>
            <SelectTrigger className="w-40 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="people">By Person</SelectItem>
              <SelectItem value="projects">By Project</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Timeline container with unified scrolling */}
      <div className="relative flex-1 overflow-hidden">
        {/* Fixed top-left corner */}
        <div
          className="absolute top-0 left-0 z-30 bg-gray-50 border-b border-r border-gray-200 flex items-center"
          style={{ width: `${SIDEBAR_WIDTH}px`, height: `${HEADER_HEIGHT}px` }}
        >
          <div className="font-medium text-gray-700 text-sm uppercase tracking-wide p-4">Team Member</div>
        </div>

        {/* Sticky header - scrolls horizontally */}
        <div
          className="absolute top-0 left-0 right-0 z-20 overflow-hidden border-b border-gray-200"
          style={{ paddingLeft: `${SIDEBAR_WIDTH}px`, height: `${HEADER_HEIGHT}px` }}
        >
          <div className="flex" style={{ width: `${totalWidth}px` }}>
            {/* Month labels */}
            <div className="absolute top-0 left-0 right-0 flex h-6 border-b border-gray-100">
              {monthGroups.map((group, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 bg-gray-50/80 border-r border-gray-200 px-2 text-xs font-medium text-gray-700"
                  style={{ width: `${group.days.length * DAY_WIDTH}px` }}
                >
                  {format(group.month, "MMMM yyyy", { locale: es })}
                </div>
              ))}
            </div>

            {/* Day columns */}
            <div className="flex pt-6">
              {days.map((day, i) => (
                <div
                  key={i}
                  className={`
                    flex flex-col items-center justify-center text-sm border-r border-gray-100
                    ${isWeekend(day) ? "bg-gray-100/70" : "bg-white"}
                    ${isSameDay(day, today) ? "bg-blue-50 border-blue-200" : ""}
                  `}
                  style={{ width: `${DAY_WIDTH}px`, height: `${HEADER_HEIGHT - 6}px` }}
                >
                  <div className={`font-medium ${isSameDay(day, today) ? "text-blue-600" : "text-gray-900"}`}>
                    {format(day, "dd")}
                  </div>
                  <div className={`text-xs ${isSameDay(day, today) ? "text-blue-500" : "text-gray-400"}`}>
                    {format(day, "EEE", { locale: es })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sticky sidebar - scrolls vertically */}
        <div
          className="absolute top-0 left-0 bottom-0 z-10 overflow-hidden border-r border-gray-200"
          style={{ width: `${SIDEBAR_WIDTH}px`, paddingTop: `${HEADER_HEIGHT}px` }}
        >
          {activePeople.map((person, personIndex) => (
            <div
              key={person.id}
              className={`
                border-b border-gray-100 bg-white
                ${personIndex % 2 === 0 ? "" : "bg-gray-50/10"}
              `}
              style={{ height: `${ROW_HEIGHT}px` }}
            >
              <div className="p-4 flex items-center space-x-3 h-full">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="text-sm bg-gray-100 text-gray-600">
                    {person.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">{person.name}</div>
                  <div className="text-sm text-gray-500 truncate">{person.profile}</div>
                  <div className="text-xs text-gray-400">{person.type}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main scrollable area - scrolls both horizontally and vertically */}
        <div
          ref={scrollContainerRef}
          className="absolute inset-0 overflow-auto"
          style={{ paddingTop: `${HEADER_HEIGHT}px`, paddingLeft: `${SIDEBAR_WIDTH}px` }}
        >
          <div style={{ width: `${totalWidth}px` }}>
            <TooltipProvider>
              {activePeople.map((person, personIndex) => {
                const personAssignments = getPersonAssignments(person.id)

                return (
                  <div
                    key={person.id}
                    className={`
                      relative border-b border-gray-100 hover:bg-gray-50/30 transition-colors
                      ${personIndex % 2 === 0 ? "bg-white" : "bg-gray-50/20"}
                    `}
                    style={{ height: `${ROW_HEIGHT}px` }}
                  >
                    {/* Weekend background */}
                    {days.map((day, i) => (
                      <div
                        key={i}
                        className={`
                          absolute top-0 bottom-0 border-r border-gray-50
                          ${isWeekend(day) ? "bg-gray-50/50" : ""}
                          ${isSameDay(day, today) ? "bg-blue-50/30" : ""}
                        `}
                        style={{
                          left: `${i * DAY_WIDTH}px`,
                          width: `${DAY_WIDTH}px`,
                        }}
                      />
                    ))}

                    {/* Assignment bars */}
                    {personAssignments.map((assignment, idx) => {
                      const project = projects.find((p) => p.id === assignment.project_id)
                      if (!project) return null

                      const dimensions = calculateBarDimensions(assignment)
                      const bgColor = stringToColor(project.name)

                      // Calculate vertical position - distribute evenly in the row
                      const totalAssignments = personAssignments.length
                      const assignmentHeight = Math.min(ROW_HEIGHT * 0.7, 36) // Max 70% of row height or 36px
                      const verticalGap = (ROW_HEIGHT - assignmentHeight * totalAssignments) / (totalAssignments + 1)
                      const top = verticalGap + idx * (assignmentHeight + verticalGap)

                      return (
                        <Tooltip key={assignment.id}>
                          <TooltipTrigger asChild>
                            <Link href={`/assignments/${assignment.id}/edit`} className="block">
                              <div
                                className="absolute rounded-lg shadow-md cursor-pointer transition-all hover:shadow-lg hover:translate-y-[-2px] group border border-white/20"
                                style={{
                                  backgroundColor: bgColor,
                                  left: `${dimensions.left}px`,
                                  width: `${dimensions.width}px`,
                                  top: `${top}px`,
                                  height: `${assignmentHeight}px`,
                                  zIndex: 5,
                                }}
                              >
                                <div className="px-3 py-2 text-white font-medium truncate h-full flex items-center">
                                  <span className="truncate">{project.name}</span>

                                  {/* Allocation badge */}
                                  {assignment.allocation < 100 && (
                                    <span className="ml-2 bg-black/30 text-white text-xs px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                      {assignment.allocation}%
                                    </span>
                                  )}
                                </div>
                              </div>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="bg-gray-900 text-white border-gray-700 p-3 max-w-xs">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: bgColor }}></div>
                                <p className="font-medium">{project.name}</p>
                              </div>
                              <p className="text-sm">
                                {format(dimensions.startDate, "dd MMM")} - {format(dimensions.endDate, "dd MMM yyyy")}
                              </p>
                              <p className="text-sm">{assignment.allocation}% allocation</p>
                              {assignment.assigned_role && <p className="text-sm">Role: {assignment.assigned_role}</p>}
                              {project.description && <p className="text-xs opacity-75">{project.description}</p>}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )
                    })}

                    {/* Today indicator line */}
                    {days.some((day) => isSameDay(day, today)) && (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-10 pointer-events-none opacity-70"
                        style={{
                          left: `${differenceInDays(today, startOfMonth(visibleDateRange.start)) * DAY_WIDTH + DAY_WIDTH / 2}px`,
                        }}
                      />
                    )}
                  </div>
                )
              })}

              {activePeople.length === 0 && (
                <div className="p-12 text-center text-gray-500">
                  <div className="text-lg font-medium mb-2">No active team members</div>
                  <div className="text-sm">Add people with "Active" status to see their assignments</div>
                </div>
              )}
            </TooltipProvider>
          </div>
        </div>
      </div>
    </div>
  )
}
