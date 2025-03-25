"use client"

import { useState } from "react"
import { addDays } from "date-fns"
import { TimelineHeader } from "./timeline-header"
import { TimelineGrid } from "./timeline-grid"
import type { Assignment, Person } from "@/types"

interface TimelineProps {
  initialPeople: Person[]
  initialAssignments: Assignment[]
}

export function Timeline({ initialPeople, initialAssignments }: TimelineProps) {
  // Set initial date range to current week + next week
  const today = new Date()
  const dayOfWeek = today.getDay()
  const diff = today.getDate() - dayOfWeek
  const startOfWeek = new Date(today.setDate(diff))
  const endOfPeriod = addDays(startOfWeek, 13) // Two weeks

  const [startDate, setStartDate] = useState<Date>(startOfWeek)
  const [endDate, setEndDate] = useState<Date>(endOfPeriod)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [people] = useState<Person[]>(initialPeople)
  const [assignments] = useState<Assignment[]>(initialAssignments)

  const handleDateChange = (newStartDate: Date, newEndDate: Date) => {
    setStartDate(newStartDate)
    setEndDate(newEndDate)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  return (
    <div className="flex h-full flex-col">
      <TimelineHeader startDate={startDate} endDate={endDate} onDateChange={handleDateChange} onSearch={handleSearch} />
      <TimelineGrid
        startDate={startDate}
        endDate={endDate}
        people={people}
        assignments={assignments}
        searchQuery={searchQuery}
      />
    </div>
  )
}

