import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ResourceAction } from '@/types/ResourceAction'
import { ResourceColumn } from '@/types/ResourceColumn'

import { MenuActionsResource } from './menu-actions-resource'
import { stringToKebabCase } from '@/utils/stringToKebabCase'

interface TableResourceProps<T extends { id: string }> {
  items: T[]
  columns: ResourceColumn<T>[]
  title?: string
  description?: string
  actions?: ResourceAction[]
}

export const TableResource = <T extends { id: string }>({
  items,
  columns,
  title,
  description,
  actions,
}: TableResourceProps<T>) => {
  return (
    <Card>
      {(title || description) && (
        <CardHeader>
          {title && (
            <CardTitle data-test={`table-${stringToKebabCase(title)}-title`}>
              {title} ({items.length})
            </CardTitle>
          )}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, i) => (
                <TableHead key={i}>{column.title}</TableHead>
              ))}
              {actions && <TableHead>Acciones</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.map((column: ResourceColumn<T>, colIndex) => {
                  return <TableCell key={colIndex}>{column.render(item)}</TableCell>
                })}
                {actions && (
                  <TableCell>
                    <MenuActionsResource actions={actions} id={item.id} />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
