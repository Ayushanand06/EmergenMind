"use client"

import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useToast } from "@/hooks/use-toast"
import { Bell, Menu, RefreshCcw } from "lucide-react"
import { useState, useEffect } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getCurrentUser, logoutUser } from "@/lib/client-store"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function TopNav({
  onRefresh,
  sidebar,
  onSearch,
  onLogout,
}: {
  onRefresh: () => void
  sidebar: React.ReactNode
  onSearch?: (q: string) => void
  onLogout?: () => void
}) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [user, setUser] = useState<{ email: string } | null>(null)

  useEffect(() => {
    setUser(getCurrentUser())
  }, [])

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="mx-auto flex max-w-screen-2xl items-center gap-3 px-4 py-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="md:hidden bg-transparent" aria-label="Open menu">
              <Menu className="size-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            {sidebar}
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2">
          <img src="/logo/dispatch-shield.jpg" alt="Emergency Response" className="h-8 w-auto md:h-9" />
          <span className="sr-only">Emergency Response Dashboard</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <Input
                placeholder="Search incidents"
                className="w-[160px] sm:w-[240px]"
                aria-label="Search incidents"
                value={query}
                onChange={(e) => {
                  const v = e.target.value
                  setQuery(v)
                  onSearch?.(v)
                }}
              />
              <Button
                variant="outline"
                onClick={() => {
                  onRefresh()
                  // also broadcast a global refresh for listeners
                  window.dispatchEvent(new Event("erd:refresh"))
                }}
                aria-label="Refresh incidents"
                title="Refresh"
                className="transition-shadow hover:shadow-md active:scale-[0.98] bg-transparent"
              >
                <RefreshCcw className="mr-2 size-4" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" aria-label="Notifications" title="Notifications">
                    <Bell className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>System health nominal</DropdownMenuItem>
                  <DropdownMenuItem>2 incidents escalated to High</DropdownMenuItem>
                  <DropdownMenuItem>Ambulance-3 completed dispatch</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : null}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="size-8 cursor-pointer ring-1 ring-[color:var(--color-border)]">
                  <AvatarImage src="/images/avatar-operator.jpg" alt={user.email} />
                  <AvatarFallback>{user.email?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">Signed in as {user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    logoutUser()
                    setUser(null)
                    onLogout?.()
                  }}
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" aria-label="Login" className="transition hover:bg-[color:var(--color-muted)]">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  className="bg-[color:var(--color-accent)] text-[color:var(--color-accent-foreground)] hover:opacity-90 transition active:scale-[0.98]"
                  aria-label="Register"
                >
                  Register
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
