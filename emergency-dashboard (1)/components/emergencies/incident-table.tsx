"use client"

import type { Incident } from "@/lib/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { IncidentDetailDialog } from "./incident-detail-dialog"
import { useToast } from "@/hooks/use-toast"

function typeLabel(t: Incident["type"]) {
  return t === "fire" ? "Fire" : t === "medical" ? "Medical" : "Other"
}

export function IncidentTable({
  incidents,
  onAssign,
  onResolve,
  statusById,
  unitById,
}: {
  incidents: Incident[]
  onAssign?: (id: string) => void // parent maps type→unitType and writes store
  onResolve?: (id: string) => void
  statusById?: Record<string, "pending" | "processing" | "resolved">
  unitById?: Record<string, string | undefined>
}) {
  const { toast } = useToast()

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Urgency</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>When</TableHead>
            <TableHead>Victims</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {incidents.map((i) => {
            const mins = Math.round((Date.now() - new Date(i.timestamp).getTime()) / 60000)
            const status = statusById?.[i.id] ?? i.status
            const unit = unitById?.[i.id]
            const isResolved = status === "resolved"
            return (
              <TableRow key={i.id} className={isResolved ? "opacity-60" : undefined}>
                <TableCell>{i.id}</TableCell>
                <TableCell className="capitalize">{typeLabel(i.type)}</TableCell>
                <TableCell>{i.priority}</TableCell>
                <TableCell>{i.severity}</TableCell>
                <TableCell>{i.urgency}</TableCell>
                <TableCell>{i.address}</TableCell>
                <TableCell>{mins} min ago</TableCell>
                <TableCell>{i.victimsCount}</TableCell>
                <TableCell className="capitalize">{status}</TableCell>
                <TableCell>{unit ?? "-"}</TableCell>
                <TableCell className="flex justify-end gap-2">
                  <Button size="sm" onClick={() => onAssign?.(i.id)} disabled={isResolved || status === "processing"}>
                    {status === "processing" ? "Assigned" : "Assign"}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => onResolve?.(i.id)} disabled={isResolved}>
                    {isResolved ? "Resolved" : "Resolve"}
                  </Button>
                  <IncidentDetailDialog incident={i} />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
