'use client'

import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

interface OverallocationDate {
  date: string
  total_allocation: number // FTE (0.0-1.0)
  message?: string
}

interface OverallocationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  personName: string
  projectName: string
  allocation: number // Percentage (0-100)
  overallocatedDates: OverallocationDate[]
}

export function OverallocationModal({
  isOpen,
  onClose,
  onConfirm,
  personName,
  projectName,
  allocation,
  overallocatedDates
}: OverallocationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleConfirm = async () => {
    setIsSubmitting(true)
    try {
      await onConfirm()
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getSeverityColor = (totalFte: number) => {
    if (totalFte > 2.0) return 'bg-red-100 text-red-800 border-red-200'
    if (totalFte > 1.5) return 'bg-orange-100 text-orange-800 border-orange-200'
    return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  }

  const formatPercentage = (fte: number) => {
    return Math.round(fte * 100)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-gray-900" data-testid="overallocation-modal-title">
                Sobreasignación detectada
              </DialogTitle>
              <p className="text-sm text-gray-600 mt-1">
                Esta acción causará que {personName} esté sobreasignado
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Detalles de la asignación */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600 mb-2">Detalles de la asignación:</div>
            <div className="space-y-1 text-sm">
              <div><span className="font-medium">Persona:</span> {personName}</div>
              <div><span className="font-medium">Proyecto:</span> {projectName}</div>
              <div><span className="font-medium">Asignación:</span> {allocation}%</div>
            </div>
          </div>

          {/* Días con sobreasignación */}
          <div>
            <div className="text-sm font-medium text-gray-900 mb-2">
              Días con sobreasignación ({overallocatedDates.length} día{overallocatedDates.length !== 1 ? 's' : ''}):
            </div>
            <div className="max-h-48 overflow-y-auto border rounded-lg">
              <div className="space-y-1 p-2">
                {overallocatedDates.length > 0 ? (
                  overallocatedDates.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                      <span className="text-sm text-gray-700">
                        {formatDate(item.date)}
                      </span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs font-medium ${getSeverityColor(item.total_allocation)}`}
                      >
                        {formatPercentage(item.total_allocation)}%
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 p-2 text-center">
                    No se pudieron calcular los días específicos
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Resumen de sobreasignación */}
          {overallocatedDates.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Resumen:</p>
                <p>
                  {personName} estará sobreasignado en {overallocatedDates.length} día{overallocatedDates.length !== 1 ? 's' : ''} 
                  con un máximo de {Math.max(...overallocatedDates.map(d => formatPercentage(d.total_allocation)))}% de asignación.
                </p>
              </div>
            </div>
          )}

          {/* Advertencia */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Advertencia</p>
                <p>
                  Una asignación superior al 100% puede indicar que la persona no tendrá 
                  capacidad suficiente para completar todas las tareas asignadas.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={isSubmitting}
            data-test="overallocation-modal-close-button"
          >
            Seguir editando
          </Button>
          <Button
            onClick={handleConfirm}
            className="flex-1"
            disabled={isSubmitting}
            data-test="overallocation-modal-confirm-button"
          >
            {isSubmitting ? 'Guardando...' : 'Continuar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 