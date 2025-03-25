"use client"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { Person } from "@/types"
import { sanityClient } from "@/sanity/lib/client"
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface DeletePersonDialogProps {
  person: Person | null
  isOpen: boolean
  onClose: () => void
  onDelete: () => void
}

export function DeletePersonDialog({ person, isOpen, onClose, onDelete }: DeletePersonDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!person) return

    setIsDeleting(true)
    try {
      await sanityClient.delete(person._id)
      onDelete()
    } catch (error) {
      console.error("Error deleting person:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete {person?.name} {person?.surname} and remove all their assignments. This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

