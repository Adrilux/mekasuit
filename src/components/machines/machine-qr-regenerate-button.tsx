"use client"

import { useState } from "react"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/feedback/confirm-dialog"
import { actionRegenerateQrSlug } from "@/server/actions/machines/action-regenerate-qr-slug"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function MachineQrRegenerateButton({ machineId }: { machineId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    const result = await actionRegenerateQrSlug({ machineId })
    setLoading(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success("QR code régénéré — l'ancien lien ne fonctionnera plus")
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900" onClick={() => setOpen(true)} disabled={loading}>
        <RefreshCw className="w-3.5 h-3.5 mr-1" />
        Régénérer
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Régénérer le QR code ?"
        description="Un nouveau lien unique sera créé. L'ancien QR code imprimé ne pointera plus vers cette machine. Assurez-vous de réimprimer et remplacer les étiquettes."
        confirmLabel="Régénérer"
        onConfirm={handleConfirm}
      />
    </>
  )
}
