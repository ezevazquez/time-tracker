"use client"

import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { format } from "date-fns"
import Link from "next/link"
import type { Assignment } from "@/types/assignment"
import type { Project } from "@/types/project"
import { calculateStickyPosition, stringToColor } from "@/lib/assignments"
import { fteToPercentage } from "@/lib/utils/fte-calculations"
import { Trash2 } from 'lucide-react'
import { useState, useRef, useLayoutEffect } from "react"

interface AssignmentBarProps {
  assignment: Assignment
  project: Project
  dimensions: {
    left: number
    width: number
    startDate: Date
    endDate: Date
  }
  top: number
  height: number
  scrollLeft: number
  sidebarWidth: number
  zIndex?: number
  onRequestDelete?: () => void
}

export function AssignmentBar({
  assignment,
  project,
  dimensions,
  top,
  height,
  scrollLeft,
  sidebarWidth,
  zIndex = 5,
  onRequestDelete,
}: AssignmentBarProps) {
  const bgColor = stringToColor(project.name)
  const [open, setOpen] = useState(false)

  // Tooltip: posición y visibilidad
  const [tooltip, setTooltip] = useState<{ visible: boolean, x: number, y: number }>({ visible: false, x: 0, y: 0 })
  const [tooltipPos, setTooltipPos] = useState<{ top: number, left: number }>({ top: 0, left: 0 })
  const tooltipRef = useRef<HTMLDivElement>(null)
  const hideTimeout = useRef<NodeJS.Timeout | null>(null)

  // Mostrar tooltip en la posición del mouse
  const handleBarMouseEnter = (e: React.MouseEvent) => {
    if (hideTimeout.current) clearTimeout(hideTimeout.current)
    setTooltip({ visible: true, x: e.clientX, y: e.clientY })
  }
  // Si el mouse sale de la barra, ocultar el tooltip después de un pequeño delay (por si entra al tooltip)
  const handleBarMouseLeave = () => {
    hideTimeout.current = setTimeout(() => setTooltip(t => ({ ...t, visible: false })), 80)
  }
  // Si el mouse entra al tooltip, cancelar el ocultamiento
  const handleTooltipMouseEnter = () => {
    if (hideTimeout.current) clearTimeout(hideTimeout.current)
    setTooltip(t => ({ ...t, visible: true }))
  }
  // Si el mouse sale del tooltip, ocultar
  const handleTooltipMouseLeave = () => {
    setTooltip(t => ({ ...t, visible: false }))
  }

  // Calcular la posición ideal del tooltip para que no se salga de la pantalla
  useLayoutEffect(() => {
    if (!tooltip.visible) return
    const padding = 12
    const offset = 12
    const tooltipEl = tooltipRef.current
    if (!tooltipEl) return
    const { width, height } = tooltipEl.getBoundingClientRect()
    let left = tooltip.x + offset
    let top = tooltip.y + offset
    // Si se sale por la derecha
    if (left + width + padding > window.innerWidth) {
      left = tooltip.x - width - offset
    }
    // Si se sale por abajo
    if (top + height + padding > window.innerHeight) {
      top = tooltip.y - height - offset
    }
    // Si se sale por la izquierda
    if (left < padding) {
      left = padding
    }
    // Si se sale por arriba
    if (top < padding) {
      top = padding
    }
    setTooltipPos({ top, left })
  }, [tooltip])

  // Calculate sticky positioning - only when bar is partially scrolled
  const stickyInfo = calculateStickyPosition(dimensions.left, dimensions.width, scrollLeft, sidebarWidth)
  // Debug sticky values
  // console.log({ stickyInfo, scrollLeft, sidebarWidth, dimensions })

  return (
    <>
      <Link href={`/assignments/${assignment.id}/edit`} className="block">
        <div
          className="absolute rounded-lg shadow-md cursor-pointer transition-all hover:shadow-lg hover:translate-y-[-1px] group border border-white/20 overflow-hidden"
          style={{
            backgroundColor: bgColor,
            left: `${dimensions.left}px`,
            width: `${dimensions.width}px`,
            top: `${top}px`,
            height: `${height}px`,
            zIndex: Math.min(zIndex, 10),
          }}
          onMouseEnter={handleBarMouseEnter}
          onMouseLeave={handleBarMouseLeave}
        >
          {/* Assignment label container - ONLY sticky when needed */}
          <div
            className="absolute inset-0 flex items-center overflow-hidden"
            style={{
              left: stickyInfo.isSticky ? `${stickyInfo.labelLeft}px` : "0px",
              width: stickyInfo.isSticky ? `${stickyInfo.labelMaxWidth}px` : "100%",
            }}
          >
            <div className="px-3 py-1 text-white font-medium flex items-center text-sm w-full min-w-0">
              {/* Project name and percentage together */}
              <div className="flex items-center space-x-2 min-w-0">
                <span className="truncate">{project.name}</span>
                <span className="bg-black/30 text-white text-xs px-1.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                  {fteToPercentage(assignment.allocation)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
      {tooltip.visible && (
        <div
          ref={tooltipRef}
          style={{
            position: 'fixed',
            top: tooltipPos.top,
            left: tooltipPos.left,
            zIndex: 9999,
            pointerEvents: 'auto',
            background: '#111827',
            color: 'white',
            border: '1px solid #374151',
            borderRadius: 8,
            padding: 12,
            maxWidth: 320,
            boxShadow: '0 4px 24px 0 rgba(0,0,0,0.18)',
            fontSize: 14,
          }}
          onMouseEnter={handleTooltipMouseEnter}
          onMouseLeave={handleTooltipMouseLeave}
        >
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: bgColor }}></div>
              <p className="font-medium">{project.name}</p>
              {onRequestDelete && (
                <button
                  className="ml-auto text-red-400 hover:text-red-600 transition-colors"
                  title="Eliminar asignación"
                  onClick={e => {
                    e.preventDefault(); e.stopPropagation();
                    onRequestDelete()
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="text-sm">
              {format(dimensions.startDate, "dd MMM")} - {format(dimensions.endDate, "dd MMM yyyy")}
            </p>
            <p className="text-sm">{fteToPercentage(assignment.allocation)}% asignación</p>
            <p className="text-sm">Facturable: {assignment.is_billable ? "Sí" : "No"}</p>
            {project.description && <p className="text-xs opacity-75">{project.description}</p>}
          </div>
        </div>
      )}
    </>
  )
} 