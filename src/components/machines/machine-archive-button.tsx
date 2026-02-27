"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Archive } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/feedback/confirm-dialog"
import { actionArchiveMachine } from "@/server/actions/machines/action-archive-machine"
import { toast } from "sonner"

export function MachineArchiveButton({ machineId, machineName }: { machineId: string; machineName: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    const result = await actionArchiveMachine({ machineId })
    setLoading(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success("Machine archivée")
    setOpen(false)
    router.push("/machines")
    router.refresh()
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} disabled={loading}>
        <Archive className="w-4 h-4 mr-1" />
        Archiver
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Archiver "${machineName}" ?`}
        description="La machine sera marquée comme déclassée. Elle restera visible dans l'historique mais ne pourra plus recevoir de nouvelles interventions. Cette action est irréversible."
        confirmLabel="Archiver la machine"
        onConfirm={handleConfirm}
      />
    </>
  )
}
