"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConnectionStatus } from "@/components/connection-status"
import { Badge } from "@/components/ui/badge"
import { Database, Wifi, Settings } from "lucide-react"
import { isSupabaseConfigured } from "@/lib/supabase"

export default function SettingsPage() {
  const supabaseConfigured = isSupabaseConfigured()

  return (
    <main className="flex-1 container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your application configuration and database connection</p>
      </div>

      <div className="grid gap-6">
        {/* Database Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Database Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Data Source</h3>
                <p className="text-sm text-gray-500">Current data source being used by the application</p>
              </div>
              <Badge variant="outline" className="flex items-center space-x-1">
                {supabaseConfigured ? (
                  <>
                    <Wifi className="h-3 w-3" />
                    <span>Supabase Database</span>
                  </>
                ) : (
                  <>
                    <Database className="h-3 w-3" />
                    <span>Mock Data</span>
                  </>
                )}
              </Badge>
            </div>

            {/* Connection Status Component */}
            <ConnectionStatus />

            {!supabaseConfigured && (
              <div className="rounded-md bg-yellow-50 p-4 border border-yellow-200">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Using Mock Data</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        The application is currently using mock data. To connect to your Supabase database, please
                        configure the following environment variables:
                      </p>
                      <ul className="mt-2 list-disc list-inside space-y-1">
                        <li>
                          <code className="bg-yellow-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code>
                        </li>
                        <li>
                          <code className="bg-yellow-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
                        </li>
                        <li>
                          <code className="bg-yellow-100 px-1 rounded">DB_URL</code>
                        </li>
                        <li>
                          <code className="bg-yellow-100 px-1 rounded">API_KEY</code>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Environment Variables */}
        <Card>
          <CardHeader>
            <CardTitle>Environment Variables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">NEXT_PUBLIC_SUPABASE_URL</label>
                  <div className="mt-1 text-sm text-gray-500">
                    {process.env.NEXT_PUBLIC_SUPABASE_URL ? (
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        Configured
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-red-600 border-red-200">
                        Not Set
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">NEXT_PUBLIC_SUPABASE_ANON_KEY</label>
                  <div className="mt-1 text-sm text-gray-500">
                    {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? (
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        Configured
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-red-600 border-red-200">
                        Not Set
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
