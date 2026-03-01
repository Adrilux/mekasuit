"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Archive } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/feedback/confirm-dialog"
import { actionArchiveMachine } from "@/server/actions/machines/action-archive-machine"
import { toast } from "sonner"

type Props = {
  machineId: string
  machineName: string
  /** Si true : refresh seulement (mode liste). Si false : redirect vers /machines (mode détail). */
  inline?: boolean
  /** Afficher le label texte à côté de l'icône */
  showLabel?: boolean
}

export function MachineArchiveButton({ machineId, machineName, inline = false, showLabel = false }: Props) {
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
    if (inline) {
      router.refresh()
    } else {
      router.push("/machines")
      router.refresh()
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" className={showLabel ? "" : "text-slate-500 hover:text-red-600 px-2"} onClick={() => setOpen(true)} disabled={loading}>
        <Archive className="w-4 h-4" />
        {showLabel && <span className="ml-1">Archiver</span>}
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Archiver "${machineName}" ?`}
        description="La machine sera marquée comme déclassée. Elle restera visible dans l'historique mais ne pourra plus recevoir de nouvelles interventions."
        confirmLabel="Archiver la machine"
        onConfirm={handleConfirm}
      />
    </>
  )
}
