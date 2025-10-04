import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function KpiCards({
  total,
  activePending,
  highPriority,
  followUp,
}: { total: number; activePending: number; highPriority: number; followUp: number }) {
  const items = [
    { title: "Total Emergencies", value: total, color: "var(--color-chart-1)" },
    { title: "Active / Pending", value: activePending, color: "var(--color-chart-2)" },
    { title: "High Priority", value: highPriority, color: "var(--color-chart-4)" },
    { title: "Follow-up Needed", value: followUp, color: "var(--color-chart-3)" },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4" id="home">
      {items.map((i) => (
        <Card key={i.title}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{i.title}</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold" style={{ color: i.color }}>
            {i.value}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
