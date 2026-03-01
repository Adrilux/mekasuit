"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/feedback/confirm-dialog"
import { actionRestoreMachine } from "@/server/actions/machines/action-restore-machine"
import { toast } from "sonner"

export function MachineRestoreButton({ machineId, machineName }: { machineId: string; machineName: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    const result = await actionRestoreMachine({ machineId })
    setLoading(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success("Machine restaurée")
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} disabled={loading}>
        <RotateCcw className="w-4 h-4 mr-1" />
        Restaurer
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Restaurer "${machineName}" ?`}
        description="La machine sera remise en statut Opérationnelle. Elle pourra de nouveau recevoir de nouvelles interventions."
        confirmLabel="Restaurer la machine"
        onConfirm={handleConfirm}
      />
    </>
  )
}
