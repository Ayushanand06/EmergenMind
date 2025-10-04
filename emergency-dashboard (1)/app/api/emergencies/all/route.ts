import { NextResponse } from "next/server"
import type { Incident } from "@/lib/types"

function minutesAgo(mins: number) {
  const d = new Date(Date.now() - mins * 60_000)
  return d.toISOString()
}

export async function GET() {
  const incidents: Incident[] = [
    {
      id: "INC-1001",
      type: "fire",
      priority: 100,
      severity: 5,
      urgency: "Immediate",
      address: "123 Main Street",
      timestamp: minutesAgo(5),
      summary: "Kitchen engulfed, caller trapped, neighbor unconscious",
      victimsCount: 2,
      transcription:
        "Caller reports heavy smoke and flames in the kitchen, one person is trapped in a bedroom, neighbor collapsed from smoke.",
      analysis: {
        location: "Residential, single-family home",
        victims: 2,
        injuries: ["Smoke inhalation", "Burn risk"],
        resourcesNeeded: ["Fire engine x2", "Ladder truck", "Ambulance x2"],
      },
      status: "active",
    },
    {
      id: "INC-1002",
      type: "medical",
      priority: 82,
      severity: 4,
      urgency: "High",
      address: "45 Oak Avenue",
      timestamp: minutesAgo(18),
      summary: "Elderly patient with chest pain, shortness of breath",
      victimsCount: 1,
      transcription: "Patient reports acute chest pain radiating to left arm, shortness of breath, pale and sweating.",
      analysis: {
        location: "Residential apartment",
        victims: 1,
        injuries: ["Possible cardiac event"],
        resourcesNeeded: ["Ambulance", "Cardiac monitor", "ALS crew"],
      },
      status: "active",
    },
    {
      id: "INC-1003",
      type: "other",
      priority: 60,
      severity: 2,
      urgency: "Low",
      address: "Industrial Park, Bldg 7",
      timestamp: minutesAgo(29),
      summary: "Minor chemical spill in warehouse, no injuries",
      victimsCount: 0,
      transcription: "Small spill contained within pallet area, ventilation active, no reported exposures.",
      analysis: {
        location: "Warehouse",
        victims: 0,
        injuries: [],
        resourcesNeeded: ["Hazmat technician assessment"],
      },
      status: "pending",
    },
    {
      id: "INC-1004",
      type: "medical",
      priority: 45,
      severity: 2,
      urgency: "Non-urgent",
      address: "200 Elm Street",
      timestamp: minutesAgo(55),
      summary: "Minor laceration, bleeding controlled",
      victimsCount: 1,
      transcription: "Cut from kitchen knife, bleeding controlled, patient stable and alert.",
      analysis: {
        location: "Residential home",
        victims: 1,
        injuries: ["Minor laceration"],
        resourcesNeeded: ["Basic first aid"],
      },
      status: "pending",
    },
    {
      id: "INC-1005",
      type: "fire",
      priority: 74,
      severity: 3,
      urgency: "High",
      address: "Pine Ridge Trailhead",
      timestamp: minutesAgo(90),
      summary: "Brush fire reported near trail, spreading slowly",
      victimsCount: 0,
      transcription: "Approximately quarter-acre brush fire, light winds, no structures threatened yet.",
      analysis: {
        location: "Outdoor, brush area",
        victims: 0,
        injuries: [],
        resourcesNeeded: ["Brush engine", "Water tender", "Hand crew"],
      },
      status: "active",
    },
  ]

  return NextResponse.json({ incidents })
}
