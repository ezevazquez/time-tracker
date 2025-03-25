"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Person, Project } from "@/types"
import { sanityClient } from "@/sanity/lib/client"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"

interface AssignmentFormProps {
  people: Person[]
  projects: Project[]
}

export function AssignmentForm({ people, projects }: AssignmentFormProps) {
  const router = useRouter()
  const [personId, setPersonId] = useState("")
  const [projectId, setProjectId] = useState("")
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [hoursPerDay, setHoursPerDay] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!personId || !projectId || !startDate || !endDate) {
      setError("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)

    try {
      await sanityClient.create({
        _type: "assignment",
        person: {
          _type: "reference",
          _ref: personId,
        },
        project: {
          _type: "reference",
          _ref: projectId,
        },
        startDate,
        endDate,
        hoursPerDay: hoursPerDay ? Number.parseInt(hoursPerDay) : undefined,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        notes: notes || undefined,
      })

      router.push("/dashboard")
    } catch (error) {
      console.error("Error creating assignment:", error)
      setError("Failed to create assignment. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-500">{error}</div>}

      <div className="space-y-4">
        <div>
          <Label htmlFor="person">Person</Label>
          <Select value={personId} onValueChange={setPersonId}>
            <SelectTrigger id="person" className="w-full">
              <SelectValue placeholder="Select a person" />
            </SelectTrigger>
            <SelectContent>
              {people.map((person) => (
                <SelectItem key={person._id} value={person._id}>
                  {person.name} {person.surname} - {person.role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="project">Project</Label>
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger id="project" className="w-full">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project._id} value={project._id}>
                  {project.name} - {project.client}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="endDate">End Date</Label>
            <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="hoursPerDay">Hours Per Day</Label>
            <Input
              id="hoursPerDay"
              type="number"
              min="1"
              max="24"
              value={hoursPerDay}
              onChange={(e) => setHoursPerDay(e.target.value)}
              placeholder="8"
            />
          </div>
          <div>
            <Label htmlFor="startTime">Start Time</Label>
            <Input id="startTime" value={startTime} onChange={(e) => setStartTime(e.target.value)} placeholder="9am" />
          </div>
          <div>
            <Label htmlFor="endTime">End Time</Label>
            <Input id="endTime" value={endTime} onChange={(e) => setEndTime(e.target.value)} placeholder="5pm" />
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional details about this assignment"
            className="h-24"
          />
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.push("/dashboard")}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Assignment"}
        </Button>
      </div>
    </form>
  )
}

