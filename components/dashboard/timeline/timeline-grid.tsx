"use client"

import { format, addDays, isSameDay, isWithinInterval, parseISO } from "date-fns"
import type { Assignment, Person } from "@/types"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState, useEffect } from "react"

interface TimelineGridProps {
  startDate: Date
  endDate: Date
  people: Person[]
  assignments: Assignment[]
  searchQuery: string
}

export function TimelineGrid({ startDate, endDate, people, assignments, searchQuery }: TimelineGridProps) {
  const [filteredPeople, setFilteredPeople] = useState<Person[]>(people)
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>(assignments)

  // Generate array of dates between start and end
  const dates: Date[] = []
  let currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate))
    currentDate = addDays(currentDate, 1)
  }

  // Filter people and assignments based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredPeople(people)
      setFilteredAssignments(assignments)
      return
    }

    const query = searchQuery.toLowerCase()

    // Filter people
    const matchedPeople = people.filter(
      (person) =>
        person.name.toLowerCase().includes(query) ||
        person.surname.toLowerCase().includes(query) ||
        person.role.toLowerCase().includes(query),
    )

    // Filter assignments based on project name or client
    const matchedAssignments = assignments.filter(
      (assignment) =>
        assignment.project.name.toLowerCase().includes(query) ||
        assignment.project.client.toLowerCase().includes(query) ||
        matchedPeople.some((p) => p._id === assignment.person._id),
    )

    setFilteredPeople(matchedPeople)
    setFilteredAssignments(matchedAssignments)
  }, [searchQuery, people, assignments])

  // Get assignments for a specific person and date
  const getAssignmentsForPersonAndDate = (personId: string, date: Date) => {
    return filteredAssignments.filter((assignment) => {
      const assignmentStartDate = parseISO(assignment.startDate)
      const assignmentEndDate = parseISO(assignment.endDate)

      return (
        assignment.person._id === personId &&
        isWithinInterval(date, {
          start: assignmentStartDate,
          end: assignmentEndDate,
        })
      )
    })
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Date headers */}
      <div className="flex border-b">
        <div className="sticky left-0 z-10 w-64 shrink-0 bg-white p-4 shadow-sm">
          <div className="font-medium">People</div>
        </div>
        <div className="flex">
          {dates.map((date) => (
            <div
              key={date.toISOString()}
              className={`flex w-32 shrink-0 flex-col items-center border-l p-2 ${
                isSameDay(date, new Date()) ? "bg-blue-50" : ""
              }`}
            >
              <div className="text-sm font-medium">{format(date, "EEE")}</div>
              <div className="text-sm">{format(date, "d")}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <ScrollArea className="h-full">
        <div className="flex">
          {/* People column */}
          <div className="sticky left-0 z-10 w-64 shrink-0 bg-white shadow-sm">
            {filteredPeople.map((person) => (
              <div key={person._id} className="flex items-center gap-3 border-b p-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={person.avatar} alt={`${person.name} ${person.surname}`} />
                  <AvatarFallback>
                    {person.name[0]}
                    {person.surname[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">
                    {person.name} {person.surname}
                  </div>
                  <div className="text-xs text-muted-foreground">{person.role}</div>
                  {person.timezone && <div className="text-xs text-muted-foreground">{person.timezone}</div>}
                </div>
              </div>
            ))}
          </div>

          {/* Timeline grid */}
          <div className="flex">
            {filteredPeople.map((person) => (
              <div key={person._id} className="flex">
                {dates.map((date) => {
                  const dayAssignments = getAssignmentsForPersonAndDate(person._id, date)
                  return (
                    <div
                      key={date.toISOString()}
                      className={`relative h-[72px] w-32 border-b border-l ${
                        isSameDay(date, new Date()) ? "bg-blue-50" : ""
                      }`}
                    >
                      {dayAssignments.map((assignment) => (
                        <div
                          key={assignment._id}
                          className={`absolute left-1 right-1 top-2 rounded border px-2 py-1 text-xs project-color-${assignment.project.colorIndex}`}
                        >
                          <div className="font-medium truncate">{assignment.project.name}</div>
                          <div className="truncate">{assignment.project.client}</div>
                          {assignment.hoursPerDay && <div>{assignment.hoursPerDay}h per day</div>}
                          {assignment.startTime && assignment.endTime && (
                            <div>
                              {assignment.startTime} - {assignment.endTime}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

