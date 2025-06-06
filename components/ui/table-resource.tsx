import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ResourceColumn } from "@/types";

interface TableResourceProps<T> {
  items: T[];
  columns: ResourceColumn<T>[];
  title?: string;
  description?: string;
}

export const TableResource = <T,>({
  items,
  columns,
  title,
  description,
}: TableResourceProps<T>) => {
  console.log("TableResource items:", items);

  return (
    <Card>
      {(title || description) && (
        <CardHeader>
          {title && (
            <CardTitle>
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.map((column, colIndex) => (
                  <TableCell key={colIndex}>{column.render(item)}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
