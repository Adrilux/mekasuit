"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/feedback/confirm-dialog"
import { actionDeleteStockItem } from "@/server/actions/stock/action-delete-stock-item"
import { toast } from "sonner"

export function StockDeleteButton({ stockItemId, itemName }: { stockItemId: string; itemName: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    const result = await actionDeleteStockItem({ stockItemId })
    setLoading(false)

    if (!result.success) {
      toast.error(result.error)
      setOpen(false)
      return
    }

    toast.success("Article supprimé")
    router.push("/stock")
    router.refresh()
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}
        className="text-red-600 border-red-200 hover:bg-red-50">
        <Trash2 className="w-4 h-4 mr-1" />
        Supprimer
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Supprimer cet article ?"
        description={`L'article "${itemName}" sera définitivement supprimé. Cette action est irréversible.`}
        confirmLabel="Supprimer"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  )
}
