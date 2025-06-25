'use client'

import { MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { ResourceAction } from '@/types/ResourceAction'
import Link from 'next/link'
import { stringToKebabCase } from '@/utils/stringToKebabCase'

interface MenuActionsResourceProps {
  actions: ResourceAction[]
  id: string
}

export function MenuActionsResource({ actions, id }: MenuActionsResourceProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0" data-test={`menu-actions-${id}`}>
          <span className="sr-only">Abrir menú</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((action, index) => {
          const Icon = action.icon

          if (action.onClick) {
            return (
              <DropdownMenuItem
                key={index}
                onClick={() => action.onClick?.(id)}
                className="cursor-pointer"
                data-test={`menu-action-${stringToKebabCase(action.label)}-${id}`}
              >
                <Icon className="mr-2 h-4 w-4" />
                {action.label}
              </DropdownMenuItem>
            )
          }

          if (action.path) {
            return (
              <DropdownMenuItem key={index} asChild data-test={`menu-action-${stringToKebabCase(action.label)}-${id}`}>
                <Link href={action.path(id)} className="flex items-center">
                  <Icon className="mr-2 h-4 w-4" />
                  {action.label}
                </Link>
              </DropdownMenuItem>
            )
          }

          return null
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
