"use client"

import { useState, useTransition, useCallback } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { actionUpdateInventoryCount } from "@/server/actions/stock/action-update-inventory-count"
import { actionCloseInventorySession } from "@/server/actions/stock/action-close-inventory-session"
import type { InventoryItemRow } from "@/server/queries/stock/query-get-inventory-session-detail"

type Props = {
  sessionId: string
  initialItems: InventoryItemRow[]
  isOpen: boolean
}

export function InventorySessionTable({ sessionId, initialItems, isOpen }: Props) {
  const router = useRouter()
  const [items, setItems] = useState(initialItems)
  const [closeDialog, setCloseDialog] = useState(false)
  const [closeResult, setCloseResult] = useState<{ adjustedCount: number; totalItems: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const countedCount = items.filter((i) => i.countedQuantity !== null).length
  const allCounted = countedCount === items.length

  const handleCountChange = useCallback((itemId: string, value: string) => {
    const num = value === "" ? null : parseInt(value, 10)
    setItems((prev) => prev.map((i) => i.id === itemId ? { ...i, countedQuantity: isNaN(num!) ? null : num } : i))
  }, [])

  const handleCountBlur = useCallback((item: InventoryItemRow) => {
    if (item.countedQuantity === null) return
    startTransition(async () => {
      await actionUpdateInventoryCount({ inventoryItemId: item.id, countedQuantity: item.countedQuantity! })
    })
  }, [])

  function handleClose() {
    setError(null)
    startTransition(async () => {
      const res = await actionCloseInventorySession({ sessionId })
      if (!res.success) { setError(res.error ?? "Erreur inconnue"); return }
      const data = res.data as { adjustedCount: number; totalItems: number }
      setCloseResult(data)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {/* Progression */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{countedCount}</span> / {items.length} articles comptés
        </p>
        {isOpen && (
          <Button
            size="sm"
            disabled={!allCounted || isPending}
            onClick={() => { setCloseDialog(true) }}
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            Valider l&apos;inventaire
          </Button>
        )}
      </div>

      {/* Barre de progression */}
      <div className="w-full bg-slate-100 rounded-full h-1.5">
        <div
          className="bg-blue-500 h-1.5 rounded-full transition-all"
          style={{ width: `${items.length > 0 ? (countedCount / items.length) * 100 : 0}%` }}
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-medium text-slate-600">Référence</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Article</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Stock système</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Compté</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Écart</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const ecart = item.countedQuantity !== null ? item.countedQuantity - item.systemQuantity : null
                return (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{item.reference}</td>
                    <td className="px-4 py-3 text-slate-800">{item.name}</td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {item.systemQuantity} {item.unit}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isOpen ? (
                        <input
                          type="number"
                          min="0"
                          value={item.countedQuantity ?? ""}
                          onChange={(e) => { handleCountChange(item.id, e.target.value) }}
                          onBlur={() => { handleCountBlur(item) }}
                          placeholder="—"
                          className="w-20 text-right border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-slate-800">
                          {item.countedQuantity !== null ? `${item.countedQuantity} ${item.unit}` : "—"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {ecart === null ? (
                        <span className="text-slate-300">—</span>
                      ) : ecart === 0 ? (
                        <span className="text-green-600">0</span>
                      ) : (
                        <span className={ecart > 0 ? "text-blue-600" : "text-red-600"}>
                          {ecart > 0 ? "+" : ""}{ecart}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog confirmation clôture */}
      <Dialog open={closeDialog} onOpenChange={setCloseDialog}>
        <DialogContent className="max-w-sm" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Valider l&apos;inventaire</DialogTitle>
          </DialogHeader>
          {closeResult ? (
            <div className="py-4 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" />
              <p className="font-semibold text-slate-800">Inventaire clôturé</p>
              <p className="text-sm text-slate-600">
                {closeResult.adjustedCount > 0
                  ? `${closeResult.adjustedCount} ajustement(s) généré(s) sur ${closeResult.totalItems} articles.`
                  : `Aucun écart détecté sur ${closeResult.totalItems} articles.`}
              </p>
            </div>
          ) : (
            <>
              <div className="py-2 space-y-3">
                <p className="text-sm text-slate-600">
                  Les articles avec un écart recevront automatiquement un mouvement d&apos;ajustement.
                </p>
                {items.some((i) => i.countedQuantity !== null && i.countedQuantity !== i.systemQuantity) && (
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800">
                      {items.filter((i) => i.countedQuantity !== null && i.countedQuantity !== i.systemQuantity).length} article(s) avec écart seront ajustés.
                    </p>
                  </div>
                )}
                {error && <p className="text-xs text-red-600">{error}</p>}
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => { setCloseDialog(false) }}>
                  Annuler
                </Button>
                <Button size="sm" onClick={handleClose} disabled={isPending}>
                  {isPending ? "Clôture en cours…" : "Confirmer et clôturer"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
