'use client'

import { AlertTriangle, Calendar, Percent } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { renderDate } from '@/utils/renderDate'

interface OverallocationWarningProps {
  isOverallocated: boolean
  overallocatedDates: Array<{ date: string; totalAllocation: number }>
  maxAllocation: number
  onConfirm?: () => void
  onCancel?: () => void
}

export function OverallocationWarning({
  isOverallocated,
  overallocatedDates,
  maxAllocation,
  onConfirm,
  onCancel,
}: OverallocationWarningProps) {
  if (!isOverallocated) return null

  const maxPercentage = Math.round(maxAllocation * 100)
  const dateCount = overallocatedDates.length

  const getDateRangeText = () => {
    if (dateCount === 1) {
      return renderDate(overallocatedDates[0].date)
    } else if (dateCount <= 3) {
      return overallocatedDates
        .map(d => renderDate(d.date))
        .join(', ')
    } else {
      const firstDate = renderDate(overallocatedDates[0].date)
      const lastDate = renderDate(overallocatedDates[dateCount - 1].date)
      return `${firstDate} - ${lastDate}`
    }
  }

  return (
    <Alert variant="destructive" className="border-orange-200 bg-orange-50">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="text-orange-800">Sobreasignación detectada</AlertTitle>
      <AlertDescription className="text-orange-700">
        <div className="space-y-2">
          <p>
            Esta asignación causará que la persona exceda el 100% de capacidad en{' '}
            <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
              {dateCount} {dateCount === 1 ? 'día' : 'días'}
            </Badge>
          </p>
          
          <div className="flex items-center gap-2 text-sm">
            <Percent className="h-3 w-3" />
            <span>Máxima asignación: <strong>{maxPercentage}%</strong></span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-3 w-3" />
            <span>Períodos afectados: <strong>{getDateRangeText()}</strong></span>
          </div>

          {onConfirm && onCancel && (
            <div className="flex gap-2 pt-2">
              <button
                onClick={onConfirm}
                className="px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
              >
                Continuar de todas formas
              </button>
              <button
                onClick={onCancel}
                className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
} 