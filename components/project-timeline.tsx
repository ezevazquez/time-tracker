"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { format, addWeeks, subWeeks, differenceInWeeks, startOfWeek, endOfWeek, isSameMonth, addDays, min as dateMin, max as dateMax, parseISO } from "date-fns"
import { es } from 'date-fns/locale'
import type { Project } from '@/types/project'

interface ProjectWithClient extends Project {
  clients?: { id: string; name: string }
}

interface ProjectTimelineProps {
  projects: ProjectWithClient[]
  from: Date
  to: Date
}

const PROJECT_COLORS = [
  '#A7F3D0', '#BFDBFE', '#DDD6FE', '#FDE68A', '#FBCFE8', '#FECACA', '#FCD34D',
  '#3CBFAE', '#4B6CC1', '#8B5FBF', '#FF9F59', '#F47174', '#2CA58D', '#3973B7', '#7C3AED',
  '#1E8C6B', '#1C3FAA', '#6D28D9', '#FF6700', '#C81E4A',
]
function getProjectColor(projectId: string, projects: { id: string }[]) {
  const idx = projects.findIndex(p => p.id === projectId)
  return PROJECT_COLORS[idx % PROJECT_COLORS.length]
}

const SIDEBAR_WIDTH = 240
const ROW_HEIGHT = 56
const WEEK_WIDTH = 40
const HEADER_HEIGHT = 56

function getWeeksInRange(from: Date, to: Date): Date[] {
  const weeks: Date[] = []
  let current = startOfWeek(from, { weekStartsOn: 1 })
  while (current <= to) {
    weeks.push(current)
    current = addWeeks(current, 1)
  }
  return weeks
}

export const ProjectTimeline = () => (
  <div className="flex items-center justify-center h-full w-full text-xl text-gray-400">
    Estamos trabajando
  </div>
)
