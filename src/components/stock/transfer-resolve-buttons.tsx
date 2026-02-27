"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { actionResolveStockTransfer } from "@/server/actions/stock/action-resolve-stock-transfer"
import { toast } from "sonner"

type Props = {
  transferId: string
}

export function TransferResolveButtons({ transferId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleAction(action: "APPROVE" | "REJECT") {
    startTransition(async () => {
      const res = await actionResolveStockTransfer({ transferId, action })
      if (!res.success) {
        toast.error(res.error)
        return
      }
      toast.success(action === "APPROVE" ? "Transfert approuvé et stock mis à jour" : "Transfert refusé")
      router.push("/stock/transfers")
      router.refresh()
    })
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <p className="text-sm font-medium text-amber-800 mb-3">Cette demande attend votre validation</p>
      <div className="flex gap-3">
        <Button
          onClick={() => handleAction("APPROVE")}
          disabled={isPending}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
          Approuver le transfert
        </Button>
        <Button
          variant="outline"
          onClick={() => handleAction("REJECT")}
          disabled={isPending}
          className="border-red-300 text-red-600 hover:bg-red-50"
        >
          <X className="w-4 h-4 mr-2" />
          Refuser
        </Button>
      </div>
    </div>
  )
}
