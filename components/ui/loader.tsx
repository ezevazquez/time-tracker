import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";

type LoaderProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-10 w-10",
  lg: "h-14 w-14",
};

export const Loader: React.FC<LoaderProps> = ({ size = "md", className }) => {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Loader2 className={cn("mr-2 animate-spin", sizeClasses[size])} />
    </div>
  );
};
