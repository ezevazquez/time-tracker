"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { format, addDays, subDays } from "date-fns"

interface TimelineHeaderProps {
  startDate: Date
  endDate: Date
  onDateChange: (startDate: Date, endDate: Date) => void
  onSearch: (query: string) => void
}

export function TimelineHeader({ startDate, endDate, onDateChange, onSearch }: TimelineHeaderProps) {
  const handlePrevWeek = () => {
    const newStartDate = subDays(startDate, 7)
    const newEndDate = subDays(endDate, 7)
    onDateChange(newStartDate, newEndDate)
  }

  const handleNextWeek = () => {
    const newStartDate = addDays(startDate, 7)
    const newEndDate = addDays(endDate, 7)
    onDateChange(newStartDate, newEndDate)
  }

  const handleToday = () => {
    const today = new Date()
    // Set to the beginning of the current week (Sunday)
    const dayOfWeek = today.getDay()
    const diff = today.getDate() - dayOfWeek
    const startOfWeek = new Date(today.setDate(diff))

    // End date is 13 days after start (2 weeks)
    const endOfPeriod = addDays(startOfWeek, 13)

    onDateChange(startOfWeek, endOfPeriod)
  }

  return (
    <div className="flex items-center justify-between border-b bg-white p-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={handlePrevWeek}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleNextWeek}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" onClick={handleToday}>
          Today
        </Button>
        <div className="ml-4 text-sm font-medium">
          {format(startDate, "MMM d, yyyy")} - {format(endDate, "MMM d, yyyy")}
        </div>
      </div>
      <div className="relative w-64">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search people or projects..." className="pl-8" onChange={(e) => onSearch(e.target.value)} />
      </div>
    </div>
  )
}

