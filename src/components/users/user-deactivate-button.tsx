"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/feedback/confirm-dialog"
import { actionDeactivateUser } from "@/server/actions/users/action-deactivate-user"
import { toast } from "sonner"

export function UserDeactivateButton({ tenantUserId }: { tenantUserId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    const result = await actionDeactivateUser({ tenantUserId })
    setLoading(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success("Utilisateur désactivé")
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} disabled={loading}
        className="text-red-600 border-red-200 hover:bg-red-50 text-xs">
        Désactiver
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Désactiver cet utilisateur ?"
        description="L'utilisateur ne pourra plus se connecter. Les données associées (interventions, notes) sont conservées. Cette action peut être annulée en réactivant le compte."
        confirmLabel="Désactiver"
        onConfirm={handleConfirm}
      />
    </>
  )
}
