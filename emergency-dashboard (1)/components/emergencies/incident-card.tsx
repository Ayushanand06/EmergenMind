"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Incident } from "@/lib/types"
import { Clock, MapPin, Users } from "lucide-react"
import Image from "next/image"
import { IncidentDetailDialog } from "./incident-detail-dialog"
import { useToast } from "@/hooks/use-toast"

function typeAccentVars(type: Incident["type"]) {
  // Map types to semantic tokens (no raw colors)
  switch (type) {
    case "fire":
      return { bg: "var(--color-destructive)", fg: "var(--color-destructive-foreground)" }
    case "medical":
      return { bg: "var(--color-chart-2)", fg: "var(--color-primary-foreground)" }
    default:
      return { bg: "var(--color-muted-foreground)", fg: "var(--color-card)" }
  }
}

export function IncidentCard({
  incident,
  onAssign,
  onResolve,
  isResolved = false,
  statusOverride,
  assignedUnitId,
}: {
  incident: Incident
  onAssign?: (id: string) => void // simplify API: parent controls unit-type mapping and store
  onResolve?: (id: string) => void
  isResolved?: boolean
  statusOverride?: "pending" | "processing" | "resolved"
  assignedUnitId?: string
}) {
  const accent = typeAccentVars(incident.type)
  const { toast } = useToast()

  const timeAgo = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" })
  const mins = Math.round((Date.now() - new Date(incident.timestamp).getTime()) / 60000)

  const effectiveStatus = statusOverride ?? incident.status

  return (
    <Card
      style={{ borderLeftColor: accent.bg }}
      className="overflow-hidden border-l-4"
      id={incident.type === "fire" ? "cat-fire" : incident.type === "medical" ? "cat-medical" : "cat-other"}
    >
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">
          {incident.type === "fire" ? "🔥 Fire" : incident.type === "medical" ? "🏥 Medical" : "🟢 Other"} Emergency —
          Priority {incident.priority}
        </CardTitle>
        <div className="flex items-center gap-2">
          {assignedUnitId ? <Badge variant="outline">Assigned: {assignedUnitId}</Badge> : null}
          <Badge style={{ backgroundColor: accent.bg, color: accent.fg }}>Severity {incident.severity}</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-[96px_1fr]">
        <div className="relative h-24 w-full overflow-hidden rounded-md md:h-full">
          <Image
            src={`/placeholder.svg?height=120&width=160&query=incident thumbnail image`}
            alt="Caller/location thumbnail"
            fill
            className="object-cover"
            priority={false}
          />
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-4" />
              {incident.address}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-4" />
              {timeAgo.format(-mins, "minute")}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="size-4" />
              Victims: {incident.victimsCount}
            </span>
          </div>
          <p className="text-sm leading-relaxed">{incident.summary}</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Urgency: {incident.urgency}</Badge>
            <Badge variant={effectiveStatus === "resolved" ? "secondary" : "default"} className="capitalize">
              {effectiveStatus}
            </Badge>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button
          onClick={() => {
            onAssign?.(incident.id)
          }}
          disabled={isResolved || effectiveStatus === "processing" || effectiveStatus === "resolved"}
        >
          {effectiveStatus === "processing" ? "Assigned" : "Assign Units"}
        </Button>
        <IncidentDetailDialog incident={incident} />
        <Button
          variant="secondary"
          onClick={() => {
            onResolve?.(incident.id)
          }}
          disabled={effectiveStatus === "resolved"}
        >
          {effectiveStatus === "resolved" ? "Resolved" : "Mark Resolved"}
        </Button>
        {assignedUnitId ? <span className="ml-auto text-sm text-muted-foreground">Unit: {assignedUnitId}</span> : null}
      </CardFooter>
    </Card>
  )
}
