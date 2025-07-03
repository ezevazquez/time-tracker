'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { Person } from '@/types/people'
import type { AssignmentWithRelations } from '@/types/assignment'
import { PERSON_STATUS } from '@/constants/people'
import { parseDateFromString } from '@/lib/assignments'
import { useEffect, useState } from 'react'
import { getProfiles, Profile } from '@/lib/services/profiles.service'

interface TeamWorkloadChartProps {
  people: Person[]
  assignments: AssignmentWithRelations[]
}

export function TeamWorkloadChart({ people, assignments }: TeamWorkloadChartProps) {
  const currentDate = new Date()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loadingProfiles, setLoadingProfiles] = useState(false)
  const [errorProfiles, setErrorProfiles] = useState<string | null>(null)

  useEffect(() => {
    setLoadingProfiles(true)
    getProfiles()
      .then(data => setProfiles(data))
      .catch(e => setErrorProfiles(e.message || 'Error al cargar perfiles'))
      .finally(() => setLoadingProfiles(false))
  }, [])

  // Map profile name to label (description)
  const profileNameToLabel: Record<string, string> = {}
  profiles.forEach(p => {
    profileNameToLabel[p.name] = p.description?.trim() || p.name
  })

  // Agrupar por label
  const assignmentData = people
    .filter(person => person.status === PERSON_STATUS.ACTIVE)
    .reduce((acc, person) => {
      const label = profileNameToLabel[person.profile] || person.profile
      if (!acc[label]) {
        acc[label] = {
          label,
          totalPeople: 0,
          assignedPeople: 0,
        }
      }

      acc[label].totalPeople += 1

      // Check if person has any current assignments
      const hasCurrentAssignment = assignments.some(assignment => {
        const start = parseDateFromString(assignment.start_date)
        const end = parseDateFromString(assignment.end_date)
        return assignment.person_id === person.id && start <= currentDate && end >= currentDate
      })

      if (hasCurrentAssignment) {
        acc[label].assignedPeople += 1
      }
      return acc
    }, {} as Record<string, { label: string; totalPeople: number; assignedPeople: number }>)

  // Convert to array and calculate percentage assigned per label
  const chartData = Object.values(assignmentData)
    .map(item => ({
      name: item.label,
      fullName: item.label,
      percentage: Math.round((item.assignedPeople / item.totalPeople) * 100),
      totalPeople: item.totalPeople,
      assignedPeople: item.assignedPeople,
    }))
    .sort((a, b) => b.percentage - a.percentage)

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{data.fullName}</p>
          <p className="text-sm text-gray-600">
            Asignados: {data.assignedPeople} de {data.totalPeople}
          </p>
          <p className="text-sm text-gray-600">
            Porcentaje: {data.percentage}%
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card data-test="team-workload-chart-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          Asignación por equipo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                domain={[0, 100]}
                tickFormatter={value => `${value}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="percentage"
                fill="#10B981"
                radius={[4, 4, 0, 0]}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.percentage === 100 ? '#86EFAC' : entry.percentage > 50 ? '#FDE68A' : '#FCA5A5'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
