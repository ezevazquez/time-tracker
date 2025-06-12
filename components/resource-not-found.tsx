import { Alert, AlertDescription } from '@/components/ui/alert'
import { Resource } from '@/types'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface ResourceNotFoundProps {
  resource: Resource
}
export const ResourceNotFound = ({ resource }: ResourceNotFoundProps) => {
  return (
    <main className="flex-1 container mx-auto px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-yellow-800">
            {resource.singularLabel} no encontrado
          </AlertDescription>
        </Alert>
        <div className="mt-6">
          <Button asChild>
            <Link href={`/${resource.path}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a la lista
            </Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
