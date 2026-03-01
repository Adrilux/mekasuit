"use client"

import { useState, useTransition } from "react"
import { TrendingUp, TrendingDown, RotateCcw, ArrowLeftRight, XCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { actionCancelStockMovement } from "@/server/actions/stock/action-cancel-stock-movement"

type Movement = {
  id: string
  type: string
  quantity: number
  reason: string | null
  operatorId: string
  createdAt: Date
  cancelledAt: Date | null
  cancelledBy: string | null
  cancelReason: string | null
}

type Props = {
  movements: Movement[]
  unit: string
  userNameMap: Map<string, string>
  canCancel: boolean
}

const MOVEMENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  IN: TrendingUp,
  OUT: TrendingDown,
  ADJUSTMENT: RotateCcw,
  TRANSFER_IN: ArrowLeftRight,
  TRANSFER_OUT: ArrowLeftRight,
}

const MOVEMENT_LABELS: Record<string, string> = {
  IN: "Entrée",
  OUT: "Sortie",
  ADJUSTMENT: "Ajustement",
  TRANSFER_IN: "Transfert entrant",
  TRANSFER_OUT: "Transfert sortant",
}

const MOVEMENT_COLORS: Record<string, string> = {
  IN: "text-green-600",
  OUT: "text-red-600",
  ADJUSTMENT: "text-blue-600",
  TRANSFER_IN: "text-green-600",
  TRANSFER_OUT: "text-red-600",
}

const CANCELLABLE_TYPES = ["IN", "OUT", "ADJUSTMENT"]

export function StockMovementHistory({ movements: initialMovements, unit, userNameMap, canCancel }: Props) {
  const [movements, setMovements] = useState(initialMovements)
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; movementId: string | null }>({ open: false, movementId: null })
  const [cancelReason, setCancelReason] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function openCancel(id: string) {
    setCancelDialog({ open: true, movementId: id })
    setCancelReason("")
    setError(null)
  }

  function handleCancel() {
    if (!cancelDialog.movementId) return
    setError(null)
    startTransition(async () => {
      const res = await actionCancelStockMovement({ movementId: cancelDialog.movementId!, reason: cancelReason })
      if (!res.success) { setError(res.error ?? "Erreur inconnue"); return }
      setMovements((prev) => prev.map((m) =>
        m.id === cancelDialog.movementId
          ? { ...m, cancelledAt: new Date(), cancelledBy: "", cancelReason: cancelReason || null }
          : m
      ))
      setCancelDialog({ open: false, movementId: null })
    })
  }

  if (movements.length === 0) {
    return <p className="px-5 py-6 text-sm text-slate-400 text-center">Aucun mouvement enregistré</p>
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-2 font-medium text-slate-600">Type</th>
              <th className="text-left px-4 py-2 font-medium text-slate-600">Quantité</th>
              <th className="text-left px-4 py-2 font-medium text-slate-600">Motif</th>
              <th className="text-left px-4 py-2 font-medium text-slate-600">Opérateur</th>
              <th className="text-left px-4 py-2 font-medium text-slate-600">Date</th>
              {canCancel && <th className="px-4 py-2 w-10" />}
            </tr>
          </thead>
          <tbody>
            {movements.map((m) => {
              const Icon = MOVEMENT_ICONS[m.type] ?? RotateCcw
              const color = MOVEMENT_COLORS[m.type] ?? "text-slate-600"
              const isPositive = ["IN", "TRANSFER_IN", "ADJUSTMENT"].includes(m.type)
              const isCancelled = m.cancelledAt !== null
              const canCancelThis = canCancel && !isCancelled && CANCELLABLE_TYPES.includes(m.type)

              return (
                <tr
                  key={m.id}
                  className={`border-b border-slate-100 hover:bg-slate-50 ${isCancelled ? "opacity-40" : ""}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center gap-1.5 ${color}`}>
                        <Icon className="w-3.5 h-3.5" />
                        <span className="font-medium">{MOVEMENT_LABELS[m.type] ?? m.type}</span>
                      </div>
                      {isCancelled && (
                        <span className="text-xs bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded">Annulé</span>
                      )}
                    </div>
                  </td>
                  <td className={`px-4 py-3 font-semibold ${color}`}>
                    {isPositive ? "+" : "-"}{m.quantity} {unit}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{m.reason ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {userNameMap.get(m.operatorId) ?? "Inconnu"}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(m.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </td>
                  {canCancel && (
                    <td className="px-4 py-3">
                      {canCancelThis && (
                        <button
                          onClick={() => { openCancel(m.id) }}
                          className="text-slate-300 hover:text-red-500 transition-colors"
                          title="Annuler ce mouvement"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={cancelDialog.open} onOpenChange={(o) => { setCancelDialog({ open: o, movementId: null }) }}>
        <DialogContent className="max-w-sm" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Annuler ce mouvement</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-slate-600">
              Un mouvement compensatoire (ajustement) sera créé automatiquement pour corriger le stock.
            </p>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Raison (optionnel)</label>
              <input
                type="text"
                placeholder="Ex: saisie erronée"
                value={cancelReason}
                onChange={(e) => { setCancelReason(e.target.value) }}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setCancelDialog({ open: false, movementId: null }) }}>
              Annuler
            </Button>
            <Button variant="destructive" size="sm" onClick={handleCancel} disabled={isPending}>
              {isPending ? "Annulation…" : "Confirmer l'annulation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
