"use client"

import { useState, useRef, useEffect } from "react"
import { format, eachDayOfInterval, isWeekend, isSameDay, parseISO, addMonths, subMonths } from "date-fns"
import { es } from "date-fns/locale"
import { ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/date-range-picker"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
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

export function ResourceTimeline({
  people,
  projects,
  assignments,
  viewMode,
  setViewMode,
  dateRange,
  setDateRange,
}: ResourceTimelineProps) {
  const [visibleDateRange, setVisibleDateRange] = useState({
    from: new Date(),
    to: addMonths(new Date(), 1),
  })

  // Generate project colors map
  const projectColors = projects.reduce(
    (acc, project, index) => {
      const colorClasses = [
        "bg-blue-500 text-white",
        "bg-green-500 text-white",
        "bg-purple-500 text-white",
        "bg-amber-500 text-white",
        "bg-rose-500 text-white",
        "bg-cyan-500 text-white",
        "bg-indigo-500 text-white",
        "bg-emerald-500 text-white",
      ]
      acc[project.id] = colorClasses[index % colorClasses.length]
      return acc
    },
    {} as Record<string, string>,
  )

  // Generate days for the timeline
  const days = eachDayOfInterval({
    start: visibleDateRange.from,
    end: visibleDateRange.to,
  })

  // Calculate the number of days to display
  const totalDays = days.length

  // Refs for scrolling
  const timelineRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Sync scrolling between header and content
  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current && headerRef.current) {
        headerRef.current.scrollLeft = contentRef.current.scrollLeft
      }
    }

    const contentElement = contentRef.current
    if (contentElement) {
      contentElement.addEventListener("scroll", handleScroll)
      return () => contentElement.removeEventListener("scroll", handleScroll)
    }
  }, [])

  // Navigation functions
  const navigatePrevious = () => {
    setVisibleDateRange({
      from: subMonths(visibleDateRange.from, 1),
      to: subMonths(visibleDateRange.to, 1),
    })
  }

  const navigateNext = () => {
    setVisibleDateRange({
      from: addMonths(visibleDateRange.from, 1),
      to: addMonths(visibleDateRange.to, 1),
    })
  }

  const resetView = () => {
    setVisibleDateRange({
      from: new Date(),
      to: addMonths(new Date(), 1),
    })
  }

  // Filter items based on view mode
  const items = viewMode === "people" ? people : projects

  // Get assignments for a specific item
  const getAssignmentsForItem = (itemId: string, itemType: "person" | "project") => {
    return assignments.filter((assignment) => {
      const key = itemType === "person" ? "person_id" : "project_id"
      return assignment[key] === itemId
    })
  }

  // Check if a date has an assignment for an item
  const getAssignmentsForDate = (itemId: string, itemType: "person" | "project", date: Date) => {
    const itemAssignments = getAssignmentsForItem(itemId, itemType)

    return itemAssignments.filter((assignment) => {
      const startDate = parseISO(assignment.start_date)
      const endDate = parseISO(assignment.end_date)

      return date >= startDate && date <= endDate
    })
  }

  // Calculate total allocation for a date
  const getTotalAllocationForDate = (itemId: string, itemType: "person" | "project", date: Date) => {
    const dateAssignments = getAssignmentsForDate(itemId, itemType, date)
    return dateAssignments.reduce((sum, assignment) => sum + assignment.allocation, 0)
  }

  // Get status color for a person
  const getStatusColor = (status: string) => {
    switch (status) {
      case "activo":
        return "bg-green-100 text-green-800"
      case "pausado":
        return "bg-yellow-100 text-yellow-800"
      case "fuera":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Get allocation color based on percentage
  const getAllocationColor = (allocation: number) => {
    if (allocation > 1) return "bg-red-200 border-red-500"
    if (allocation > 0.8) return "bg-amber-100 border-amber-500"
    if (allocation > 0.5) return "bg-green-100 border-green-500"
    return "bg-blue-50 border-blue-300"
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Planificación de Recursos</CardTitle>
            <CardDescription>Visualización de asignaciones y disponibilidad</CardDescription>
          </div>

          <div className="flex flex-wrap gap-2">
            <Select value={viewMode} onValueChange={setViewMode}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="people">Por Persona</SelectItem>
                <SelectItem value="projects">Por Proyecto</SelectItem>
              </SelectContent>
            </Select>

            <DatePickerWithRange date={dateRange} setDate={setDateRange} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="flex justify-between items-center px-6 py-3 border-b">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={navigatePrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">{format(visibleDateRange.from, "MMMM yyyy", { locale: es })}</span>
            <Button variant="outline" size="sm" onClick={navigateNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={resetView} className="ml-2">
              Hoy
            </Button>
          </div>

          {/* Legend */}
          <div className="hidden md:flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>&lt;50%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span>50-80%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>&gt;80%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
              <span>Ausencia</span>
            </div>
          </div>
        </div>

        <div className="relative" ref={timelineRef}>
          {/* Timeline Header - Days */}
          <div
            className="sticky top-0 z-10 bg-background border-b flex"
            style={{ marginLeft: "220px" }}
            ref={headerRef}
          >
            <div className="flex">
              {days.map((day, i) => {
                const isWeekendDay = isWeekend(day)
                const isToday = isSameDay(day, new Date())

                return (
                  <div
                    key={i}
                    className={`flex-shrink-0 w-14 border-r text-center py-2 ${
                      isWeekendDay ? "bg-gray-50" : ""
                    } ${isToday ? "bg-blue-50" : ""}`}
                  >
                    <div className="text-xs font-medium">{format(day, "EEE", { locale: es })}</div>
                    <div className={`text-sm ${isToday ? "font-bold text-blue-600" : ""}`}>
                      {format(day, "d", { locale: es })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Main Timeline Content */}
          <div className="flex">
            {/* Left sidebar with names */}
            <div className="sticky left-0 z-10 bg-background border-r w-[220px] flex-shrink-0" ref={sidebarRef}>
              {items.map((item) => (
                <div key={item.id} className="flex items-center h-20 px-4 border-b">
                  <div className="w-full">
                    <div className="font-medium truncate">{item.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {viewMode === "people" ? (item as Person).profile : (item as Project).description}
                    </div>
                    {viewMode === "people" && (
                      <Badge variant="outline" className={`mt-1 ${getStatusColor(item.status)}`}>
                        {item.status}
                      </Badge>
                    )}
                    {viewMode === "projects" && (
                      <Badge variant="outline" className={`mt-1 ${getStatusColor(item.status)}`}>
                        {item.status}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Scrollable timeline content */}
            <div className="overflow-x-auto" style={{ width: "calc(100% - 220px)" }} ref={contentRef}>
              <div className="relative" style={{ width: `${totalDays * 56}px`, minHeight: `${items.length * 80}px` }}>
                {/* Grid lines */}
                <div className="absolute inset-0">
                  {days.map((day, i) => (
                    <div
                      key={i}
                      className={`absolute top-0 bottom-0 border-r ${
                        isWeekend(day) ? "bg-gray-50" : ""
                      } ${isSameDay(day, new Date()) ? "bg-blue-50" : ""}`}
                      style={{ left: `${i * 56}px`, width: "56px" }}
                    />
                  ))}

                  {items.map((_, i) => (
                    <div
                      key={i}
                      className="absolute left-0 right-0 border-b"
                      style={{ top: `${(i + 1) * 80 - 1}px`, height: "1px" }}
                    />
                  ))}
                </div>

                {/* Assignments */}
                <TooltipProvider>
                  {items.map((item, rowIndex) => {
                    const itemType = viewMode === "people" ? "person" : "project"

                    return days.map((day, colIndex) => {
                      const dayAssignments = getAssignmentsForDate(item.id, itemType, day)
                      const totalAllocation = getTotalAllocationForDate(item.id, itemType, day)
                      const isOverallocated = totalAllocation > 1

                      return (
                        <div
                          key={`${item.id}-${format(day, "yyyy-MM-dd")}`}
                          className="absolute"
                          style={{
                            left: `${colIndex * 56}px`,
                            top: `${rowIndex * 80}px`,
                            width: "56px",
                            height: "80px",
                          }}
                        >
                          {dayAssignments.length > 0 ? (
                            <div className="p-1 h-full">
                              {dayAssignments.map((assignment, i) => {
                                const relatedItem =
                                  viewMode === "people"
                                    ? projects.find((p) => p.id === assignment.project_id)
                                    : people.find((p) => p.id === assignment.person_id)

                                const projectColor =
                                  viewMode === "people" && assignment.project_id
                                    ? projectColors[assignment.project_id]
                                    : "bg-gray-200"

                                return (
                                  <Tooltip key={assignment.id}>
                                    <TooltipTrigger asChild>
                                      <div
                                        className={`text-xs rounded border mb-1 cursor-pointer ${projectColor}`}
                                        style={{
                                          height: `${Math.min(76 / dayAssignments.length - 2, 22)}px`,
                                        }}
                                      >
                                        <div className="px-1 truncate">{relatedItem?.name?.substring(0, 10)}</div>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-xs">
                                      <div className="space-y-1">
                                        <div className="font-medium">{relatedItem?.name}</div>
                                        <div className="text-xs">
                                          {format(parseISO(assignment.start_date), "dd MMM", { locale: es })} -
                                          {format(parseISO(assignment.end_date), "dd MMM yyyy", { locale: es })}
                                        </div>
                                        <div className="font-bold">
                                          {Math.round(assignment.allocation * 100)}% dedicación
                                          {assignment.allocation < 1 && (
                                            <span className="font-normal">
                                              {" "}
                                              ({Math.round(assignment.allocation * 8)}h/día)
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                )
                              })}

                              {isOverallocated && (
                                <div className="absolute bottom-0 right-0 p-1">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center justify-center bg-red-100 rounded-full p-1">
                                        <AlertTriangle className="h-3 w-3 text-red-600" />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                      <div className="text-xs font-medium text-red-600">
                                        Sobreasignación: {Math.round(totalAllocation * 100)}%
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center">
                              {isWeekend(day) && <div className="w-full h-full bg-gray-100 opacity-30" />}
                            </div>
                          )}
                        </div>
                      )
                    })
                  })}
                </TooltipProvider>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
