"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { UnitType } from "@/lib/units"

type Props = {
  defaultType?: UnitType
  onAssign: (type: UnitType) => void
  busy?: boolean
}

export function UnitPicker({ defaultType = "ambulance", onAssign, busy }: Props) {
  const [type, setType] = useState<UnitType>(defaultType)
  return (
    <div className="flex items-center gap-2">
      <Select value={type} onValueChange={(v) => setType(v as UnitType)}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Select unit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ambulance">Ambulance</SelectItem>
          <SelectItem value="firefighter">Firefighter</SelectItem>
          <SelectItem value="police">Police</SelectItem>
        </SelectContent>
      </Select>
      <Button variant="default" onClick={() => onAssign(type)} disabled={busy}>
        Assign
      </Button>
    </div>
  )
}
