"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { ConfirmDialog } from "@/components/feedback/confirm-dialog"
import { actionConsumeStockPart } from "@/server/actions/interventions/action-consume-stock-part"
import { actionRemoveConsumedPart } from "@/server/actions/interventions/action-remove-consumed-part"
import { toast } from "sonner"
import type { StockItemOption } from "@/server/queries/stock/query-get-stock-items-by-site"

type PartUsedRow = {
  id: string
  quantity: number
  stockItem: { id: string; name: string; reference: string; unit: string }
}

export function InterventionPartsPanel({
  interventionId,
  partsUsed,
  stockItems,
  isReadOnly,
  isPreventive = false,
}: {
  interventionId: string
  partsUsed: PartUsedRow[]
  stockItems: StockItemOption[]
  isReadOnly: boolean
  isPreventive?: boolean
}) {
  const router = useRouter()
  const [selectedItemId, setSelectedItemId] = useState<string>("")
  const [quantity, setQuantity] = useState<number>(1)
  const [adding, setAdding] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const selectedStock = stockItems.find((s) => s.id === selectedItemId)

  async function handleAdd() {
    if (!selectedItemId) {
      toast.error("Sélectionnez une pièce")
      return
    }
    setAdding(true)
    const result = await actionConsumeStockPart({ interventionId, stockItemId: selectedItemId, quantity })
    setAdding(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success("Pièce enregistrée")
    setSelectedItemId("")
    setQuantity(1)
    router.refresh()
  }

  async function handleRemove(partUsedId: string) {
    const result = await actionRemoveConsumedPart({ partUsedId })

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success("Pièce retirée — stock remis à jour")
    setRemovingId(null)
    router.refresh()
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200">
        <h2 className="text-sm font-semibold text-slate-700">
          {isPreventive ? "Pièces hors prévision" : "Pièces utilisées"}
        </h2>
        {isPreventive && (
          <p className="text-xs text-slate-400 mt-0.5">Pièces consommées en dehors de la liste prévue</p>
        )}
      </div>

      {partsUsed.length === 0 ? (
        <p className="px-5 py-4 text-sm text-slate-400">Aucune pièce enregistrée</p>
      ) : (
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-5 py-3 font-medium text-slate-600">Référence</th>
              <th className="text-left px-5 py-3 font-medium text-slate-600">Désignation</th>
              <th className="text-right px-5 py-3 font-medium text-slate-600">Qté</th>
              <th className="text-left px-5 py-3 font-medium text-slate-600">Unité</th>
              {!isReadOnly && <th className="px-5 py-3" />}
            </tr>
          </thead>
          <tbody>
            {partsUsed.map((part) => (
              <tr key={part.id} className="border-b border-slate-100">
                <td className="px-5 py-3 font-mono text-xs text-slate-500">{part.stockItem.reference}</td>
                <td className="px-5 py-3 font-medium">{part.stockItem.name}</td>
                <td className="px-5 py-3 text-right font-medium">{part.quantity}</td>
                <td className="px-5 py-3 text-slate-500">{part.stockItem.unit}</td>
                {!isReadOnly && (
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => setRemovingId(part.id)}
                      className="text-slate-400 hover:text-red-600 transition-colors"
                      title="Retirer cette pièce"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}

      {/* Formulaire d'ajout — visible uniquement si l'intervention n'est pas terminée et si le module stock est disponible */}
      {!isReadOnly && stockItems.length > 0 && (
        <div className="px-5 py-4 border-t border-slate-100 flex flex-wrap items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs text-slate-500 mb-1">Pièce</label>
            <Select value={selectedItemId} onValueChange={setSelectedItemId}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Sélectionner une pièce..." />
              </SelectTrigger>
              <SelectContent>
                {stockItems.map((item) => (
                  <SelectItem key={item.id} value={item.id} disabled={item.quantityOnHand === 0}>
                    <span>{item.name}</span>
                    <span className="ml-2 text-xs text-slate-400">
                      ({item.quantityOnHand} {item.unit})
                      {item.quantityOnHand === 0 && " — rupture"}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-24">
            <label className="block text-xs text-slate-500 mb-1">Quantité</label>
            <Input
              type="number"
              min={1}
              max={selectedStock?.quantityOnHand ?? 999}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="h-9 text-center"
            />
          </div>

          <Button size="sm" onClick={handleAdd} disabled={adding || !selectedItemId} className="h-9">
            <Plus className="w-4 h-4 mr-1" />
            {adding ? "..." : "Ajouter"}
          </Button>
        </div>
      )}

      {!isReadOnly && stockItems.length === 0 && (
        <p className="px-5 py-3 text-xs text-slate-400 border-t border-slate-100">
          Aucune pièce en stock sur ce site
        </p>
      )}

      {/* Dialog de confirmation pour retrait */}
      <ConfirmDialog
        open={!!removingId}
        onOpenChange={(open) => !open && setRemovingId(null)}
        title="Retirer cette pièce ?"
        description="La quantité sera remise en stock. Cette action est réversible."
        confirmLabel="Retirer"
        variant="default"
        onConfirm={() => { if (removingId) handleRemove(removingId) }}
      />
    </div>
  )
}
