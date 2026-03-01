"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Wrench, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { actionUpdateMachineStatus } from "@/server/actions/machines/action-update-machine-status"
import { toast } from "sonner"
import type { MachineStatus } from "@prisma/client"

type Props = {
  machineId: string
  currentStatus: MachineStatus
}

export function MachineStatusButton({ machineId, currentStatus }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const isUnderMaintenance = currentStatus === "UNDER_MAINTENANCE"
  const targetStatus = isUnderMaintenance ? "OPERATIONAL" : "UNDER_MAINTENANCE"
  const label = isUnderMaintenance ? "Marquer opérationnelle" : "Mettre en maintenance"
  const Icon = isUnderMaintenance ? CheckCircle2 : Wrench

  async function handleClick() {
    setLoading(true)
    const result = await actionUpdateMachineStatus({ machineId, status: targetStatus })
    setLoading(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success(isUnderMaintenance ? "Machine remise en service" : "Machine mise en maintenance")
    router.refresh()
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={loading}>
      <Icon className="w-4 h-4 mr-1" />
      {loading ? "…" : label}
    </Button>
  )
}
