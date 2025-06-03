"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/people", label: "Personas" },
  { href: "/projects", label: "Proyectos" },
  { href: "/assignments", label: "Asignaciones" },
  { href: "/settings", label: "Configuración" },
]

export function MainNav() {
  const pathname = usePathname()

  return (
    <nav className="hidden md:flex space-x-6">
      {navItems.map((item) => {
        const isActive = pathname === item.href || 
          (item.href !== "/" && pathname?.startsWith(item.href))

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              isActive
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
} 