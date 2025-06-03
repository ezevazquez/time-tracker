"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Edit } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"
import {
  format,
  eachDayOfInterval,
  isWeekend,
  isSameDay,
  startOfMonth,
  endOfMonth,
  addMonths,
  differenceInDays,
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
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Calculate days in the current view
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const DAY_WIDTH = 28 // Width of each day column in pixels
  const ROW_HEIGHT = 56 // Fixed row height for consistency
  const SIDEBAR_WIDTH = 200 // Width of the person info column

  // Navigate to previous/next month
  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => addMonths(prev, direction === "next" ? 1 : -1))
  }

  // Get active people
  const activePeople = people.filter((p) => p.status === "Active")

  // Get assignments for a person within the current month view
  const getPersonAssignments = (personId: string) => {
    return assignments.filter((assignment) => {
      const startDate = new Date(assignment.start_date)
      const endDate = new Date(assignment.end_date)
      return assignment.person_id === personId && startDate <= monthEnd && endDate >= monthStart
    })
  }

  // Calculate bar position and width for Resource Guru style
  const calculateBarDimensions = (assignment: AssignmentWithRelations) => {
    const startDate = new Date(assignment.start_date)
    const endDate = new Date(assignment.end_date)

    // Clamp dates to month boundaries
    const clampedStart = startDate < monthStart ? monthStart : startDate
    const clampedEnd = endDate > monthEnd ? monthEnd : endDate

    const startDayIndex = differenceInDays(clampedStart, monthStart)
    const duration = differenceInDays(clampedEnd, clampedStart) + 1

    return {
      left: startDayIndex * DAY_WIDTH + 4, // Small left margin
      width: Math.max(duration * DAY_WIDTH - 8, 20), // Minimum width with margins
      startDate,
      endDate,
      clampedStart,
      clampedEnd,
    }
  }

  const today = new Date()
  const totalWidth = days.length * DAY_WIDTH

  return (
    <Card className="mb-8 shadow-sm border-0 bg-white">
      <CardHeader className="pb-3 border-b bg-gray-50/30">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">Resource Timeline</CardTitle>
            <CardDescription className="text-gray-600 text-sm">
              {format(monthStart, "MMMM yyyy", { locale: es })}
            </CardDescription>
          </div>

          <div className="flex items-center space-x-2 mt-2 sm:mt-0">
            <Button variant="ghost" size="sm" onClick={() => navigateMonth("prev")} className="h-7 w-7 p-0">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigateMonth("next")} className="h-7 w-7 p-0">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-xs font-medium text-gray-700">View:</label>
          <Select value={viewMode} onValueChange={setViewMode}>
            <SelectTrigger className="w-32 h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="people">By Person</SelectItem>
              <SelectItem value="projects">By Project</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Timeline container with unified scrolling */}
        <div className="relative bg-white" style={{ height: "calc(100vh - 300px)" }}>
          {/* Fixed top-left corner */}
          <div
            className="absolute top-0 left-0 z-30 bg-gray-50 border-b border-r border-gray-200"
            style={{ width: `${SIDEBAR_WIDTH}px`, height: "40px" }}
          >
            <div className="font-medium text-gray-700 text-xs uppercase tracking-wide p-2">Team Member</div>
          </div>

          {/* Sticky header - scrolls horizontally */}
          <div
            className="absolute top-0 left-0 right-0 z-20 overflow-hidden border-b border-gray-200"
            style={{ paddingLeft: `${SIDEBAR_WIDTH}px`, height: "40px" }}
          >
            <div className="flex" style={{ width: `${totalWidth}px` }}>
              {days.map((day, i) => (
                <div
                  key={i}
                  className={`
                    flex flex-col items-center justify-center text-xs border-r border-gray-100
                    ${isWeekend(day) ? "bg-gray-100/70" : "bg-white"}
                    ${isSameDay(day, today) ? "bg-blue-50 border-blue-200" : ""}
                  `}
                  style={{ width: `${DAY_WIDTH}px`, height: "40px" }}
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

          {/* Sticky sidebar - scrolls vertically */}
          <div
            className="absolute top-0 left-0 bottom-0 z-10 overflow-hidden border-r border-gray-200"
            style={{ width: `${SIDEBAR_WIDTH}px`, paddingTop: "40px" }}
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
                <div className="p-3 flex items-center space-x-3 h-full">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-xs bg-gray-100 text-gray-600">
                      {person.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm truncate">{person.name}</div>
                    <div className="text-xs text-gray-500 truncate">{person.profile}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Main scrollable area - scrolls both horizontally and vertically */}
          <div
            ref={scrollContainerRef}
            className="absolute inset-0 overflow-auto"
            style={{ paddingTop: "40px", paddingLeft: `${SIDEBAR_WIDTH}px` }}
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

                        return (
                          <Tooltip key={assignment.id}>
                            <TooltipTrigger asChild>
                              <Link href={`/assignments/${assignment.id}/edit`}>
                                <div
                                  className="absolute rounded-lg shadow-sm cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] group border border-white/50"
                                  style={{
                                    backgroundColor: bgColor,
                                    left: `${dimensions.left}px`,
                                    width: `${dimensions.width}px`,
                                    top: `${12 + idx * 20}px`,
                                    height: "16px",
                                    zIndex: 5,
                                  }}
                                >
                                  <div className="px-2 text-white text-xs font-medium truncate h-full flex items-center">
                                    {project.name}
                                  </div>

                                  {/* Edit icon on hover */}
                                  <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Edit className="h-3 w-3 text-white/80" />
                                  </div>

                                  {/* Allocation indicator */}
                                  {assignment.allocation < 100 && (
                                    <div
                                      className="absolute top-0 right-0 bg-black/30 text-white text-xs px-1 rounded-tr-lg rounded-bl-md"
                                      style={{ fontSize: "9px", lineHeight: "12px" }}
                                    >
                                      {assignment.allocation}%
                                    </div>
                                  )}
                                </div>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-gray-900 text-white border-gray-700">
                              <div className="space-y-1">
                                <p className="font-medium">{project.name}</p>
                                <p className="text-xs opacity-90">
                                  {format(dimensions.startDate, "dd MMM")} - {format(dimensions.endDate, "dd MMM yyyy")}
                                </p>
                                <p className="text-xs opacity-90">{assignment.allocation}% allocation</p>
                                {assignment.assigned_role && (
                                  <p className="text-xs opacity-90">Role: {assignment.assigned_role}</p>
                                )}
                                {project.description && (
                                  <p className="text-xs opacity-75 max-w-xs">{project.description}</p>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        )
                      })}

                      {/* Today indicator line */}
                      {today >= monthStart && today <= monthEnd && (
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-blue-400 z-10 pointer-events-none opacity-60"
                          style={{
                            left: `${differenceInDays(today, monthStart) * DAY_WIDTH + DAY_WIDTH / 2}px`,
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
      </CardContent>
    </Card>
  )
}
