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
  AreaChart,
  Area,
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

function trendOverTime(incidents: Incident[]) {
  // Group by hour label
  const map = new Map<string, number>()
  incidents.forEach((i) => {
    const d = new Date(i.timestamp)
    const label = `${d.getHours()}:00`
    map.set(label, (map.get(label) ?? 0) + 1)
  })
  return Array.from(map.entries()).map(([time, count]) => ({ time, count }))
}

function byUrgency(incidents: Incident[]) {
  const keys: Incident["urgency"][] = ["Immediate", "High", "Low", "Non-urgent"]
  const map = new Map<string, Record<string, number>>()
  incidents.forEach((i) => {
    const key = i.type
    if (!map.has(key)) map.set(key, { Immediate: 0, High: 0, Low: 0, "Non-urgent": 0 })
    map.get(key)![i.urgency] += 1
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
  const trendData = trendOverTime(incidents)
  const urgencyData = byUrgency(incidents)

  const util = utilProp ?? getUnitsUtilization()
  const unitChartData = [
    { type: "Ambulance", Used: util.ambulance.used, Free: util.ambulance.free },
    { type: "Police", Used: util.police.used, Free: util.police.free },
    { type: "Firefighter", Used: util.firefighter.used, Free: util.firefighter.free },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2" id="analytics">
      <Card>
        <CardHeader>
          <CardTitle>Distribution by Type</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={typeData} dataKey="value" nameKey="name" outerRadius={90} label stroke="transparent">
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

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Trend Over Time</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer>
            <AreaChart data={trendData}>
              <XAxis dataKey="time" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Area dataKey="count" stroke="var(--color-chart-2)" fill="var(--color-chart-2)" fillOpacity={0.25} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

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
