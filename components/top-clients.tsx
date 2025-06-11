'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, TrendingUp } from 'lucide-react'
import type { Client, Project } from '@/lib/supabase'

interface TopClientsProps {
  clients: Client[]
  projects: Project[]
}

export function TopClients({ clients, projects }: TopClientsProps) {
  // Calculate client metrics
  const clientMetrics = clients
    .map(client => {
      const clientProjects = projects.filter(project => project.client_id === client.id)
      const activeProjects = clientProjects.filter(project => project.status === 'Active')
      const completedProjects = clientProjects.filter(project => project.status === 'Completed')

      return {
        ...client,
        totalProjects: clientProjects.length,
        activeProjects: activeProjects.length,
        completedProjects: completedProjects.length,
        completionRate:
          clientProjects.length > 0
            ? Math.round((completedProjects.length / clientProjects.length) * 100)
            : 0,
      }
    })
    .filter(client => client.totalProjects > 0) // Only show clients with projects
    .sort((a, b) => b.totalProjects - a.totalProjects)
    .slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-indigo-600" />
          Principales Clientes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {clientMetrics.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No hay clientes con proyectos</p>
        ) : (
          clientMetrics.map((client, index) => (
            <div
              key={client.id}
              className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-indigo-600">#{index + 1}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{client.name}</p>
                  {client.activeProjects > 0 && (
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                      Activo
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-2">
                  <div>
                    Total: {client.totalProjects} proyecto{client.totalProjects !== 1 ? 's' : ''}
                  </div>
                  <div>Activos: {client.activeProjects}</div>
                  <div>Completados: {client.completedProjects}</div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {client.completionRate}% éxito
                  </div>
                </div>

                {client.contact_email && (
                  <p className="text-xs text-gray-500 truncate">{client.contact_email}</p>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
