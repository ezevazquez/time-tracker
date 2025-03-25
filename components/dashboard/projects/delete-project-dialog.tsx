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
import type { Project } from "@/types"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { sanityClient } from "@/sanity/lib/client"

interface DeleteProjectDialogProps {
  project: Project | null
  isOpen: boolean
  onClose: () => void
  onDelete: () => void
}

export function DeleteProjectDialog({ project, isOpen, onClose, onDelete }: DeleteProjectDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!project) return

    setIsDeleting(true)
    try {
      await sanityClient.delete(project._id)
      onDelete()
    } catch (error) {
      console.error("Error deleting project:", error)
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
            This will permanently delete the project &quot;{project?.name}&quot; and remove all related assignments. This action
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

