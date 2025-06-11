import { Button } from '@/components/ui/button'
import Link from 'next/link'
import React from 'react'
import { Resource } from '@/types'
import { Loader } from '../loader'
import { getStatusBadge } from '@/utils/getStatusBadge'
import { getStatusLabel } from '@/utils/getStatusLabel'
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'

interface ResourceLayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
  resource?: Resource
  isLoading?: boolean
  status?: string
  headerContent?: React.ReactNode
  action?: React.ReactNode
}

export const ResourceLayout = ({
  children,
  title,
  description,
  resource,
  isLoading,
  status,
  headerContent,
  action,
}: ResourceLayoutProps) => {
  if (isLoading) {
    return (
      <Loader
        className="items-center justify-center min-h-[calc(100vh_-_var(--header-height))]"
        size="md"
      />
    )
  }
  return (
    <main className="flex-1 container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{title || resource?.singularLabel}</h1>
          {description && <p className="text-muted-foreground">{description}</p>}
          <div className="flex items-center space-x-4 mt-2">
            {headerContent && <div className="flex items-center space-x-2">{headerContent}</div>}
            {status && <Badge className={getStatusBadge(status)}>{getStatusLabel(status)}</Badge>}
          </div>
        </div>
        {action && action}
      </div>
      {children}
    </main>
  )
}
