"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { Header } from "@/components/dashboard/header"
import { ProjectsTable } from "@/components/dashboard/projects/projects-table"
import { Button } from "@/components/ui/button"
import { ProjectDialog } from "@/components/dashboard/projects/project-dialog"
import { Plus } from "lucide-react"
import type { Project } from "@/types"
import { getProjects } from "@/lib/queries/projects"

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const loadProjects = async () => {
    setIsLoading(true)
    try {
      const data = await getProjects()
      setProjects(data)
    } catch (error) {
      console.error("Error loading projects:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  const handleAddProject = () => {
    setIsDialogOpen(true)
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
  }

  const handleProjectSaved = () => {
    handleDialogClose()
    loadProjects()
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen flex-col">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Projects</h1>
            <Button onClick={handleAddProject}>
              <Plus className="mr-2 h-4 w-4" />
              Add Project
            </Button>
          </div>

          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <p>Loading...</p>
            </div>
          ) : (
            <ProjectsTable projects={projects} onProjectUpdated={loadProjects} />
          )}

          <ProjectDialog project={null} isOpen={isDialogOpen} onClose={handleDialogClose} onSave={handleProjectSaved} />
        </main>
      </div>
    </ProtectedRoute>
  )
}

