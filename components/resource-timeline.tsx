"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react"
import { format, eachDayOfInterval, isWeekend, isSameDay, startOfMonth, endOfMonth, addMonths } from "date-fns"
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

  // Use predefined colors for better visual appeal
  const colors = [
    "#4f46e5", // indigo
    "#0891b2", // cyan
    "#059669", // emerald
    "#d97706", // amber
    "#7c3aed", // violet
    "#db2777", // pink
    "#2563eb", // blue
    "#65a30d", // lime
    "#9333ea", // purple
    "#ea580c", // orange
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
  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  })

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

  // Get active resources based on view mode
  const activeResources =
    viewMode === "people" ? people.filter((p) => p.status === "activo") : projects.filter((p) => p.status === "activo")

  // Calculate allocation for a specific day
  const getDayAllocation = (resourceId: string, day: Date) => {
    const dayAssignments = assignments.filter((assignment) => {
      const startDate = new Date(assignment.start_date)
      const endDate = new Date(assignment.end_date)
      const isInDateRange = day >= startDate && day <= endDate

      if (viewMode === "people") {
        return assignment.person_id === resourceId && isInDateRange
      } else {
        return assignment.project_id === resourceId && isInDateRange
      }
    })

    return dayAssignments.reduce((total, assignment) => total + assignment.allocation, 0)
  }

  // Get assignments for a specific day and resource
  const getDayAssignments = (resourceId: string, day: Date) => {
    return assignments.filter((assignment) => {
      const startDate = new Date(assignment.start_date)
      const endDate = new Date(assignment.end_date)
      const isInDateRange = day >= startDate && day <= endDate

      if (viewMode === "people") {
        return assignment.person_id === resourceId && isInDateRange
      } else {
        return assignment.project_id === resourceId && isInDateRange
      }
    })
  }

  const today = new Date()

  return (
    <Card className="mb-8">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <div>
            <CardTitle className="text-xl">
              {viewMode === "people" ? "Asignaciones por Persona" : "Asignaciones por Proyecto"}
            </CardTitle>
            <CardDescription>
              Visualización de asignaciones para {format(startOfMonth(currentMonth), "MMMM yyyy", { locale: es })}
            </CardDescription>
          </div>

          <div className="flex items-center space-x-2 mt-2 sm:mt-0">
            <Button variant="outline" size="icon" onClick={() => navigateMonth("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigateMonth("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-2">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Vista:</label>
            <Select value={viewMode} onValueChange={setViewMode}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="people">Por Persona</SelectItem>
                <SelectItem value="projects">Por Proyecto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="border rounded-md overflow-hidden">
          {/* Timeline Header - Days */}
          <div className="border-b bg-muted/50 overflow-hidden">
            <div className="flex">
              {/* Resource info column */}
              <div className="min-w-[200px] border-r bg-muted/50 p-2 sticky left-0 z-10">
                <div className="font-medium">{viewMode === "people" ? "Persona" : "Proyecto"}</div>
              </div>

              {/* Days columns - Scrollable */}
              <div className="overflow-x-auto" ref={headerRef}>
                <div className="flex" style={{ minWidth: `${days.length * 50}px` }}>
                  {days.map((day, i) => (
                    <div
                      key={i}
                      className={`
                        min-w-[50px] p-1 text-center text-xs border-r
                        ${isWeekend(day) ? "bg-gray-100" : ""}
                        ${isSameDay(day, today) ? "bg-blue-100" : ""}
                      `}
                    >
                      <div className="font-medium">{format(day, "dd")}</div>
                      <div className="text-muted-foreground">{format(day, "EEE", { locale: es })}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Content - Resources and Assignments */}
          <div className="overflow-auto" style={{ maxHeight: "70vh" }}>
            <TooltipProvider>
              {activeResources.map((resource) => (
                <div key={resource.id} className="flex border-b last:border-b-0">
                  {/* Resource info */}
                  <div className="min-w-[200px] p-2 border-r bg-muted/30 sticky left-0 z-10 flex flex-col justify-center">
                    <div className="font-medium">{resource.name}</div>
                    {viewMode === "people" && (
                      <div className="text-xs text-muted-foreground">
                        {(resource as Person).profile} •{" "}
                        {(resource as Person).type === "interno" ? "Interno" : "Externo"}
                      </div>
                    )}
                    {viewMode === "projects" && (resource as Project).description && (
                      <div className="text-xs text-muted-foreground truncate" title={(resource as Project).description ?? undefined}>
                        {(resource as Project).description}
                      </div>
                    )}
                  </div>

                  {/* Days with assignments - Scrollable */}
                  <div className="overflow-x-auto" ref={scrollContainerRef}>
                    <div className="flex" style={{ minWidth: `${days.length * 50}px` }}>
                      {days.map((day, i) => {
                        const dayAssignments = getDayAssignments(resource.id, day)
                        const totalAllocation = getDayAllocation(resource.id, day)
                        const isOverallocated = totalAllocation > 1

                        return (
                          <div
                            key={i}
                            className={`
                              min-w-[50px] h-16 border-r relative
                              ${isWeekend(day) ? "bg-gray-100" : ""}
                              ${isSameDay(day, today) ? "bg-blue-100" : ""}
                              ${isOverallocated ? "bg-red-50" : ""}
                            `}
                          >
                            {/* Assignments */}
                            {dayAssignments.map((assignment, idx) => {
                              const project = projects.find((p) => p.id === assignment.project_id)
                              const person = people.find((p) => p.id === assignment.person_id)

                              // Skip if we don't have the related entity
                              if ((viewMode === "people" && !project) || (viewMode === "projects" && !person)) {
                                return null
                              }

                              const relatedName =
                                viewMode === "people"
                                  ? project?.name || "Unknown Project"
                                  : person?.name || "Unknown Person"

                              const bgColor = stringToColor(project?.name || "default")
                              const hours = Math.round(assignment.allocation * 8) // Assuming 8-hour workday

                              return (
                                <Tooltip key={assignment.id}>
                                  <TooltipTrigger asChild>
                                    <div
                                      className="absolute text-xs text-white px-1 rounded-sm truncate cursor-pointer"
                                      style={{
                                        backgroundColor: bgColor,
                                        top: `${idx * 20 + 2}%`,
                                        height: "18%",
                                        left: "2px",
                                        right: "2px",
                                        opacity: 0.9,
                                      }}
                                    >
                                      {relatedName.substring(0, 8)}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="space-y-1">
                                      <p className="font-medium">{relatedName}</p>
                                      <p className="text-xs">
                                        {format(new Date(assignment.start_date), "dd MMM")} -{" "}
                                        {format(new Date(assignment.end_date), "dd MMM yyyy")}
                                      </p>
                                      <p className="text-xs">
                                        {Math.round(assignment.allocation * 100)}% ({hours}h/día)
                                      </p>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              )
                            })}

                            {/* Overallocation indicator */}
                            {isOverallocated && (
                              <div className="absolute top-0 right-0 p-0.5">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <AlertCircle className="h-3 w-3 text-red-500" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">Sobreasignación: {Math.round(totalAllocation * 100)}%</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ))}

              {activeResources.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  No hay {viewMode === "people" ? "personas" : "proyectos"} activos para mostrar
                </div>
              )}
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
