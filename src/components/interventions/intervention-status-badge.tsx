import { Badge } from "@/components/ui/badge"
import type { InterventionStatus } from "@prisma/client"
import { cn } from "@/lib/utils"

const STATUS_CONFIG: Record<InterventionStatus, { label: string; className: string }> = {
  OPEN: { label: "Ouverte", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  IN_PROGRESS: { label: "En cours", className: "bg-blue-50 text-blue-700 border-blue-200" },
  PENDING_PARTS: { label: "Attente pièce", className: "bg-orange-50 text-orange-700 border-orange-200" },
  CLOSED: { label: "Clôturée", className: "bg-green-50 text-green-700 border-green-200" },
  CANCELLED: { label: "Annulée", className: "bg-slate-100 text-slate-500 border-slate-200" },
}

export function InterventionStatusBadge({ status }: { status: InterventionStatus }) {
  const config = STATUS_CONFIG[status]
  return (
    <Badge variant="outline" className={cn("text-xs", config.className)}>
      {config.label}
    </Badge>
  )
}
