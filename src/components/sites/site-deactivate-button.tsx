"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/feedback/confirm-dialog"
import { actionDeactivateSite } from "@/server/actions/sites/action-deactivate-site"
import { toast } from "sonner"

export function SiteDeactivateButton({ siteId, siteName }: { siteId: string; siteName: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    const result = await actionDeactivateSite({ siteId })
    setLoading(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success("Site désactivé")
    setOpen(false)
    router.push("/sites")
    router.refresh()
  }

  return (
    <>
      <Button variant="destructive" size="sm" onClick={() => setOpen(true)} disabled={loading}>
        Désactiver ce site
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Désactiver "${siteName}" ?`}
        description="Ce site sera désactivé. Les techniciens ne pourront plus y créer de nouvelles interventions. Les données existantes sont conservées. Cette action est irréversible."
        confirmLabel="Désactiver le site"
        onConfirm={handleConfirm}
      />
    </>
  )
}
