import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";
import { Loader2, Plus } from "lucide-react";
import { Resource } from "@/types";
import { Loader } from "../loader";

interface ResourceLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  resource?: Resource;
  isLoading?: boolean;
}
export const ResourceLayout = ({
  children,
  title,
  description,
  resource,
  isLoading,
}: ResourceLayoutProps) => {
  if (isLoading) {
    return (
      <Loader
        className="items-center justify-center min-h-[calc(100vh_-_var(--header-height))]"
        size="md"
      />
    );
  }
  return (
    <main className="flex-1 container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">
            {title || resource?.singularLabel}
          </h1>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
        <Button asChild>
          <Link href={`/${resource?.slug}/new`}>
            <Plus className="h-4 w-4 mr-2" />
            Crear {resource?.singularLabel}
          </Link>
        </Button>
      </div>
      {children}
    </main>
  );
};
