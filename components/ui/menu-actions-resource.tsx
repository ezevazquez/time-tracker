import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Resource, ResourceAction } from "@/types";

interface MenuActionsResourceProps {
  actions?: ResourceAction[];
  id: string;
}

export const MenuActionsResource = ({
  actions,
  id,
}: MenuActionsResourceProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Acciones</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions?.map((action) => {
          const href = action.path ? `/${action.path(id)}` : "#";
          return (
            <Link
              key={action.label}
              href={href}
              onClick={() => action.onClick?.(id)}
            >
              <DropdownMenuItem>
                {action.icon && <action.icon className="mr-2 h-4 w-4" />}
                {action.label}
              </DropdownMenuItem>
            </Link>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
