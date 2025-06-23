import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/date-range-picker';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { OverallocationModal } from '@/components/overallocation-modal';
import { ASSIGNMENT_ALLOCATION_VALUES } from '@/constants/assignments';
import { usePeople } from '@/hooks/use-people';
import { useProjects } from '@/hooks/use-projects';
import { useAssignmentValidation } from '@/hooks/use-assignment-validation';
import { toISODateString, normalizeDate, parseDateFromString } from '@/lib/assignments';
import { percentageToFte } from '@/lib/utils/fte-calculations';
import { toast } from 'sonner';

import type { Assignment } from '@/types/assignment';
import type { Person } from '@/types/people';
import type { ProjectWithClient } from '@/types/project';

interface AssignmentModalProps {
  open: boolean;
  mode: 'new' | 'edit';
  initialData?: Partial<Assignment>;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function AssignmentModal({ open, mode, initialData, onSave, onCancel }: AssignmentModalProps) {
  const { people } = usePeople();
  const { projects } = useProjects();
  const { validateAssignment } = useAssignmentValidation();

  const [formData, setFormData] = useState({
    person_id: initialData?.person_id || '',
    project_id: initialData?.project_id || '',
    start_date: initialData?.start_date ? parseDateFromString(initialData.start_date) : undefined,
    end_date: initialData?.end_date ? parseDateFromString(initialData.end_date) : undefined,
    allocation: initialData?.allocation ? Math.round((initialData.allocation || 1) * 100) : 100,
    is_billable: initialData?.is_billable ?? true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [showOverallocationModal, setShowOverallocationModal] = useState(false);
  const [overallocationData, setOverallocationData] = useState<any>(null);
  const [pendingFormData, setPendingFormData] = useState<any>(null);

  // Determinar si el modal fue abierto desde el timeline (dibujar)
  const isPersonFixed = Boolean(initialData?.person_id);
  const isProjectFixed = Boolean(initialData?.project_id);

  useEffect(() => {
    setFormData({
      person_id: initialData?.person_id || '',
      project_id: initialData?.project_id || '',
      start_date: initialData?.start_date ? parseDateFromString(initialData.start_date) : undefined,
      end_date: initialData?.end_date ? parseDateFromString(initialData.end_date) : undefined,
      allocation: initialData?.allocation ? Math.round((initialData.allocation || 1) * 100) : 100,
      is_billable: initialData?.is_billable ?? true,
    });
  }, [initialData, open]);

  const checkForConflicts = () => {
    const newWarnings: string[] = [];
    if (formData.allocation > 100) {
      newWarnings.push('La dedicación no puede superar el 100%');
    }
    if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
      newWarnings.push('La fecha de inicio debe ser anterior a la fecha de fin');
    }
    if (!formData.person_id || !formData.project_id || !formData.start_date || !formData.end_date) {
      newWarnings.push('Todos los campos marcados con * son obligatorios');
    }
    setWarnings(newWarnings);
  };

  useEffect(() => {
    checkForConflicts();
  }, [formData]);

  const handleStartDateSelect = (date: Date | undefined) => {
    setFormData({ ...formData, start_date: date });
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    setFormData({ ...formData, end_date: date });
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    try {
      // Validar sobreasignación antes de crear/editar
      const validationResult = await validateAssignment(
        mode === 'edit' ? (initialData?.id ?? null) : null,
        formData.person_id,
        toISODateString(formData.start_date!),
        toISODateString(formData.end_date!),
        percentageToFte(formData.allocation)
      );
      if (validationResult.isOverallocated) {
        const selectedPerson = people.find(p => p.id === formData.person_id);
        const selectedProject = projects.find(p => p.id === formData.project_id);
        setOverallocationData({
          personName: `${selectedPerson?.first_name} ${selectedPerson?.last_name}`,
          projectName: selectedProject?.name || '',
          allocation: formData.allocation,
          overallocatedDates: validationResult.overallocatedDays || [],
        });
        setPendingFormData(formData);
        setShowOverallocationModal(true);
        setIsSubmitting(false);
        return;
      }
      await onSave({
        ...formData,
        allocation: percentageToFte(formData.allocation),
        start_date: toISODateString(formData.start_date!),
        end_date: toISODateString(formData.end_date!),
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar la asignación');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmOverallocation = async () => {
    if (!pendingFormData) return;
    try {
      await onSave({
        ...pendingFormData,
        allocation: percentageToFte(pendingFormData.allocation),
        start_date: toISODateString(pendingFormData.start_date),
        end_date: toISODateString(pendingFormData.end_date),
      });
      setShowOverallocationModal(false);
      setOverallocationData(null);
      setPendingFormData(null);
    } catch (error) {
      toast.error('Error al guardar la asignación');
    }
  };

  let activeProjects: ProjectWithClient[] = projects.filter((p: ProjectWithClient) => p.status !== 'Finished');
  // Asegurarse de que el proyecto seleccionado esté en la lista
  if (initialData?.project_id) {
    const selectedProject = projects.find(p => p.id === initialData.project_id);
    if (selectedProject && !activeProjects.some(p => p.id === selectedProject.id)) {
      activeProjects = [selectedProject, ...activeProjects];
    }
  }

  const activePeople = people.filter((p: Person) => p.status === 'Active' || p.status === 'Paused');

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === 'new' ? 'Nueva asignación' : 'Editar asignación'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {warnings.length > 0 && (
            <Alert className="mb-2 border-yellow-200 bg-yellow-50">
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          <div>
            <Label>Persona *</Label>
            <Select
              value={formData.person_id}
              onValueChange={value => setFormData(f => ({ ...f, person_id: value }))}
              disabled={isPersonFixed}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar persona" />
              </SelectTrigger>
              <SelectContent>
                {activePeople.map(person => (
                  <SelectItem key={person.id} value={person.id}>
                    {person.first_name} {person.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Proyecto *</Label>
            <Select
              value={formData.project_id}
              onValueChange={value => setFormData(f => ({ ...f, project_id: value }))}
              disabled={isProjectFixed}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar proyecto" />
              </SelectTrigger>
              <SelectContent>
                {activeProjects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}{project.clients ? ` - ${project.clients.name}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Fechas *</Label>
            <div className="flex gap-2">
              <DatePickerWithRange
                date={{ from: formData.start_date, to: formData.end_date }}
                setDate={({ from, to }) => {
                  setFormData(f => ({ ...f, start_date: from, end_date: to }))
                }}
              />
            </div>
          </div>
          <div>
            <Label>Asignación *</Label>
            <Select
              value={String(formData.allocation)}
              onValueChange={value => setFormData(f => ({ ...f, allocation: Number(value) }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar %" />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNMENT_ALLOCATION_VALUES.map(val => (
                  <SelectItem key={val} value={String(val * 100)}>{val * 100}%</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_billable"
              checked={formData.is_billable}
              onChange={e => setFormData(f => ({ ...f, is_billable: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <label htmlFor="is_billable" className="text-sm">Facturable</label>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button" onClick={onCancel}>Cancelar</Button>
          </DialogClose>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting || warnings.length > 0}>
            {mode === 'new' ? 'Crear asignación' : 'Guardar cambios'}
          </Button>
        </DialogFooter>
        {overallocationData && (
          <OverallocationModal
            isOpen={showOverallocationModal}
            onClose={() => {
              setShowOverallocationModal(false);
              setOverallocationData(null);
              setPendingFormData(null);
            }}
            onConfirm={handleConfirmOverallocation}
            personName={overallocationData.personName}
            projectName={overallocationData.projectName}
            allocation={overallocationData.allocation}
            overallocatedDates={overallocationData.overallocatedDates}
          />
        )}
      </DialogContent>
    </Dialog>
  );
} 