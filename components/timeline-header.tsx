"use client"

import { Button } from "@/components/ui/button"
import { CalendarDays } from "lucide-react"
import { format, isWeekend, isSameDay } from "date-fns"
import { es } from "date-fns/locale"

interface TimelineHeaderProps {
  days: Date[]
  monthGroups: { month: Date; days: Date[] }[]
  today: Date
  dayWidth: number
  sidebarWidth: number
  headerHeight: number
  totalWidth: number
  onScrollToToday: () => void
}

export function TimelineHeader({
  days,
  monthGroups,
  today,
  dayWidth,
  sidebarWidth,
  headerHeight,
  totalWidth,
  onScrollToToday,
}: TimelineHeaderProps) {
  return (
    <div className="sticky top-0 z-40 bg-white border-b border-gray-200 flex" style={{ height: `${headerHeight}px` }}>
      {/* Header left corner - Today button */}
      <div
        className="sticky top-0 left-0 z-50 bg-gray-50 border-r border-gray-200 flex items-center px-4 justify-end"
        style={{ width: `${sidebarWidth}px` }}
      >
        <Button
          onClick={onScrollToToday}
          variant="default"
          size="sm"
          className="h-8 px-4 text-sm bg-blue-600 hover:bg-blue-700 text-white"
        >
          <CalendarDays className="h-4 w-4 mr-2" />
          Hoy
        </Button>
      </div>

      {/* Header timeline section */}
      <div style={{ width: `${totalWidth}px` }}>
        {/* Month labels */}
        <div className="flex h-6 border-b border-gray-100">
          {monthGroups.map((group, i) => (
            <div
              key={i}
              className="flex-shrink-0 bg-gray-50/80 border-r border-gray-200 px-2 text-xs font-medium text-gray-700 flex items-center"
              style={{ width: `${group.days.length * dayWidth}px` }}
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
              style={{ width: `${dayWidth}px`, height: `${headerHeight - 24}px` }}
              data-test={`header-day-${i}`}
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
  )
} 