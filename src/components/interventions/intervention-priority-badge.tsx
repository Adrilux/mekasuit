import { Badge } from "@/components/ui/badge"
import type { InterventionPriority } from "@prisma/client"
import { cn } from "@/lib/utils"

const PRIORITY_CONFIG: Record<InterventionPriority, { label: string; className: string }> = {
  LOW: { label: "Basse", className: "bg-slate-100 text-slate-600 border-slate-200" },
  MEDIUM: { label: "Normale", className: "bg-blue-50 text-blue-700 border-blue-200" },
  HIGH: { label: "Urgente", className: "bg-orange-50 text-orange-700 border-orange-200" },
  CRITICAL: { label: "Critique", className: "bg-red-50 text-red-700 border-red-200 font-semibold" },
}

export function InterventionPriorityBadge({ priority }: { priority: InterventionPriority }) {
  const config = PRIORITY_CONFIG[priority]
  return (
    <Badge variant="outline" className={cn("text-xs", config.className)}>
      {config.label}
    </Badge>
  )
}
