import { Button } from './ui/button'
import Link from 'next/link'
import { ReactNode } from 'react'
import { Plus } from 'lucide-react'

interface ResourceHeaderProps {
  title: string
  buttonLabel: string
  buttonHref: string
  buttonOnClick?: () => void
  buttonIcon?: ReactNode
  children?: ReactNode
}

export function ResourceHeader({ title, buttonLabel, buttonHref, buttonOnClick, buttonIcon, children }: ResourceHeaderProps) {
  return (
    <div className="flex-shrink-0 border-b bg-white py-2">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">{title}</h1>
          <div className="flex gap-2 flex-wrap items-center">
            <Button size="sm" className="h-8" asChild={!!buttonHref} onClick={buttonOnClick}>
              {buttonHref ? (
                <Link href={buttonHref}>
                  {buttonIcon || <Plus className="h-4 w-4" />} {buttonLabel}
                </Link>
              ) : (
                <>
                  {buttonIcon || <Plus className="h-4 w-4" />} {buttonLabel}
                </>
              )}
            </Button>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
} 