"use client"

import { useAuth0 } from "@auth0/auth0-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CalendarDays, LogOut, Plus, Settings, Users } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function Header() {
  const { user, logout } = useAuth0()
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-6">
      <div className="flex items-center gap-8">
        <Link href="/dashboard" className="text-xl font-bold text-primary">
          TimeTracker
        </Link>
        <nav className="hidden md:block">
          <ul className="flex gap-6">
            <li>
              <Link
                href="/dashboard"
                className={`flex items-center gap-2 ${pathname === "/dashboard" ? "text-primary" : "text-gray-600"}`}
              >
                <CalendarDays className="h-4 w-4" />
                <span>Timeline</span>
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/people"
                className={`flex items-center gap-2 ${
                  pathname === "/dashboard/people" ? "text-primary" : "text-gray-600"
                }`}
              >
                <Users className="h-4 w-4" />
                <span>People</span>
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/projects"
                className={`flex items-center gap-2 ${
                  pathname === "/dashboard/projects" ? "text-primary" : "text-gray-600"
                }`}
              >
                <Settings className="h-4 w-4" />
                <span>Projects</span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/assignments/new">
            <Plus className="mr-2 h-4 w-4" />
            New Assignment
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.picture} alt={user?.name || "User"} />
                <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

