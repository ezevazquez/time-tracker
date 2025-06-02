"use client"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  format,
  eachMonthOfInterval,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  parseISO,
  differenceInDays,
  addMonths,
  subMonths,
  isSameMonth,
} from "date-fns"
import { es } from "date-fns/locale"
import { ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react"
import { useState } from "react"

interface TimelineViewProps {
  viewMode: "people" | "projects"
  dateRange: { from: Date; to: Date }
  people: any[]
  projects: any[]
  assignments: any[]
}

export function TimelineView({ viewMode, dateRange, people, projects, assignments }: TimelineViewProps) {
  const [visibleDateRange, setVisibleDateRange] = useState({
    from: dateRange.from,
    to: addMonths(dateRange.from, 5), // Show 6 months at a time
  })

  const months = eachMonthOfInterval({ start: visibleDateRange.from, end: visibleDateRange.to })

  const navigatePrevious = () => {
    setVisibleDateRange({
      from: subMonths(visibleDateRange.from, 3),
      to: subMonths(visibleDateRange.to, 3),
    })
  }

  const navigateNext = () => {
    setVisibleDateRange({
      from: addMonths(visibleDateRange.from, 3),
      to: addMonths(visibleDateRange.to, 3),
    })
  }

  const resetView = () => {
    setVisibleDateRange({
      from: dateRange.from,
      to: addMonths(dateRange.from, 5),
    })
  }

  const getAssignmentsForItem = (itemId: string, itemType: "person" | "project") => {
    return assignments.filter((assignment) => {
      const key = itemType === "person" ? "person_id" : "project_id"
      return assignment[key] === itemId
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "activo":
        return "bg-green-500"
      case "pausado":
        return "bg-yellow-500"
      case "cerrado":
        return "bg-gray-500"
      default:
        return "bg-blue-500"
    }
  }

  const getAllocationColor = (allocation: number) => {
    if (allocation >= 0.8) return "bg-red-500"
    if (allocation >= 0.5) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getAllocationWidth = (assignment: any, month: Date) => {
    const monthStart = startOfMonth(month)
    const monthEnd = endOfMonth(month)
    const assignmentStart = parseISO(assignment.start_date)
    const assignmentEnd = parseISO(assignment.end_date)

    // Calculate the overlap between the assignment and the month
    const overlapStart = assignmentStart < monthStart ? monthStart : assignmentStart
    const overlapEnd = assignmentEnd > monthEnd ? monthEnd : assignmentEnd

    // Calculate the percentage of the month that the assignment covers
    const daysInMonth = differenceInDays(monthEnd, monthStart) + 1
    const daysOverlap = differenceInDays(overlapEnd, overlapStart) + 1

    return Math.max((daysOverlap / daysInMonth) * 100, 15) // Minimum width for visibility
  }

  const getAssignmentPosition = (assignment: any, month: Date) => {
    const monthStart = startOfMonth(month)
    const monthEnd = endOfMonth(month)
    const assignmentStart = parseISO(assignment.start_date)

    // If assignment starts before the month, position at 0
    if (assignmentStart < monthStart) return 0

    // Calculate the percentage position within the month
    const daysInMonth = differenceInDays(monthEnd, monthStart) + 1
    const daysFromStart = differenceInDays(assignmentStart, monthStart)

    return (daysFromStart / daysInMonth) * 100
  }

  const items = viewMode === "people" ? people : projects

  return (
    <div className="space-y-4">
      {/* Timeline Controls */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={navigatePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            {format(visibleDateRange.from, "MMM yyyy", { locale: es })} -
            {format(visibleDateRange.to, "MMM yyyy", { locale: es })}
          </span>
          <Button variant="outline" size="sm" onClick={navigateNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={resetView} className="ml-2">
            Restablecer
          </Button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>&lt;50%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>50-80%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>&gt;80%</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-red-500" />
            <span>Sobreasignación</span>
          </div>
        </div>
      </div>

      {/* Timeline Header */}
      <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground">
        <div className="col-span-3">{viewMode === "people" ? "Persona" : "Proyecto"}</div>
        <div className="col-span-9 grid grid-cols-6 gap-1">
          {months.map((month, index) => (
            <div key={index} className="text-center">
              <div className="font-medium">{format(month, "MMMM", { locale: es })}</div>
              <div className="text-xs">{format(month, "yyyy")}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline Rows */}
      {items.map((item) => {
        const itemAssignments = getAssignmentsForItem(item.id, viewMode === "people" ? "person" : "project")

        return (
          <Card key={item.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="grid grid-cols-12 gap-2 items-center">
              {/* Item Info */}
              <div className="col-span-3">
                <div className="font-medium">{item.name}</div>
                <div className="text-sm text-muted-foreground">
                  {viewMode === "people" ? item.profile : item.description}
                </div>
                <Badge variant="outline" className={`mt-1 ${getStatusColor(item.status)} text-white`}>
                  {item.status}
                </Badge>
              </div>

              {/* Timeline */}
              <div className="col-span-9 grid grid-cols-6 gap-1">
                {months.map((month, monthIndex) => {
                  const monthStart = startOfMonth(month)
                  const monthEnd = endOfMonth(month)

                  // Find assignments that overlap with this month
                  const monthAssignments = itemAssignments.filter((assignment) => {
                    const assignmentStart = parseISO(assignment.start_date)
                    const assignmentEnd = parseISO(assignment.end_date)

                    return (
                      isWithinInterval(monthStart, { start: assignmentStart, end: assignmentEnd }) ||
                      isWithinInterval(monthEnd, { start: assignmentStart, end: assignmentEnd }) ||
                      isWithinInterval(assignmentStart, { start: monthStart, end: monthEnd })
                    )
                  })

                  const totalAllocation = monthAssignments.reduce((sum, assignment) => sum + assignment.allocation, 0)
                  const isOverallocated = totalAllocation > 1

                  return (
                    <div key={monthIndex} className="h-16 relative border border-dashed border-gray-200 rounded-md p-1">
                      {/* Week markers */}
                      <div className="absolute inset-0 grid grid-cols-4 pointer-events-none">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="border-r border-dotted border-gray-100 h-full"></div>
                        ))}
                      </div>

                      {monthAssignments.length > 0 ? (
                        <div className="relative h-full">
                          {monthAssignments.map((assignment, assignmentIndex) => {
                            const relatedItem =
                              viewMode === "people"
                                ? projects.find((p) => p.id === assignment.project_id)
                                : people.find((p) => p.id === assignment.person_id)

                            const width = getAllocationWidth(assignment, month)
                            const leftPosition = getAssignmentPosition(assignment, month)

                            return (
                              <TooltipProvider key={assignmentIndex}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      className={`absolute h-5 rounded-md ${getAllocationColor(assignment.allocation)} text-xs text-white flex items-center justify-center overflow-hidden px-1`}
                                      style={{
                                        width: `${width}%`,
                                        left: `${leftPosition}%`,
                                        top: `${assignmentIndex * 6}px`,
                                      }}
                                    >
                                      {width > 30 && `${Math.round(assignment.allocation * 100)}%`}
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
                                      </div>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )
                          })}

                          {isOverallocated && (
                            <div className="absolute bottom-0 right-0 p-1">
                              <TooltipProvider>
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
                              </TooltipProvider>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <span className="text-xs text-gray-400">Disponible</span>
                        </div>
                      )}

                      {/* Current month indicator */}
                      {isSameMonth(new Date(), month) && (
                        <div className="absolute inset-0 border-2 border-blue-400 rounded-md pointer-events-none"></div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </Card>
        )
      })}

      {items.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No hay {viewMode === "people" ? "personas" : "proyectos"} para mostrar en este período
        </div>
      )}
    </div>
  )
}
