"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type { Person } from "@/types"
import { sanityClient } from "@/sanity/lib/client"


interface PersonDialogProps {
  person: Person | null
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export function PersonDialog({ person, isOpen, onClose, onSave }: PersonDialogProps) {
  const [name, setName] = useState("")
  const [surname, setSurname] = useState("")
  const [role, setRole] = useState("")
  const [isFullTime, setIsFullTime] = useState(true)
  const [timezone, setTimezone] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (person) {
      setName(person.name)
      setSurname(person.surname)
      setRole(person.role)
      setIsFullTime(person.isFullTime)
      setTimezone(person.timezone || "")
    } else {
      setName("")
      setSurname("")
      setRole("")
      setIsFullTime(true)
      setTimezone("")
    }
  }, [person])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (person) {
        // Update existing person
        await sanityClient
          .patch(person._id)
          .set({
            name,
            surname,
            role,
            isFullTime,
            timezone: timezone || undefined,
          })
          .commit()
      } else {
        // Create new person
        await sanityClient.create({
          _type: "person",
          name,
          surname,
          role,
          isFullTime,
          timezone: timezone || undefined,
        })
      }
      onSave()
    } catch (error) {
      console.error("Error saving person:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{person ? "Edit Person" : "Add Person"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="surname" className="text-right">
                Surname
              </Label>
              <Input
                id="surname"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="timezone" className="text-right">
                Timezone
              </Label>
              <Input
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="col-span-3"
                placeholder="e.g. (GMT-4) Eastern Time"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isFullTime" className="text-right">
                Full Time
              </Label>
              <div className="col-span-3 flex items-center">
                <Switch id="isFullTime" checked={isFullTime} onCheckedChange={setIsFullTime} />
              </div>
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

