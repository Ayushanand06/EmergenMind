"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Legend,
} from "recharts"
import type { Incident } from "@/lib/types"
import { getUnitsUtilization } from "@/lib/client-store"

const COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
]

function byType(incidents: Incident[]) {
  const map = { fire: 0, medical: 0, other: 0 } as Record<"fire" | "medical" | "other", number>
  incidents.forEach((i) => (map[i.type] += 1))
  return [
    { name: "Fire", value: map.fire },
    { name: "Medical", value: map.medical },
    { name: "Other", value: map.other },
  ]
}

function bySeverity(incidents: Incident[]) {
  const bins = [1, 2, 3, 4, 5].map((s) => ({ severity: s, count: 0 }))
  incidents.forEach((i) => (bins[i.severity - 1].count += 1))
  return bins
}

function byUrgency(incidents: Incident[]) {
  const urgencies = ["Immediate", "High", "Low", "Non-urgent"]
  const map = new Map<string, Record<string, number>>()

  incidents.forEach((i) => {
    const type = i.type || "Other"
    const urgency =
      urgencies.find((u) => u.toLowerCase() === i.urgency.toLowerCase()) || "Non-urgent"

    if (!map.has(type)) map.set(type, { Immediate: 0, High: 0, Low: 0, "Non-urgent": 0 })
    map.get(type)![urgency] += 1
  })

  return Array.from(map.entries()).map(([type, data]) => ({ type, ...data }))
}

export function AnalyticsTabs({
  incidents,
  util: utilProp,
}: {
  incidents: Incident[]
  util?: {
    ambulance: { used: number; free: number; total: number }
    police: { used: number; free: number; total: number }
    firefighter: { used: number; free: number; total: number }
  }
}) {
  const typeData = byType(incidents)
  const severityData = bySeverity(incidents)
  const urgencyData = byUrgency(incidents)

  // Use live data if utilProp is all zeros or missing
  const util =
    utilProp && Object.values(utilProp).some((u) => u.used > 0)
      ? utilProp
      : getUnitsUtilization()

  const unitChartData = [
    {
      type: "Ambulance",
      Used: Number(util.ambulance.used || 0),
      Free: Number(util.ambulance.free ?? util.ambulance.total - util.ambulance.used),
    },
    {
      type: "Police",
      Used: Number(util.police.used || 0),
      Free: Number(util.police.free ?? util.police.total - util.police.used),
    },
    {
      type: "Firefighter",
      Used: Number(util.firefighter.used || 0),
      Free: Number(util.firefighter.free ?? util.firefighter.total - util.firefighter.used),
    },
  ]

  // Debug to verify values
  console.log("Unit Chart Data:", unitChartData)

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2" id="analytics">
      {/* Distribution by Type */}
      <Card>
        <CardHeader>
          <CardTitle>Distribution by Type</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={typeData}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
                label
                stroke="transparent"
              >
                {typeData.map((_, idx) => (
                  <Cell key={`c-${idx}`} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Incidents per Severity */}
      <Card>
        <CardHeader>
          <CardTitle>Incidents per Severity</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer>
            <BarChart data={severityData}>
              <XAxis dataKey="severity" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="var(--color-chart-4)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Urgency by Type (Stacked) */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Urgency by Type (Stacked)</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer>
            <BarChart data={urgencyData}>
              <XAxis dataKey="type" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Immediate" stackId="a" fill="var(--color-chart-1)" />
              <Bar dataKey="High" stackId="a" fill="var(--color-chart-2)" />
              <Bar dataKey="Low" stackId="a" fill="var(--color-chart-3)" />
              <Bar dataKey="Non-urgent" stackId="a" fill="var(--color-chart-5)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Units Utilization (Used vs Free) */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Units Utilization (Used vs Free)</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer>
            <BarChart data={unitChartData}>
              <XAxis dataKey="type" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Used" stackId="a" fill="var(--color-chart-2)" />
              <Bar dataKey="Free" stackId="a" fill="var(--color-chart-3)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
