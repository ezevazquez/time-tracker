"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { sanityClient } from "@/sanity/lib/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Project } from "@/types"
import { format, parseISO } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ProjectDialogProps {
  project: Project | null
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export function ProjectDialog({ project, isOpen, onClose, onSave }: ProjectDialogProps) {
  const [name, setName] = useState("")
  const [client, setClient] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [colorIndex, setColorIndex] = useState("1")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (project) {
      setName(project.name)
      setClient(project.client)
      setStartDate(format(parseISO(project.startDate), "yyyy-MM-dd"))
      setEndDate(format(parseISO(project.endDate), "yyyy-MM-dd"))
      setColorIndex(project.colorIndex.toString())
    } else {
      setName("")
      setClient("")
      const today = format(new Date(), "yyyy-MM-dd")
      setStartDate(today)
      setEndDate(today)
      setColorIndex("1")
    }
  }, [project])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (project) {
        // Update existing project
        await sanityClient
          .patch(project._id)
          .set({
            name,
            client,
            startDate,
            endDate,
            colorIndex: Number.parseInt(colorIndex),
          })
          .commit()
      } else {
        // Create new project
        await sanityClient.create({
          _type: "project",
          name,
          client,
          startDate,
          endDate,
          colorIndex: Number.parseInt(colorIndex),
        })
      }
      onSave()
    } catch (error) {
      console.error("Error saving project:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{project ? "Edit Project" : "Add Project"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Project Name
              </Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="client" className="text-right">
                Client
              </Label>
              <Input
                id="client"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startDate" className="text-right">
                Start Date
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endDate" className="text-right">
                End Date
              </Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="colorIndex" className="text-right">
                Color
              </Label>
              <Select value={colorIndex} onValueChange={setColorIndex}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Green</SelectItem>
                  <SelectItem value="2">Blue</SelectItem>
                  <SelectItem value="3">Yellow</SelectItem>
                  <SelectItem value="4">Purple</SelectItem>
                  <SelectItem value="5">Pink</SelectItem>
                  <SelectItem value="6">Orange</SelectItem>
                  <SelectItem value="7">Teal</SelectItem>
                  <SelectItem value="8">Red</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
