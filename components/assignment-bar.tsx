"use client"

import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { format } from "date-fns"
import Link from "next/link"
import type { Assignment } from "@/types/assignment"
import type { Project } from "@/types/project"
import { calculateStickyPosition, stringToColor } from "@/lib/assignments"
import { fteToPercentage } from "@/lib/utils/fte-calculations"

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
}: AssignmentBarProps) {
  const bgColor = stringToColor(project.name)

  // Calculate sticky positioning - only when bar is partially scrolled
  const stickyInfo = calculateStickyPosition(dimensions.left, dimensions.width, scrollLeft, sidebarWidth)
  // Debug sticky values
  // console.log({ stickyInfo, scrollLeft, sidebarWidth, dimensions })

  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
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
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-gray-900 text-white border-gray-700 p-3 max-w-xs z-50">
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
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 