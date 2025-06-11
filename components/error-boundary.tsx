'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-red-900">Error de Configuración</CardTitle>
              <CardDescription>
                Hay un problema con la configuración de la aplicación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">
                  {this.state.error?.message || 'Error desconocido'}
                </p>
              </div>

              <div className="text-sm text-gray-600">
                <p className="font-medium mb-2">Posibles soluciones:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Verifica que las variables de entorno estén configuradas</li>
                  <li>Asegúrate de que NEXT_PUBLIC_SUPABASE_URL esté definida</li>
                  <li>Verifica que NEXT_PUBLIC_SUPABASE_ANON_KEY esté definida</li>
                  <li>Reinicia el servidor de desarrollo</li>
                </ul>
              </div>

              <Button onClick={() => window.location.reload()} className="w-full" variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Recargar Página
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}
