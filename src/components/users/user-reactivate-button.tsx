"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/feedback/confirm-dialog"
import { actionReactivateUser } from "@/server/actions/users/action-reactivate-user"
import { toast } from "sonner"

export function UserReactivateButton({ tenantUserId }: { tenantUserId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    const result = await actionReactivateUser({ tenantUserId })
    setLoading(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success("Utilisateur réactivé")
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} disabled={loading}
        className="text-green-700 border-green-200 hover:bg-green-50 text-xs">
        Réactiver
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Réactiver cet utilisateur ?"
        description="L'utilisateur pourra à nouveau se connecter et accéder à l'application."
        confirmLabel="Réactiver"
        onConfirm={handleConfirm}
      />
    </>
  )
}
