import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface ResourceErrorProps {
  resourceName: string
  resourcePath: string
  error: string
}
export const ResourceError = ({ error, resourceName, resourcePath }: ResourceErrorProps) => {
  return (
    <main className="flex-1 container mx-auto px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800">
            {error || `Error al cargar el ${resourceName}`}
          </AlertDescription>
        </Alert>
        <div className="mt-6">
          <Button asChild>
            <Link href={resourcePath}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a la lista
            </Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
