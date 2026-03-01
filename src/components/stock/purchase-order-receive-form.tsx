"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { PackageCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { actionReceivePurchaseOrderItems } from "@/server/actions/stock/action-receive-purchase-order-items"
import type { PurchaseOrderDetail } from "@/server/queries/stock/query-get-purchase-order-by-id"

type Props = {
  order: Pick<PurchaseOrderDetail, "id" | "items">
}

export function PurchaseOrderReceiveForm({ order }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const receivableItems = order.items.filter(
    (i) => i.quantityReceived < i.quantityOrdered,
  )

  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(
      receivableItems.map((i) => [i.id, i.quantityOrdered - i.quantityReceived]),
    ),
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const receipts = receivableItems
      .map((i) => ({ itemId: i.id, quantityReceived: quantities[i.id] ?? 0 }))
      .filter((r) => r.quantityReceived > 0)

    if (receipts.length === 0) {
      setError("Saisissez au moins une quantité reçue")
      return
    }

    startTransition(async () => {
      const result = await actionReceivePurchaseOrderItems({ orderId: order.id, receipts })
      if (!result.success) {
        setError(result.error ?? "Erreur lors de la réception")
        return
      }
      setSuccess(true)
      router.refresh()
    })
  }

  if (receivableItems.length === 0) return null

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
      <h2 className="font-semibold text-slate-900">Enregistrer une réception</h2>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-2 font-medium text-slate-600">Article</th>
                <th className="text-left px-4 py-2 font-medium text-slate-600">Commandé</th>
                <th className="text-left px-4 py-2 font-medium text-slate-600">Déjà reçu</th>
                <th className="text-left px-4 py-2 font-medium text-slate-600">Qté à recevoir</th>
              </tr>
            </thead>
            <tbody>
              {receivableItems.map((item) => {
                const remaining = item.quantityOrdered - item.quantityReceived
                return (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="px-4 py-2">
                      <span className="font-medium text-slate-900">{item.stockItem.name}</span>
                      <span className="text-xs text-slate-400 ml-2">{item.stockItem.reference}</span>
                    </td>
                    <td className="px-4 py-2 text-slate-600">{item.quantityOrdered} {item.stockItem.unit}</td>
                    <td className="px-4 py-2 text-slate-500">{item.quantityReceived}</td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        min={0}
                        max={remaining}
                        value={quantities[item.id] ?? 0}
                        onChange={(e) => {
                          setQuantities((prev) => ({
                            ...prev,
                            [item.id]: Math.min(parseInt(e.target.value) || 0, remaining),
                          }))
                        }}
                        className="h-8 w-20"
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
        )}
        {success && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
            Réception enregistrée — stock mis à jour.
          </p>
        )}

        <Button type="submit" disabled={isPending} size="sm">
          <PackageCheck className="w-4 h-4 mr-1.5" />
          {isPending ? "Enregistrement…" : "Enregistrer la réception"}
        </Button>
      </form>
    </div>
  )
}
