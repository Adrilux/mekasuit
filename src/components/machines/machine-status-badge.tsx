import { Badge } from "@/components/ui/badge"
import type { MachineStatus } from "@prisma/client"

const STATUS_CONFIG: Record<MachineStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  OPERATIONAL: { label: "Opérationnelle", variant: "default" },
  UNDER_MAINTENANCE: { label: "En maintenance", variant: "secondary" },
  DECOMMISSIONED: { label: "Archivée", variant: "outline" },
}

export function MachineStatusBadge({ status }: { status: MachineStatus }) {
  const config = STATUS_CONFIG[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}
