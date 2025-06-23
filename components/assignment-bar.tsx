"use client"

import { format } from "date-fns"
import Link from "next/link"
import type { Assignment } from "@/types/assignment"
import type { Project } from "@/types/project"
import { calculateStickyPosition, stringToColor } from "@/lib/assignments"
import { fteToPercentage } from "@/lib/utils/fte-calculations"
import { Trash2 } from 'lucide-react'
import { useState, useRef, useLayoutEffect, useEffect } from "react"
import { useDraggable } from '@dnd-kit/core'
import { cn } from '@/utils/classnames'

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
  onRequestEdit?: () => void
  isContextMenuOpen?: boolean
  setContextMenuOpen?: (open: boolean) => void
  isDraggingAssignment?: boolean
  disableAllTooltips?: boolean
  overrideBar?: {
    assignmentId: string
    left: number
    width: number
  }
  bgColor: string
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
  onRequestEdit,
  isContextMenuOpen,
  setContextMenuOpen,
  isDraggingAssignment = false,
  disableAllTooltips = false,
  overrideBar,
  bgColor,
}: AssignmentBarProps & { onRequestEdit?: () => void, isContextMenuOpen?: boolean, setContextMenuOpen?: (open: boolean) => void, isDraggingAssignment?: boolean, disableAllTooltips?: boolean, overrideBar?: { assignmentId: string, left: number, width: number }, bgColor: string }) {
  const [open, setOpen] = useState(false)

  // Tooltip: posición y visibilidad
  const [tooltip, setTooltip] = useState<{ visible: boolean }>({ visible: false })
  const [tooltipPos, setTooltipPos] = useState<{ top: number, left: number }>({ top: 0, left: 0 })
  const tooltipRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const showTimeout = useRef<NodeJS.Timeout | null>(null)
  const hideTimeout = useRef<NodeJS.Timeout | null>(null)

  // Estado para desactivar tooltips al interactuar con el handle
  const [disableTooltipByHandle, setDisableTooltipByHandle] = useState(false)

  // Mostrar tooltip con delay y centrado arriba de la barra
  const handleBarMouseEnter = () => {
    if (hideTimeout.current) clearTimeout(hideTimeout.current)
    if (!isDraggingAssignment && !contextMenu && !disableAllTooltips && !disableTooltipByHandle) {
      showTimeout.current = setTimeout(() => setTooltip({ visible: true }), 500)
    }
  }

  // Fijo: tooltip a la derecha de la barra, 12px a la derecha, 5px arriba
  const getTooltipPosition = () => {
    if (!barRef.current) return { top: 0, left: 0 }
    const barRect = barRef.current.getBoundingClientRect()
    const tooltipWidth = 320 // igual que maxWidth
    const tooltipHeight = 120 // estimado, puede ajustarse
    let top = barRect.top + window.scrollY + 5
    let left = barRect.right + 12 + window.scrollX
    // Ajustar para que no se salga del viewport
    if (left + tooltipWidth > window.innerWidth) {
      left = window.innerWidth - tooltipWidth - 8
    }
    if (left < 0) left = 8
    if (top + tooltipHeight > window.innerHeight + window.scrollY) {
      top = window.innerHeight + window.scrollY - tooltipHeight - 8
    }
    if (top < 0) top = 8
    return { top, left }
  }

  // Si el mouse sale de la barra, ocultar el tooltip después de un pequeño delay (por si entra al tooltip)
  const handleBarMouseLeave = () => {
    if (showTimeout.current) clearTimeout(showTimeout.current)
    hideTimeout.current = setTimeout(() => setTooltip({ visible: false }), 80)
  }
  // Si el mouse sale del tooltip, ocultar
  const handleTooltipMouseLeave = () => {
    setTooltip(t => ({ ...t, visible: false }))
  }

  // Calculate sticky positioning - only when bar is partially scrolled
  const stickyInfo = calculateStickyPosition(dimensions.left, dimensions.width, scrollLeft, sidebarWidth)
  // Debug sticky values
  // console.log({ stickyInfo, scrollLeft, sidebarWidth, dimensions })

  // Obtener DAY_WIDTH desde props o definirlo aquí si no está disponible
  const DAY_WIDTH = 40 // Debe coincidir con el valor en ResourceTimeline

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: assignment.id,
    data: { assignment, snappedX: 0, initialLeft: dimensions.left },
  })
  // Sticky horizontal: snap a los días durante el drag
  let snappedTransform = transform
  if (transform && isDragging) {
    const snappedX = Math.round(transform.x / DAY_WIDTH) * DAY_WIDTH
    snappedTransform = { ...transform, x: snappedX }
  }
  const style = {
    ...(snappedTransform && {
      transform: `translate3d(${snappedTransform.x}px, ${snappedTransform.y}px, 0)`
    }),
    backgroundColor: bgColor,
    left: overrideBar && overrideBar.assignmentId === assignment.id ? `${overrideBar.left}px` : `${dimensions.left}px`,
    width: overrideBar && overrideBar.assignmentId === assignment.id && overrideBar.width !== undefined ? `${overrideBar.width}px` : `${dimensions.width}px`,
    top: `${top}px`,
    height: `${height}px`,
    zIndex: Math.min(zIndex, 10),
    opacity: isDragging ? 0.7 : 1,
    cursor: 'grab',
  }

  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)

  // Cerrar menú contextual al hacer click fuera o con Escape
  useEffect(() => {
    if (!contextMenu) return
    const handle = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null)
        setContextMenuOpen && setContextMenuOpen(false)
      }
    }
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu(null)
        setContextMenuOpen && setContextMenuOpen(false)
      }
    }
    window.addEventListener('mousedown', handle)
    window.addEventListener('keydown', handleEsc)
    return () => {
      window.removeEventListener('mousedown', handle)
      window.removeEventListener('keydown', handleEsc)
    }
  }, [contextMenu, setContextMenuOpen])

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY })
    setContextMenuOpen && setContextMenuOpen(true)
    setTooltip({ visible: false }) // Ocultar tooltip si se abre el menú
  }

  // Resize handles: dnd-kit
  const leftHandle = useDraggable({
    id: `resize-left-${assignment.id}`,
    data: { assignment, type: 'resize-left', dimensions },
  })
  const rightHandle = useDraggable({
    id: `resize-right-${assignment.id}`,
    data: { assignment, type: 'resize-right', dimensions },
  })

  // Handler para mouse down en el handle
  const handleHandleMouseDown = () => {
    setDisableTooltipByHandle(true)
    setTooltip({ visible: false })
  }

  useEffect(() => {
    if (overrideBar) {
      console.log('ASSIGNMENT BAR OVERRIDE', { assignmentId: assignment.id, overrideBar })
    }
  }, [overrideBar, assignment.id])

  return (
    <>
      <div
        ref={node => {
          setNodeRef(node)
          barRef.current = node
        }}
        {...listeners}
        {...attributes}
        className="absolute rounded-lg shadow-md transition-all hover:shadow-lg hover:translate-y-[-1px] group border border-white/20 overflow-hidden"
        style={style}
        onMouseEnter={handleBarMouseEnter}
        onMouseLeave={handleBarMouseLeave}
        onContextMenu={handleContextMenu}
        data-assignment-bar-id={assignment.id}
      >
        {/* Left resize handle */}
        {false && (
          <div
            style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: 8, zIndex: 30 }}
          >
            <div
              ref={leftHandle.setNodeRef}
              {...leftHandle.listeners}
              {...leftHandle.attributes}
              onMouseDown={handleHandleMouseDown}
              className={cn(
                'absolute left-0 top-0 h-full w-2 cursor-ew-resize',
                'bg-blue-500/60 opacity-0 group-hover:opacity-80 transition-opacity',
                'rounded-l-md',
                'hover:bg-blue-600/80',
              )}
              style={{
                pointerEvents: isDraggingAssignment ? 'none' : 'auto',
                display: isDraggingAssignment ? 'none' : undefined,
              }}
            />
          </div>
        )}
        {/* Right resize handle */}
        {false && (
          <div
            style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: 8, zIndex: 30 }}
          >
            <div
              ref={rightHandle.setNodeRef}
              {...rightHandle.listeners}
              {...rightHandle.attributes}
              onMouseDown={handleHandleMouseDown}
              className={cn(
                'absolute right-0 top-0 h-full w-2 cursor-ew-resize',
                'bg-blue-500/60 opacity-0 group-hover:opacity-80 transition-opacity',
                'rounded-r-md',
                'hover:bg-blue-600/80',
              )}
              style={{
                pointerEvents: isDraggingAssignment ? 'none' : 'auto',
                display: isDraggingAssignment ? 'none' : undefined,
              }}
            />
          </div>
        )}
        {/* Assignment label container - ONLY sticky when needed */}
        <div
          className="absolute inset-0 flex items-center overflow-hidden"
          style={{
            left: stickyInfo.isSticky ? `${stickyInfo.labelLeft}px` : "0px",
            width: stickyInfo.isSticky ? `${stickyInfo.labelMaxWidth}px` : "100%",
          }}
        >
          <div className="px-3 py-1 text-black font-light flex items-center text-sm w-full min-w-0">
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
      {tooltip.visible && !isDraggingAssignment && !contextMenu && !disableAllTooltips && !disableTooltipByHandle && (
        <div
          ref={tooltipRef}
          style={{
            position: 'fixed',
            ...getTooltipPosition(),
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
          onMouseLeave={handleTooltipMouseLeave}
        >
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: bgColor }}></div>
              <p className="font-medium">{project.name}</p>
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
      {/* Menú contextual custom */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 10000,
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            boxShadow: '0 4px 24px 0 rgba(0,0,0,0.12)',
            minWidth: 140,
            padding: 0,
            fontSize: 15,
            color: '#111827',
          }}
        >
          <button
            className="w-full text-left px-4 py-2 hover:bg-gray-100"
            onClick={e => {
              e.stopPropagation();
              setContextMenu(null);
              setContextMenuOpen && setContextMenuOpen(false);
              onRequestEdit && onRequestEdit();
            }}
          >Editar</button>
          <button
            className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
            onClick={e => {
              e.stopPropagation();
              setContextMenu(null);
              setContextMenuOpen && setContextMenuOpen(false);
              onRequestDelete && onRequestDelete();
            }}
          >Eliminar</button>
        </div>
      )}
    </>
  )
} 