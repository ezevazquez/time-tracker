import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Resource } from '@/types'
interface ButtonCreateResourceProps {
  resource?: Resource
}
export const ButtonCreateResource = ({ resource }: ButtonCreateResourceProps) => {
  if (!resource) {
    return null
  }
  return (
    <Button asChild>
      <Link href={`/${resource?.slug}/new`}>
        <Plus className="h-4 w-4 mr-2" />
        Crear {resource?.singularLabel}
      </Link>
    </Button>
  )
}
