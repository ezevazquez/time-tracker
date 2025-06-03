"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
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

  // Use Resource Guru inspired colors
  const colors = [
    "#3B82F6", // blue
    "#10B981", // emerald
    "#F59E0B", // amber
    "#8B5CF6", // violet
    "#EF4444", // red
    "#06B6D4", // cyan
    "#84CC16", // lime
    "#F97316", // orange
    "#EC4899", // pink
    "#6366F1", // indigo
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
  const headerRef = useRef<HTMLDivElement>(null)

  // Calculate days in the current view
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const DAY_WIDTH = 32 // Width of each day column in pixels

  // Sync horizontal scrolling between header and content
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    const header = headerRef.current

    if (!scrollContainer || !header) return

    const handleScroll = () => {
      if (header) {
        header.scrollLeft = scrollContainer.scrollLeft
      }
    }

    scrollContainer.addEventListener("scroll", handleScroll)
    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll)
    }
  }, [])

  // Navigate to previous/next month
  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => addMonths(prev, direction === "next" ? 1 : -1))
  }

  // Get active people
  const activePeople = people.filter((p) => p.status === "activo")

  // Get assignments for a person within the current month view
  const getPersonAssignments = (personId: string) => {
    return assignments.filter((assignment) => {
      const startDate = new Date(assignment.start_date)
      const endDate = new Date(assignment.end_date)

      // Check if assignment overlaps with current month
      return assignment.person_id === personId && startDate <= monthEnd && endDate >= monthStart
    })
  }

  // Calculate bar position and width
  const calculateBarDimensions = (assignment: AssignmentWithRelations) => {
    const startDate = new Date(assignment.start_date)
    const endDate = new Date(assignment.end_date)

    // Clamp dates to month boundaries
    const clampedStart = startDate < monthStart ? monthStart : startDate
    const clampedEnd = endDate > monthEnd ? monthEnd : endDate

    const startDayIndex = differenceInDays(clampedStart, monthStart)
    const duration = differenceInDays(clampedEnd, clampedStart) + 1

    return {
      left: startDayIndex * DAY_WIDTH,
      width: duration * DAY_WIDTH - 2, // -2px for spacing
      startDate,
      endDate,
      clampedStart,
      clampedEnd,
    }
  }

  const today = new Date()

  return (
    <Card className="mb-8 shadow-sm">
      <CardHeader className="pb-4 border-b bg-gray-50/50">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <div>
            <CardTitle className="text-xl font-semibold text-gray-900">Timeline de Recursos</CardTitle>
            <CardDescription className="text-gray-600">
              {format(monthStart, "MMMM yyyy", { locale: es })}
            </CardDescription>
          </div>

          <div className="flex items-center space-x-2 mt-2 sm:mt-0">
            <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")} className="h-8 w-8 p-0">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateMonth("next")} className="h-8 w-8 p-0">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Vista:</label>
          <Select value={viewMode} onValueChange={setViewMode}>
            <SelectTrigger className="w-40 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="people">Por Persona</SelectItem>
              <SelectItem value="projects">Por Proyecto</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="bg-white">
          {/* Timeline Header - Days */}
          <div className="border-b bg-gray-50/30 sticky top-0 z-20">
            <div className="flex">
              {/* Resource info column */}
              <div className="min-w-[240px] border-r bg-gray-50/50 p-3 sticky left-0 z-10">
                <div className="font-medium text-gray-900 text-sm">Persona</div>
              </div>

              {/* Days columns - Scrollable */}
              <div className="overflow-x-auto" ref={headerRef}>
                <div className="flex" style={{ minWidth: `${days.length * DAY_WIDTH}px` }}>
                  {days.map((day, i) => (
                    <div
                      key={i}
                      className={`
                        flex flex-col items-center justify-center text-xs border-r border-gray-200
                        ${isWeekend(day) ? "bg-gray-100/50" : ""}
                        ${isSameDay(day, today) ? "bg-blue-50 border-blue-200" : ""}
                      `}
                      style={{ width: `${DAY_WIDTH}px`, minHeight: "48px" }}
                    >
                      <div className="font-medium text-gray-900">{format(day, "dd")}</div>
                      <div className="text-gray-500 text-xs">{format(day, "EEE", { locale: es })}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Content - People and Assignments */}
          <div className="overflow-auto" style={{ maxHeight: "70vh" }}>
            <TooltipProvider>
              {activePeople.map((person, personIndex) => {
                const personAssignments = getPersonAssignments(person.id)
                const rowHeight = Math.max(60, personAssignments.length * 28 + 20) // Dynamic height based on assignments

                return (
                  <div
                    key={person.id}
                    className={`flex border-b border-gray-100 ${personIndex % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}
                    style={{ minHeight: `${rowHeight}px` }}
                  >
                    {/* Person info */}
                    <div className="min-w-[240px] p-4 border-r border-gray-200 bg-white sticky left-0 z-10 flex flex-col justify-center">
                      <div className="font-medium text-gray-900">{person.name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {person.profile} • {person.type === "interno" ? "Interno" : "Externo"}
                      </div>
                    </div>

                    {/* Assignment bars - Scrollable */}
                    <div className="overflow-x-auto flex-1" ref={scrollContainerRef}>
                      <div
                        className="relative"
                        style={{
                          minWidth: `${days.length * DAY_WIDTH}px`,
                          height: `${rowHeight}px`,
                        }}
                      >
                        {/* Weekend background */}
                        {days.map((day, i) => (
                          <div
                            key={i}
                            className={`
                              absolute top-0 bottom-0 border-r border-gray-100
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
                          const hours = Math.round(assignment.allocation * 8)

                          return (
                            <Tooltip key={assignment.id}>
                              <TooltipTrigger asChild>
                                <div
                                  className="absolute rounded-md shadow-sm cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] border border-white/20"
                                  style={{
                                    backgroundColor: bgColor,
                                    left: `${dimensions.left + 2}px`,
                                    width: `${Math.max(dimensions.width, 20)}px`,
                                    top: `${12 + idx * 28}px`,
                                    height: "24px",
                                    zIndex: 5,
                                  }}
                                >
                                  <div className="px-2 py-1 text-white text-xs font-medium truncate h-full flex items-center">
                                    {project.name}
                                  </div>

                                  {/* Allocation indicator */}
                                  {assignment.allocation !== 1 && (
                                    <div
                                      className="absolute top-0 right-0 bg-black/20 text-white text-xs px-1 rounded-tr-md rounded-bl-md"
                                      style={{ fontSize: "10px", lineHeight: "14px" }}
                                    >
                                      {Math.round(assignment.allocation * 100)}%
                                    </div>
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="bg-gray-900 text-white border-gray-700">
                                <div className="space-y-1">
                                  <p className="font-medium">{project.name}</p>
                                  <p className="text-xs opacity-90">
                                    {format(dimensions.startDate, "dd MMM")} -{" "}
                                    {format(dimensions.endDate, "dd MMM yyyy")}
                                  </p>
                                  <p className="text-xs opacity-90">
                                    {Math.round(assignment.allocation * 100)}% • {hours}h/día
                                  </p>
                                  {project.description && (
                                    <p className="text-xs opacity-75 max-w-xs">{project.description}</p>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          )
                        })}

                        {/* Today indicator line */}
                        {isSameDay(today, monthStart) ||
                          (today >= monthStart && today <= monthEnd && (
                            <div
                              className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-10 pointer-events-none"
                              style={{
                                left: `${differenceInDays(today, monthStart) * DAY_WIDTH + DAY_WIDTH / 2}px`,
                              }}
                            />
                          ))}
                      </div>
                    </div>
                  </div>
                )
              })}

              {activePeople.length === 0 && (
                <div className="p-12 text-center text-gray-500">
                  <div className="text-lg font-medium mb-2">No hay personas activas</div>
                  <div className="text-sm">Agrega personas al equipo para ver sus asignaciones</div>
                </div>
              )}
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
