"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { Header } from "@/components/dashboard/header"
import { PeopleTable } from "@/components/dashboard/people/people-table"
import { Button } from "@/components/ui/button"
import { PersonDialog } from "@/components/dashboard/people/person-dialog"
import { Plus } from "lucide-react"
import type { Person } from "@/types"
import { getPeople } from "@/lib/queries/people"

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const loadPeople = async () => {
    setIsLoading(true)
    try {
      const data = await getPeople()
      setPeople(data)
    } catch (error) {
      console.error("Error loading people:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPeople()
  }, [])

  const handleAddPerson = () => {
    setIsDialogOpen(true)
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
  }

  const handlePersonSaved = () => {
    handleDialogClose()
    loadPeople()
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen flex-col">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold">People</h1>
            <Button onClick={handleAddPerson}>
              <Plus className="mr-2 h-4 w-4" />
              Add Person
            </Button>
          </div>

          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <p>Loading...</p>
            </div>
          ) : (
            <PeopleTable people={people} onPersonUpdated={loadPeople} />
          )}

          <PersonDialog person={null} isOpen={isDialogOpen} onClose={handleDialogClose} onSave={handlePersonSaved} />
        </main>
      </div>
    </ProtectedRoute>
  )
}

