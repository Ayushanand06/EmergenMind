import { NextResponse } from "next/server"
import type { Incident } from "@/lib/types"

// Helper to format ISO timestamp
function minutesAgoFromISO(iso: string) {
  const now = new Date()
  const then = new Date(iso)
  const diffMs = now.getTime() - then.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  return diffMins
}

export async function GET() {
  try {
    const res = await fetch("https://870ab47a08e1.ngrok-free.app/emergencies/all")
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch data" }, { status: res.status })
    }

    const data = await res.json()

    // The array is under data.emergencies
    const rawEmergencies = data.emergencies || []

    // Map to your Incident type
    const incidents: Incident[] = rawEmergencies.map((item: any) => ({
      id: item.id,
      type: item.analysis.emergency_type || "other",
      priority: item.priority_score || 0,
      severity: item.analysis.severity_level || 1,
      urgency: item.analysis.urgency || "Low",
      address: item.analysis.location?.address || "Unknown",
      timestamp: item.timestamp,
      summary: item.analysis.summary || "",
      victimsCount: item.analysis.people_involved?.victims || 0,
      transcription: item.raw_transcription || "",
      analysis: {
        location: item.analysis.location?.address || "Unknown",
        victims: item.analysis.people_involved?.victims || 0,
        injuries: item.analysis.medical_info?.injuries || [],
        resourcesNeeded: Object.keys(item.analysis.resources_needed || {}).filter(
          (key) => item.analysis.resources_needed[key] === true
        ),
      },
      status: item.status || "pending",
    }))

    return NextResponse.json({ incidents })
  } catch (err) {
    console.error("Error fetching incidents:", err)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
