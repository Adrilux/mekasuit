"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { actionCreatePurchaseOrder } from "@/server/actions/stock/action-create-purchase-order"

type SupplierOption = { id: string; name: string }
type StockItemOption = {
  id: string
  name: string
  reference: string
  unit: string
  supplierLinks: { supplierId: string; purchasePriceCents: number }[]
}

type LineItem = {
  stockItemId: string
  quantityOrdered: number
  unitPriceCents: number
}

type Props = {
  siteId: string
  suppliers: SupplierOption[]
  stockItems: StockItemOption[]
  prefilledItemIds: string[]
}

export function PurchaseOrderForm({ siteId, suppliers, stockItems, prefilledItemIds }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [supplierId, setSupplierId] = useState("")
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("")
  const [notes, setNotes] = useState("")

  const initialLines: LineItem[] = prefilledItemIds
    .map((id) => {
      const item = stockItems.find((s) => s.id === id)
      if (!item) return null
      return { stockItemId: id, quantityOrdered: 1, unitPriceCents: 0 }
    })
    .filter(Boolean) as LineItem[]

  const [lines, setLines] = useState<LineItem[]>(
    initialLines.length > 0 ? initialLines : [{ stockItemId: "", quantityOrdered: 1, unitPriceCents: 0 }],
  )

  function addLine() {
    setLines((prev) => [...prev, { stockItemId: "", quantityOrdered: 1, unitPriceCents: 0 }])
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index))
  }

  function updateLine(index: number, field: keyof LineItem, value: string | number) {
    setLines((prev) =>
      prev.map((line, i) => {
        if (i !== index) return line
        if (field === "stockItemId" && typeof value === "string") {
          // Auto-fill price from supplier link if available
          const item = stockItems.find((s) => s.id === value)
          const link = item?.supplierLinks.find((l) => l.supplierId === supplierId)
          return { ...line, stockItemId: value, unitPriceCents: link?.purchasePriceCents ?? 0 }
        }
        return { ...line, [field]: value }
      }),
    )
  }

  const totalCents = lines.reduce((sum, l) => sum + l.quantityOrdered * l.unitPriceCents, 0)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const validLines = lines.filter((l) => l.stockItemId)
    if (validLines.length === 0) {
      setError("Ajoutez au moins un article")
      return
    }
    if (!supplierId) {
      setError("Sélectionnez un fournisseur")
      return
    }

    startTransition(async () => {
      const result = await actionCreatePurchaseOrder({
        siteId,
        supplierId,
        items: validLines,
        expectedDeliveryDate: expectedDeliveryDate || undefined,
        notes: notes || undefined,
      })
      if (!result.success) {
        setError(result.error ?? "Erreur lors de la création")
        return
      }
      router.push(`/stock/purchase-orders/${result.data.id}`)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Fournisseur */}
      <div className="space-y-1.5">
        <Label htmlFor="supplier">Fournisseur *</Label>
        <select
          id="supplier"
          value={supplierId}
          onChange={(e) => { setSupplierId(e.target.value) }}
          className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Sélectionner un fournisseur…</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        {suppliers.length === 0 && (
          <p className="text-xs text-amber-600">
            Aucun fournisseur configuré. Ajoutez-en depuis la fiche d&apos;un article stock.
          </p>
        )}
      </div>

      {/* Lignes articles */}
      <div className="space-y-2">
        <Label>Articles *</Label>
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-3 py-2 font-medium text-slate-600">Article</th>
                <th className="text-left px-3 py-2 font-medium text-slate-600 w-24">Qté</th>
                <th className="text-left px-3 py-2 font-medium text-slate-600 w-32">Prix unit. (€)</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {lines.map((line, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="px-3 py-2">
                    <select
                      value={line.stockItemId}
                      onChange={(e) => { updateLine(i, "stockItemId", e.target.value) }}
                      className="w-full border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Sélectionner…</option>
                      {stockItems.map((s) => (
                        <option key={s.id} value={s.id}>
                          [{s.reference}] {s.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      min={1}
                      value={line.quantityOrdered}
                      onChange={(e) => { updateLine(i, "quantityOrdered", parseInt(e.target.value) || 1) }}
                      className="h-8 w-20"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={(line.unitPriceCents / 100).toFixed(2)}
                      onChange={(e) => {
                        updateLine(i, "unitPriceCents", Math.round(parseFloat(e.target.value || "0") * 100))
                      }}
                      className="h-8 w-28"
                    />
                  </td>
                  <td className="px-3 py-2">
                    {lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => { removeLine(i) }}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between">
          <Button type="button" variant="ghost" size="sm" onClick={addLine}>
            <Plus className="w-4 h-4 mr-1" />
            Ajouter un article
          </Button>
          {totalCents > 0 && (
            <span className="text-sm text-slate-600 font-medium">
              Total estimé : {(totalCents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
            </span>
          )}
        </div>
      </div>

      {/* Date de livraison prévue */}
      <div className="space-y-1.5">
        <Label htmlFor="deliveryDate">Date de livraison prévue</Label>
        <Input
          id="deliveryDate"
          type="date"
          value={expectedDeliveryDate}
          onChange={(e) => { setExpectedDeliveryDate(e.target.value) }}
          className="max-w-xs"
        />
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => { setNotes(e.target.value) }}
          placeholder="Instructions, références commande fournisseur…"
          rows={3}
          maxLength={1000}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          <ShoppingCart className="w-4 h-4 mr-1.5" />
          {isPending ? "Création…" : "Créer la commande"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => { router.back() }}>
          Annuler
        </Button>
      </div>
    </form>
  )
}
