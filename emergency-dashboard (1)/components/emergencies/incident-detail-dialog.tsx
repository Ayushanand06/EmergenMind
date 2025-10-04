"use client"

import type { Incident } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import {
  assignUnitToIncident,
  getIncidentAssignment,
  getIncidentStatus,
  markIncidentResolved,
  getUnitsUtilization,
} from "@/lib/client-store"
import type { UnitType } from "@/lib/units"

function mapType(t: Incident["type"]): UnitType {
  return t === "medical" ? "ambulance" : t === "fire" ? "firefighter" : "police"
}

export function IncidentDetailDialog({ incident }: { incident: Incident }) {
  const { toast } = useToast()
  const status = getIncidentStatus(incident.id)
  const assignment = getIncidentAssignment(incident.id)
  const util = getUnitsUtilization()
  const freeByType = {
    ambulance: util.ambulance.free,
    firefighter: util.firefighter.free,
    police: util.police.free,
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary">View Details</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {incident.type.toUpperCase()} — {incident.id} (Priority {incident.priority})
          </DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="transcription">
          <TabsList>
            <TabsTrigger value="transcription">Transcription</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="dispatch">Dispatch Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="transcription" className="text-sm leading-relaxed">
            {incident.transcription}
          </TabsContent>

          <TabsContent value="analysis" className="text-sm">
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong>Location:</strong> {incident.analysis.location}
              </li>
              <li>
                <strong>Victims:</strong> {incident.analysis.victims}
              </li>
              <li>
                <strong>Injuries:</strong>{" "}
                {incident.analysis.injuries.length ? incident.analysis.injuries.join(", ") : "None reported"}
              </li>
              <li>
                <strong>Resources Needed:</strong> {incident.analysis.resourcesNeeded.join(", ")}
              </li>
            </ul>
          </TabsContent>

          <TabsContent value="dispatch" className="space-y-3 text-sm">
            <div className="rounded-md border p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="flex items-center gap-2">
                    <strong>Status:</strong>
                    <Badge
                      variant={status === "resolved" ? "default" : status === "processing" ? "secondary" : "outline"}
                      className={status === "resolved" ? "bg-[color:var(--color-chart-2)] text-white" : ""}
                    >
                      <span className="capitalize">{status}</span>
                    </Badge>
                  </p>
                  <p>
                    <strong>Assigned Unit:</strong>{" "}
                    <span className="font-medium text-[color:var(--color-chart-4)]">
                      {assignment?.unitId ?? "None"}
                    </span>
                  </p>
                </div>
                <div className="text-right text-xs sm:text-sm">
                  <p className="font-medium">
                    Free units — Ambulance: {freeByType.ambulance} • Firefighter: {freeByType.firefighter} • Police:{" "}
                    {freeByType.police}
                  </p>
                </div>
              </div>
            </div>

            <p>Recommended Response:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Confirm scene safety and hazards.</li>
              <li>Allocate nearest available units matching resource needs.</li>
              <li>Provide caller with immediate safety guidance if necessary.</li>
            </ul>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                onClick={() => {
                  console.log("[v0] DispatchDialog Assign click:", incident.id)
                  const res = assignUnitToIncident(incident.id, mapType(incident.type))
                  if (res.ok) toast({ title: "Units assigned", description: `${incident.id} → ${res.unitId}` })
                  else toast({ variant: "destructive", title: "Assignment failed", description: res.message })
                }}
                disabled={status === "processing" || status === "resolved"}
                className="transition hover:shadow-md active:scale-[0.98]"
              >
                {status === "processing" ? "Assigned" : "Assign Units"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  console.log("[v0] DispatchDialog Resolve click:", incident.id)
                  const res = markIncidentResolved(incident.id)
                  if (res.ok) toast({ title: "Marked resolved", description: incident.id })
                  else toast({ variant: "destructive", title: "Resolve failed", description: res.message })
                }}
                disabled={status === "resolved"}
                className="transition hover:shadow-md active:scale-[0.98]"
              >
                {status === "resolved" ? "Resolved" : "Mark Resolved"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
