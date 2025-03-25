"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"
import type { Project } from "@/types"
import { ProjectDialog } from "./project-dialog"
import { DeleteProjectDialog } from "./delete-project-dialog"
import { format, parseISO } from "date-fns"

interface ProjectsTableProps {
  projects: Project[]
  onProjectUpdated: () => void
}

export function ProjectsTable({ projects, onProjectUpdated }: ProjectsTableProps) {
  const [editProject, setEditProject] = useState<Project | null>(null)
  const [deleteProject, setDeleteProject] = useState<Project | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleEdit = (project: Project) => {
    setEditProject(project)
    setIsDialogOpen(true)
  }

  const handleDelete = (project: Project) => {
    setDeleteProject(project)
    setIsDeleteDialogOpen(true)
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setEditProject(null)
  }

  const handleDeleteDialogClose = () => {
    setIsDeleteDialogOpen(false)
    setDeleteProject(null)
  }

  const handleProjectSaved = () => {
    handleDialogClose()
    onProjectUpdated()
  }

  const handleProjectDeleted = () => {
    handleDeleteDialogClose()
    onProjectUpdated()
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project Name</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project._id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className={`h-4 w-4 rounded-full bg-primary-${project.colorIndex * 100}`} />
                  <span>{project.name}</span>
                </div>
              </TableCell>
              <TableCell>{project.client}</TableCell>
              <TableCell>{format(parseISO(project.startDate), "MMM d, yyyy")}</TableCell>
              <TableCell>{format(parseISO(project.endDate), "MMM d, yyyy")}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(project)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(project)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ProjectDialog
        project={editProject}
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        onSave={handleProjectSaved}
      />

      <DeleteProjectDialog
        project={deleteProject}
        isOpen={isDeleteDialogOpen}
        onClose={handleDeleteDialogClose}
        onDelete={handleProjectDeleted}
      />
    </>
  )
}

