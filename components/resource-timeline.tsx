"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, UserCheck, UserX, Briefcase, AlertTriangle, Calendar, TrendingUp, CalendarDays } from "lucide-react"
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
  const DAY_WIDTH = 40
  const ROW_HEIGHT = 80
  const SIDEBAR_WIDTH = 240
  const HEADER_HEIGHT = 60
  const INFO_SECTION_HEIGHT = 80 // Reduced height for compact summary

  // Generate all days in the visible date range
  const days = useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(visibleDateRange.start),
      end: endOfMonth(visibleDateRange.end),
    })
  }, [visibleDateRange])

  // Get active people and projects
  const activePeople = people.filter((p) => p.status === "Active")
  const activeProjects = projects.filter((p) => p.status === "In Progress")

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    // People with assignments
    const peopleWithAssignments = new Set(assignments.map((a) => a.person_id))
    const assignedPeople = activePeople.filter((p) => peopleWithAssignments.has(p.id))
    const unassignedPeople = activePeople.filter((p) => !peopleWithAssignments.has(p.id))

    // Calculate average utilization
    const personUtilization = activePeople.map((person) => {
      const personAssignments = assignments.filter((a) => a.person_id === person.id)
      const totalAllocation = personAssignments.reduce((sum, a) => sum + a.allocation, 0)
      return totalAllocation
    })
    const avgUtilization =
      personUtilization.length > 0
        ? personUtilization.reduce((sum, util) => sum + util, 0) / personUtilization.length
        : 0

    // Projects without people
    const projectsWithPeople = new Set(assignments.map((a) => a.project_id))
    const projectsWithoutPeople = activeProjects.filter((p) => !projectsWithPeople.has(p.id))

    // Overallocated assignments (>100%)
    const overallocatedAssignments = assignments.filter((a) => a.allocation > 100)

    // Overallocated people (total allocation > 100%)
    const overallocatedPeople = activePeople.filter((person) => {
      const personAssignments = assignments.filter((a) => a.person_id === person.id)
      const totalAllocation = personAssignments.reduce((sum, a) => sum + a.allocation, 0)
      return totalAllocation > 100
    })

    return {
      totalActivePeople: activePeople.length,
      assignedPeople: assignedPeople.length,
      unassignedPeople: unassignedPeople.length,
      avgUtilization: Math.round(avgUtilization),
      totalActiveProjects: activeProjects.length,
      projectsWithoutPeople: projectsWithoutPeople.length,
      totalAssignments: assignments.length,
      overallocatedAssignments: overallocatedAssignments.length,
      overallocatedPeople: overallocatedPeople.length,
    }
  }, [activePeople, activeProjects, assignments])

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

  // Function to scroll to today
  const scrollToToday = () => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    const visibleStart = startOfMonth(visibleDateRange.start)
    const today = new Date()
    const todayIndex = differenceInDays(today, visibleStart)
    const scrollPosition = todayIndex * DAY_WIDTH - scrollContainer.clientWidth / 2

    scrollContainer.scrollTo({
      left: Math.max(0, scrollPosition),
      behavior: "smooth",
    })
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
  }, [])

  return (
    <div className="w-full h-[calc(100vh-64px)] bg-white flex flex-col">
      {/* Compact Summary Section */}
      <div
        className="flex-shrink-0 bg-gray-50/30 border-b border-gray-200"
        style={{ height: `${INFO_SECTION_HEIGHT}px` }}
      >
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Compact Summary Badges */}
            <div className="flex items-center space-x-4">
              {/* People Summary */}
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 bg-blue-50 px-2 py-1 rounded-md">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">{summaryStats.totalActivePeople}</span>
                  <span className="text-xs text-blue-700">people</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Badge variant="outline" className="text-xs h-6 border-green-200 text-green-700">
                    <UserCheck className="h-3 w-3 mr-1" />
                    {summaryStats.assignedPeople}
                  </Badge>
                  {summaryStats.unassignedPeople > 0 && (
                    <Badge variant="outline" className="text-xs h-6 border-gray-200 text-gray-600">
                      <UserX className="h-3 w-3 mr-1" />
                      {summaryStats.unassignedPeople}
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className={`text-xs h-6 ${
                      summaryStats.avgUtilization > 100
                        ? "border-red-200 text-red-700"
                        : summaryStats.avgUtilization > 80
                          ? "border-orange-200 text-orange-700"
                          : "border-green-200 text-green-700"
                    }`}
                  >
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {summaryStats.avgUtilization}%
                  </Badge>
                </div>
              </div>

              {/* Projects Summary */}
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 bg-green-50 px-2 py-1 rounded-md">
                  <Briefcase className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">{summaryStats.totalActiveProjects}</span>
                  <span className="text-xs text-green-700">projects</span>
                </div>
                {summaryStats.projectsWithoutPeople > 0 && (
                  <Badge variant="outline" className="text-xs h-6 border-orange-200 text-orange-700">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {summaryStats.projectsWithoutPeople} unstaffed
                  </Badge>
                )}
              </div>

              {/* Assignments Summary */}
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 bg-purple-50 px-2 py-1 rounded-md">
                  <Calendar className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">{summaryStats.totalAssignments}</span>
                  <span className="text-xs text-purple-700">assignments</span>
                </div>
                {summaryStats.overallocatedAssignments > 0 && (
                  <Badge variant="destructive" className="text-xs h-6">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {summaryStats.overallocatedAssignments} over 100%
                  </Badge>
                )}
              </div>
            </div>

            {/* Today Button */}
            <Button onClick={scrollToToday} variant="outline" size="sm" className="h-8">
              <CalendarDays className="h-4 w-4 mr-2" />
              Today
            </Button>
          </div>
        </div>
      </div>

      {/* Timeline container - takes remaining height */}
      <div className="flex-1 relative overflow-hidden">
        {/* Main scrollable area - scrolls both horizontally and vertically */}
        <div ref={scrollContainerRef} className="absolute inset-0 overflow-auto">
          <div className="flex">
            {/* Sidebar - sticky horizontally, scrolls vertically */}
            <div
              className="sticky left-0 z-20 bg-white border-r border-gray-200 flex-shrink-0"
              style={{ width: `${SIDEBAR_WIDTH}px` }}
            >
              {/* Sidebar header */}
              <div
                className="sticky top-0 z-30 bg-gray-50 border-b border-gray-200 flex items-center px-4"
                style={{ height: `${HEADER_HEIGHT}px` }}
              >
                <div className="font-medium text-gray-700 text-sm uppercase tracking-wide">Team Member</div>
              </div>

              {/* Person rows */}
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

            {/* Timeline content area - scrolls horizontally */}
            <div style={{ width: `${totalWidth}px` }}>
              {/* Header - sticky vertically, scrolls horizontally */}
              <div
                className="sticky top-0 z-10 bg-white border-b border-gray-200"
                style={{ height: `${HEADER_HEIGHT}px` }}
              >
                {/* Month labels */}
                <div className="flex h-6 border-b border-gray-100">
                  {monthGroups.map((group, i) => (
                    <div
                      key={i}
                      className="flex-shrink-0 bg-gray-50/80 border-r border-gray-200 px-2 text-xs font-medium text-gray-700 flex items-center"
                      style={{ width: `${group.days.length * DAY_WIDTH}px` }}
                    >
                      {format(group.month, "MMMM yyyy", { locale: es })}
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
                        ${isWeekend(day) ? "bg-gray-100/70" : "bg-white"}
                        ${isSameDay(day, today) ? "bg-blue-50 border-blue-200" : ""}
                      `}
                      style={{ width: `${DAY_WIDTH}px`, height: `${HEADER_HEIGHT - 24}px` }}
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

              {/* Assignment rows */}
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
                        const assignmentHeight = Math.min(ROW_HEIGHT * 0.7, 36)
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
                                {assignment.assigned_role && (
                                  <p className="text-sm">Role: {assignment.assigned_role}</p>
                                )}
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
    </div>
  )
}
