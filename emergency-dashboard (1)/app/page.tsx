"use client"

import useSWR from "swr"
import { useMemo, useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { KpiCards } from "@/components/dashboard/kpi-cards"
import { SideNav } from "@/components/sidebar/side-nav"
import { TopNav } from "@/components/nav/top-nav"
import { IncidentCard } from "@/components/emergencies/incident-card"
import { IncidentTable } from "@/components/emergencies/incident-table"
import { AnalyticsTabs } from "@/components/analytics/analytics-tabs"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { LayoutGrid, Table } from "lucide-react"
import type { Incident } from "@/lib/types"
import {
  assignUnitToIncident,
  getIncidentAssignment,
  getIncidentStatus,
  markIncidentResolved,
  getCurrentUser,
  loginUser,
  registerUser,
} from "@/lib/client-store"
import type { UnitType } from "@/lib/units"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { Input } from "@/components/ui/input" // Import Input component

export default function Page() {
  const { toast } = useToast()
  const { data, isLoading, mutate } = useSWR<{ incidents: Incident[] }>("/api/emergencies/all", (u) =>
    fetch(u, { cache: "no-store" }).then((r) => r.json()),
  )
  const [view, setView] = useState<"grid" | "table">("grid")
  const [search, setSearch] = useState("")
  const [storeTick, setStoreTick] = useState(0)
  const [user, setUser] = useState<{ email: string } | null>(null)

  useEffect(() => {
    setUser(getCurrentUser())
  }, [storeTick])

  useEffect(() => {
    const onBump = () => {
      console.log("[v0] store-updated event received")
      setStoreTick((n) => n + 1)
    }
    window.addEventListener("erd:store-updated", onBump)

    const onRefresh = () => {
      console.log("[v0] erd:refresh received -> mutate")
      mutate()
    }
    window.addEventListener("erd:refresh", onRefresh)
    return () => {
      window.removeEventListener("erd:store-updated", onBump)
      window.removeEventListener("erd:refresh", onRefresh)
    }
  }, [])

  const incidents = data?.incidents ?? []

  const statusById = useMemo(() => {
    const map: Record<string, "pending" | "processing" | "resolved"> = {}
    for (const i of incidents) {
      map[i.id] = getIncidentStatus(i.id)
    }
    return map
  }, [incidents, storeTick])

  const unitById = useMemo(() => {
    const map: Record<string, string | undefined> = {}
    for (const i of incidents) {
      const a = getIncidentAssignment(i.id)
      map[i.id] = a?.unitId
    }
    return map
  }, [incidents, storeTick])

  const stats = useMemo(() => {
    const withOverlay = incidents.map((i) => ({ ...i, status: statusById[i.id] ?? i.status }))
    const total = withOverlay.length
    const activePending = withOverlay.filter((i) => i.status !== "resolved").length
    const highPriority = withOverlay.filter((i) => i.priority >= 80).length
    const followUp = withOverlay.filter((i) => i.status === "pending").length
    return { total, activePending, highPriority, followUp }
  }, [incidents, statusById])

  const utilFromAssignments = useMemo(() => {
    const total = { ambulance: 10, police: 10, firefighter: 10 }
    const used = { ambulance: 0, police: 0, firefighter: 0 }
    for (const id in unitById) {
      const unit = unitById[id]
      if (!unit) continue
      if (unit.startsWith("Ambulance")) used.ambulance += 1
      else if (unit.startsWith("Police")) used.police += 1
      else if (unit.startsWith("Firefighter")) used.firefighter += 1
    }
    return {
      ambulance: { used: used.ambulance, free: total.ambulance - used.ambulance, total: total.ambulance },
      police: { used: used.police, free: total.police - used.police, total: total.police },
      firefighter: {
        used: used.firefighter,
        free: total.firefighter - used.firefighter,
        total: total.firefighter,
      },
    }
  }, [unitById])

  const filtered = useMemo(() => {
    if (!search.trim()) return incidents
    const q = search.toLowerCase()
    return incidents.filter((i) => {
      return (
        i.id.toLowerCase().includes(q) ||
        i.type.toLowerCase().includes(q) ||
        i.address.toLowerCase().includes(q) ||
        i.summary.toLowerCase().includes(q)
      )
    })
  }, [incidents, search])

  const sidebar = <SideNav />

  function mapType(t: Incident["type"]): UnitType {
    if (t === "medical") return "ambulance"
    if (t === "fire") return "firefighter"
    return "police"
  }

  function handleAssign(id: string, type: UnitType) {
    const res = assignUnitToIncident(id, type)
    if (res.ok) {
      toast({ title: "Unit assigned", description: `${id} → ${res.unitId}` })
      setStoreTick((n) => n + 1)
    } else {
      toast({ variant: "destructive", title: "Assignment failed", description: res.message })
    }
  }

  function handleResolve(id: string) {
    const res = markIncidentResolved(id)
    if (res.ok) {
      toast({ title: "Incident resolved", description: id })
      setStoreTick((n) => n + 1)
    } else {
      toast({ variant: "destructive", title: "Resolve failed", description: res.message })
    }
  }

  if (!user) {
    return (
      <div className="min-h-[100dvh] flex flex-col">
        <TopNav
          onRefresh={() => {
            console.log("[v0] Refresh clicked (logged-out)")
            mutate()
          }}
          sidebar={sidebar}
          onSearch={(q) => setSearch(q)}
          onLogout={() => setUser(null)}
        />
        <main className="mx-auto w-full max-w-screen-xl flex-1 px-4 py-10">
          <section className="grid grid-cols-1 gap-8 rounded-lg border bg-card p-8 md:grid-cols-2">
            <div>
              <h1 className="text-3xl font-semibold text-balance">Coordinate Faster Emergency Response</h1>
              <p className="mt-3 text-muted-foreground">
                Register as an incident handler to access live incidents, assign units, and resolve cases with a
                streamlined, professional interface.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/register">
                  <Button className="bg-[color:var(--color-primary)] text-[color:var(--color-primary-foreground)]">
                    Create account
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline">Login</Button>
                </Link>
              </div>
              <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
                <li className="rounded-md border p-3">• Prioritize by severity and urgency</li>
                <li className="rounded-md border p-3">• Assign Ambulance, Firefighter, Police units</li>
                <li className="rounded-md border p-3">• Track status: Pending → Processing → Resolved</li>
                <li className="rounded-md border p-3">• Colorful analytics and utilization charts</li>
              </ul>
            </div>
            <div className="flex items-center justify-center">
              {/* illustrative images */}
              <img
                src="/emergency-control-room-dashboard-monitor.jpg"
                alt="Emergency control room"
                className="h-auto w-full rounded-lg border object-cover"
              />
            </div>
          </section>

          <section className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card className="p-6">
              <h3 className="text-lg font-semibold">Login</h3>
              <LoginForm
                onSuccess={() => {
                  console.log("[v0] Login success")
                  setUser(getCurrentUser())
                }}
              />
            </Card>
            <Card className="p-6">
              <h3 className="text-lg font-semibold">Register</h3>
              <RegisterForm
                onSuccess={() => {
                  console.log("[v0] Register success")
                  setUser(getCurrentUser())
                }}
              />
            </Card>
          </section>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh]">
      <TopNav
        onRefresh={() => mutate()}
        sidebar={sidebar}
        onSearch={(q) => setSearch(q)}
        onLogout={() => {
          setUser(null)
        }}
      />

      <div className="mx-auto flex max-w-screen-2xl gap-4 px-4">
        <div className="hidden md:block">{sidebar}</div>

        <main className="flex-1 space-y-6 pb-10">
          <section id="home">
            <KpiCards
              total={stats.total}
              activePending={stats.activePending}
              highPriority={stats.highPriority}
              followUp={stats.followUp}
            />
          </section>

          <section id="all" className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Emergency Incidents</h2>
              <div className="flex items-center gap-2">
                <Button
                  variant={view === "grid" ? "default" : "outline"}
                  onClick={() => setView("grid")}
                  aria-pressed={view === "grid"}
                >
                  <LayoutGrid className="mr-2 size-4" />
                  Cards
                </Button>
                <Button
                  variant={view === "table" ? "default" : "outline"}
                  onClick={() => setView("table")}
                  aria-pressed={view === "table"}
                >
                  <Table className="mr-2 size-4" />
                  Table
                </Button>
              </div>
            </div>

            <Card className={cn("p-4", isLoading && "opacity-70")}>
              {view === "grid" ? (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {filtered.map((i) => (
                    <IncidentCard
                      key={i.id}
                      incident={i}
                      statusOverride={statusById[i.id]}
                      assignedUnitId={unitById[i.id]}
                      onAssign={() => handleAssign(i.id, mapType(i.type))}
                      onResolve={() => handleResolve(i.id)}
                      isResolved={statusById[i.id] === "resolved"}
                    />
                  ))}
                </div>
              ) : (
                <IncidentTable
                  incidents={filtered}
                  statusById={statusById}
                  unitById={unitById}
                  onAssign={(id) => {
                    const i = incidents.find((x) => x.id === id)
                    if (!i) return
                    handleAssign(id, mapType(i.type))
                  }}
                  onResolve={(id) => handleResolve(id)}
                />
              )}
              {!filtered.length && !isLoading ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No incidents to display.</p>
              ) : null}
            </Card>
          </section>

          <section id="analytics">
            <h2 className="mb-3 text-lg font-semibold">Analytics</h2>
            <AnalyticsTabs incidents={filtered} util={utilFromAssignments} />
          </section>

          <section id="assigned" className="space-y-3">
            <h2 className="text-lg font-semibold">Assigned Units</h2>
            <Card className="p-4">
              {(() => {
                const processing = incidents.filter((i) => statusById[i.id] === "processing")
                return processing.length ? (
                  <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {processing.map((i) => (
                      <li key={i.id} className="flex items-center justify-between rounded-md border p-3">
                        <span className="text-sm">
                          <span className="font-medium">{i.id}</span> — {i.type} at {i.address}
                        </span>
                        <span className="text-sm">Unit: {unitById[i.id] ?? "—"}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No units currently assigned. Use Assign Units from incident actions.
                  </p>
                )
              })()}

              <p className="mt-3 text-sm">
                Free now — Ambulance: {utilFromAssignments.ambulance.free} • Firefighter:{" "}
                {utilFromAssignments.firefighter.free} • Police: {utilFromAssignments.police.free}
              </p>
            </Card>
          </section>
        </main>
      </div>
    </div>
  )
}

// Inline LoginForm component
function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        console.log("[v0] Attempt login:", email)
        const res = loginUser(email, password)
        if (res.ok) {
          toast({ title: "Logged in", description: email })
          onSuccess()
        } else {
          toast({ variant: "destructive", title: "Login failed", description: res.message })
        }
      }}
    >
      <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
      <Button type="submit" className="w-full">
        Login
      </Button>
    </form>
  )
}

// Inline RegisterForm component
function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        console.log("[v0] Attempt register:", email)
        const res = registerUser(email, password)
        if (res.ok) {
          toast({ title: "Registered", description: email })
          onSuccess()
        } else {
          toast({ variant: "destructive", title: "Register failed", description: res.message })
        }
      }}
    >
      <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Input
        type="password"
        placeholder="Create a password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button
        type="submit"
        className="w-full bg-[color:var(--color-accent)] text-[color:var(--color-accent-foreground)] hover:opacity-90"
      >
        Create account
      </Button>
    </form>
  )
}
