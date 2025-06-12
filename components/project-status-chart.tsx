'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import type { Project } from '@/types/project'
import { PROJECT_STATUS } from '@/constants/projects'

interface ProjectStatusChartProps {
  projects: Project[]
}

export function ProjectStatusChart({ projects }: ProjectStatusChartProps) {
  // Filter out finished projects and count projects by status
  const activeProjects = projects.filter(project => project.status !== PROJECT_STATUS.FINISHED)
  
  const statusCounts = activeProjects.reduce(
    (acc, project) => {
      acc[project.status] = (acc[project.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const data = Object.entries(statusCounts).map(([status, count]) => ({
    name: status,
    value: count,
    percentage: Math.round((count / activeProjects.length) * 100),
  }))

  const COLORS = {
    [PROJECT_STATUS.IN_PROGRESS]: '#10B981', // Verde para proyectos en progreso
    [PROJECT_STATUS.FINISHED]: '#3B82F6',    // Azul para proyectos finalizados
    [PROJECT_STATUS.ON_HOLD]: '#F59E0B',     // Amarillo para proyectos en pausa
    [PROJECT_STATUS.NOT_STARTED]: '#6B7280', // Gris para proyectos no iniciados
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-gray-600">
            {data.value} proyectos ({data.percentage}%)
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
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          Estado de Proyectos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[entry.name as keyof typeof COLORS] || '#6B7280'}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value, entry) => {
                  const dataItem = data.find(item => item.name === value)
                  return (
                    <span style={{ color: entry.color }}>
                      {value} ({dataItem?.percentage}%)
                    </span>
                  )
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
