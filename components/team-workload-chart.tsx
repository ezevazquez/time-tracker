'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { Person } from '@/types/people'
import type { AssignmentWithRelations } from '@/types/assignment'

interface TeamWorkloadChartProps {
  people: Person[]
  assignments: AssignmentWithRelations[]
}

export function TeamWorkloadChart({ people, assignments }: TeamWorkloadChartProps) {
  const currentDate = new Date()

  // Calculate current workload for each active person
  const workloadData = people
    .filter(person => person.status === 'Activo')
    .map(person => {
      const currentAssignments = assignments.filter(assignment => {
        const start = new Date(assignment.start_date)
        const end = new Date(assignment.end_date)
        return assignment.person_id === person.id && start <= currentDate && end >= currentDate
      })

      const totalAllocation = currentAssignments.reduce(
        (sum, assignment) => sum + assignment.allocation * 100,
        0
      )

      return {
        name: person.name.split(' ')[0], // First name only
        workload: Math.round(totalAllocation),
        isOverallocated: totalAllocation > 100,
      }
    })
    .sort((a, b) => b.workload - a.workload)
    .slice(0, 8) // Show top 8 people

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-gray-600">
            Carga: {data.workload}%
            {data.isOverallocated && <span className="text-red-600 ml-2">(Sobreasignado)</span>}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          Carga de Trabajo Actual
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={workloadData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                domain={[0, 'dataMax']}
                tickFormatter={value => `${value}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="workload"
                fill="#10B981"
                radius={[4, 4, 0, 0]}
              >
                {workloadData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.isOverallocated ? '#EF4444' : '#10B981'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Normal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Sobreasignado</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
