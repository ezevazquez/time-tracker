import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Edit, Trash2, User } from 'lucide-react'
import { AssignmentModal } from '@/components/assignment-modal'
import { renderDate } from '@/utils/renderDate'
import type { AssignmentWithRelations } from '@/types/assignment'
import type { Project } from '@/types/project'

interface ProjectAssignmentsPanelProps {
    project: Project
    assignments: AssignmentWithRelations[]
    onCreate: (data: any) => Promise<void>
    onUpdate: (id: string, data: any) => Promise<void>
    onDelete: (id: string) => Promise<void>
    showAddButton?: boolean
}

export function ProjectAssignmentsPanel({
    project,
    assignments,
    onCreate,
    onUpdate,
    onDelete,
    showAddButton = true,
}: ProjectAssignmentsPanelProps) {
    const [showAssignmentModal, setShowAssignmentModal] = useState(false)
    const [selectedAssignment, setSelectedAssignment] = useState<AssignmentWithRelations | null>(null)

    const projectAssignments = assignments.filter(
        assignment => assignment.project_id === project.id
    )

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2" data-test="project-assignments-title">
                            <User className="h-5 w-5" />
                            Equipo Asignado
                        </CardTitle>
                        <CardDescription>
                            Miembros del equipo trabajando en este proyecto ({projectAssignments.length})
                        </CardDescription>
                    </div>
                    {showAddButton && (
                        <Button onClick={() => setShowAssignmentModal(true)} size="sm" data-test="add-assignment-button">
                            <Plus className="h-4 w-4 mr-2" />
                            Nueva asignación 
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {projectAssignments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No hay miembros asignados aún</p>
                        <p className="text-xs mt-1">
                            Crea asignaciones para agregar personas al proyecto
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {projectAssignments.map(assignment => {
                            const person = assignment.people
                            if (!person) return null
                            const initials = `${person.first_name?.[0] || ''}${person.last_name?.[0] || ''}`.toUpperCase()
                            return (
                                <div
                                    key={assignment.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-semibold">
                                            {initials}
                                        </div>
                                        <div>
                                            <h4 className="font-medium">{person.first_name} {person.last_name}</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {(assignment.allocation * 100).toFixed(0)}% · {renderDate(assignment.start_date)} - {renderDate(assignment.end_date)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedAssignment(assignment)
                                                setShowAssignmentModal(true)
                                            }}
                                            data-test={`edit-assignment-${assignment.id}`}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                if (confirm('¿Estás seguro de que deseas eliminar esta asignación?')) {
                                                    onDelete(assignment.id)
                                                }
                                            }}
                                            data-test={`delete-assignment-${assignment.id}`}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
            <AssignmentModal
                open={showAssignmentModal}
                mode={selectedAssignment ? 'edit' : 'new'}
                initialData={{
                    ...selectedAssignment,
                    project_id: project.id,
                    ...(selectedAssignment == null && project.start_date && project.end_date
                        ? {
                            start_date: project.start_date,
                            end_date: project.end_date,
                        }
                        : {})
                }}
                onSave={async (data) => {
                    try {
                        if (selectedAssignment) {
                            await onUpdate(selectedAssignment.id, data)
                        } else {
                            await onCreate(data)
                        }
                        setSelectedAssignment(null)
                        setShowAssignmentModal(false)
                    } catch (error) {
                        console.error('No se pudo guardar la asignación.', error)
                    }
                }}
                onCancel={() => {
                    setSelectedAssignment(null)
                    setShowAssignmentModal(false)
                }}
            />
        </Card>
    )
}