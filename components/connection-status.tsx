'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, RefreshCw, Database } from 'lucide-react'
import { testSupabaseConnection } from '@/lib/supabase/connection'
import { isSupabaseConfigured } from '@/lib/supabase/client'

interface ConnectionStatus {
  configured: boolean
  connected: boolean
  error?: string
  testing: boolean
}

export function ConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>({
    configured: false,
    connected: false,
    testing: false,
  })

  const testConnection = async () => {
    setStatus(prev => ({ ...prev, testing: true }))

    const configured = isSupabaseConfigured()

    if (!configured) {
      setStatus({
        configured: false,
        connected: false,
        error: 'Environment variables not properly configured',
        testing: false,
      })
      return
    }

    const result = await testSupabaseConnection()

    setStatus({
      configured: true,
      connected: result.success,
      error: result.success ? undefined : result.error,
      testing: false,
    })
  }

  useEffect(() => {
    testConnection()
  }, [])

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Connection Status
        </CardTitle>
        <CardDescription>Current status of your Supabase database connection</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Configuration:</span>
              {status.configured ? (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Configured
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Not Configured
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Connection:</span>
              {status.testing ? (
                <Badge variant="secondary">
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Testing...
                </Badge>
              ) : status.connected ? (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Disconnected
                </Badge>
              )}
            </div>

            {status.error && (
              <div className="text-sm text-red-600 mt-2">
                <strong>Error:</strong> {status.error}
              </div>
            )}
          </div>

          <Button onClick={testConnection} disabled={status.testing} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${status.testing ? 'animate-spin' : ''}`} />
            Test Connection
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
