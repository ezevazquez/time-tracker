"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Edit, Trash2 } from "lucide-react"
import type { Person } from "@/types"
import { PersonDialog } from "./person-dialog"
import { DeletePersonDialog } from "./delete-person-dialog"

interface PeopleTableProps {
  people: Person[]
  onPersonUpdated: () => void
}

export function PeopleTable({ people, onPersonUpdated }: PeopleTableProps) {
  const [editPerson, setEditPerson] = useState<Person | null>(null)
  const [deletePerson, setDeletePerson] = useState<Person | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleEdit = (person: Person) => {
    setEditPerson(person)
    setIsDialogOpen(true)
  }

  const handleDelete = (person: Person) => {
    setDeletePerson(person)
    setIsDeleteDialogOpen(true)
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setEditPerson(null)
  }

  const handleDeleteDialogClose = () => {
    setIsDeleteDialogOpen(false)
    setDeletePerson(null)
  }

  const handlePersonSaved = () => {
    handleDialogClose()
    onPersonUpdated()
  }

  const handlePersonDeleted = () => {
    handleDeleteDialogClose()
    onPersonUpdated()
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Timezone</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {people.map((person) => (
            <TableRow key={person._id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={person.avatar} alt={`${person.name} ${person.surname}`} />
                    <AvatarFallback>
                      {person.name[0]}
                      {person.surname[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span>
                    {person.name} {person.surname}
                  </span>
                </div>
              </TableCell>
              <TableCell>{person.role}</TableCell>
              <TableCell>{person.isFullTime ? "Full-time" : "Part-time"}</TableCell>
              <TableCell>{person.timezone || "-"}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(person)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(person)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <PersonDialog person={editPerson} isOpen={isDialogOpen} onClose={handleDialogClose} onSave={handlePersonSaved} />

      <DeletePersonDialog
        person={deletePerson}
        isOpen={isDeleteDialogOpen}
        onClose={handleDeleteDialogClose}
        onDelete={handlePersonDeleted}
      />
    </>
  )
}

