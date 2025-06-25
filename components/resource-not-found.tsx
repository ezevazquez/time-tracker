import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface ResourceNotFoundProps {
  resourceName: string
  resourcePath: string
}
export const ResourceNotFound = ({ resourceName, resourcePath }: ResourceNotFoundProps) => {
  return (
    <main className="flex-1 container mx-auto px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-yellow-800">
            {resourceName} no encontrado
          </AlertDescription>
        </Alert>
        <div className="mt-6">
          <Button asChild>
            <Link href={resourcePath} data-test="back-button">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a la lista
            </Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
