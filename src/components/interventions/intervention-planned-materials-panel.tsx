"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Trash2, Plus, Loader2, Wrench, CheckCircle2, Zap, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { actionUpdatePlannedMaterials } from "@/server/actions/interventions/action-update-planned-materials"
import { actionConsumePlannedMaterials } from "@/server/actions/interventions/action-consume-planned-materials"
import { actionRemoveConsumedPart } from "@/server/actions/interventions/action-remove-consumed-part"
import { toast } from "sonner"

type PlannedMaterial = {
  id: string
  stockItemId: string
  quantityPlanned: number
  note: string | null
  stockItem: {
    id: string
    name: string
    reference: string
    unit: string
    quantityOnHand: number
  }
}

// partsUsed includes the DB row id so we can undo consumption
type ConsumedPart = {
  id: string          // InterventionPartUsed.id
  stockItemId: string
  quantity: number
}

type StockOption = {
  id: string
  name: string
  reference: string
  unit: string
  quantityOnHand: number
}

export function InterventionPlannedMaterialsPanel({
  interventionId,
  plannedMaterials,
  partsUsed,
  stockItems,
  isReadOnly,
}: {
  interventionId: string
  plannedMaterials: PlannedMaterial[]
  partsUsed: ConsumedPart[]
  stockItems: StockOption[]
  isReadOnly: boolean
}) {
  const router = useRouter()

  // --- Planned rows (editable list) ---
  const [rows, setRows] = useState(
    plannedMaterials.map((m) => ({
      stockItemId: m.stockItemId,
      quantityPlanned: m.quantityPlanned,
      note: m.note ?? "",
    }))
  )
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)

  // Qty to consume per stockItemId (separate from planned qty)
  const [consumeQty, setConsumeQty] = useState<Record<string, number>>(
    Object.fromEntries(plannedMaterials.map((m) => [m.stockItemId, m.quantityPlanned]))
  )

  // Local copy of consumed parts — kept in sync after each action so UI stays consistent
  // without needing router.refresh() to clear the stale state.
  const [localConsumed, setLocalConsumed] = useState<ConsumedPart[]>(partsUsed)

  // New row form
  const [newItemId, setNewItemId] = useState("")
  const [newQty, setNewQty] = useState(1)

  // Loading state per stockItemId for consume/unconsume
  const [busyId, setBusyId] = useState<string | null>(null)
  const [consumingAll, startConsumeAll] = useTransition()

  const consumedMap = new Map(localConsumed.map((p) => [p.stockItemId, p]))
  const usedIds = new Set(rows.map((r) => r.stockItemId))
  const availableItems = stockItems.filter((s) => !usedIds.has(s.id))
  const getStockItem = (id: string) => stockItems.find((s) => s.id === id)

  const notYetConsumed = rows.filter((r) => !consumedMap.has(r.stockItemId))
  const allConsumed = rows.length > 0 && notYetConsumed.length === 0

  // --- Planned list editing ---
  function addRow() {
    if (!newItemId) { toast.error("Sélectionnez un article"); return }
    setRows((prev) => [...prev, { stockItemId: newItemId, quantityPlanned: newQty, note: "" }])
    setConsumeQty((prev) => ({ ...prev, [newItemId]: newQty }))
    setNewItemId("")
    setNewQty(1)
    setDirty(true)
  }

  async function removeRow(stockItemId: string) {
    // If already consumed, undo the consumption first
    const existing = consumedMap.get(stockItemId)
    if (existing) {
      setBusyId(stockItemId)
      const r = await actionRemoveConsumedPart({ partUsedId: existing.id })
      setBusyId(null)
      if (!r.success) { toast.error(r.error); return }
      setLocalConsumed((prev) => prev.filter((p) => p.stockItemId !== stockItemId))
      toast.success("Consommation annulée")
    }
    setRows((prev) => prev.filter((r) => r.stockItemId !== stockItemId))
    setDirty(true)
  }

  function updatePlannedQty(stockItemId: string, qty: number) {
    setRows((prev) => prev.map((r) => r.stockItemId === stockItemId ? { ...r, quantityPlanned: qty } : r))
    setConsumeQty((prev) => ({ ...prev, [stockItemId]: qty }))
    setDirty(true)
  }

  async function handleSave() {
    setSaving(true)
    const result = await actionUpdatePlannedMaterials({ interventionId, materials: rows })
    setSaving(false)
    if (!result.success) { toast.error(result.error); return }
    toast.success("Matériaux prévus enregistrés")
    setDirty(false)
    router.refresh()
  }

  // --- Consumption ---
  async function consumeOne(stockItemId: string) {
    const qty = consumeQty[stockItemId] ?? 1
    setBusyId(stockItemId)
    const result = await actionConsumePlannedMaterials({
      interventionId,
      items: [{ stockItemId, quantity: qty }],
    })
    setBusyId(null)
    if (!result.success) { toast.error(result.error); return }
    // Optimistic local update — we don't know the new DB id so we refresh to get it
    toast.success("Pièce consommée — stock mis à jour")
    router.refresh()
  }

  function consumeAll() {
    const items = notYetConsumed.map((r) => ({
      stockItemId: r.stockItemId,
      quantity: consumeQty[r.stockItemId] ?? r.quantityPlanned,
    }))
    startConsumeAll(async () => {
      const result = await actionConsumePlannedMaterials({ interventionId, items })
      if (!result.success) { toast.error(result.error); return }
      toast.success(`${items.length} pièce(s) consommée(s) — stock mis à jour`)
      router.refresh()
    })
  }

  // Undo a single consumption so user can edit the qty and re-consume
  async function unconsume(stockItemId: string) {
    const existing = consumedMap.get(stockItemId)
    if (!existing) return
    setBusyId(stockItemId)
    const result = await actionRemoveConsumedPart({ partUsedId: existing.id })
    setBusyId(null)
    if (!result.success) { toast.error(result.error); return }
    // Remove from local state immediately — no refresh needed
    setLocalConsumed((prev) => prev.filter((p) => p.stockItemId !== stockItemId))
    toast.success("Consommation annulée — modifiez et re-consommez")
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 border-b border-slate-200">
        <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Wrench className="w-4 h-4 text-slate-400" />
          Matériaux prévus
          {rows.length > 0 && (
            <span className="text-xs font-normal text-slate-400">({rows.length})</span>
          )}
          {allConsumed && (
            <span className="flex items-center gap-1 text-xs font-medium text-green-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Tout consommé
            </span>
          )}
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          {!isReadOnly && dirty && (
            <Button size="sm" variant="outline" onClick={handleSave} disabled={saving} className="h-7 text-xs">
              {saving && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
              Enregistrer liste
            </Button>
          )}
          {!isReadOnly && notYetConsumed.length > 1 && (
            <Button
              size="sm"
              onClick={consumeAll}
              disabled={consumingAll || !!busyId}
              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {consumingAll
                ? <Loader2 className="w-3 h-3 animate-spin mr-1" />
                : <Zap className="w-3 h-3 mr-1" />}
              Tout consommer ({notYetConsumed.length})
            </Button>
          )}
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="px-5 py-4 text-sm text-slate-400">
          {isReadOnly ? "Aucun matériau prévu pour cette intervention" : "Ajoutez les pièces et outils nécessaires pour cette maintenance"}
        </p>
      ) : (
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs">
              <th className="text-left px-5 py-2.5 font-medium text-slate-600">Article</th>
              <th className="text-right px-4 py-2.5 font-medium text-slate-600">Prévu</th>
              <th className="text-right px-4 py-2.5 font-medium text-slate-600">Stock</th>
              <th className="text-right px-4 py-2.5 font-medium text-slate-600">
                {isReadOnly ? "Consommé" : "À consommer"}
              </th>
              {!isReadOnly && <th className="w-32 px-4 py-2.5" />}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const item = getStockItem(row.stockItemId)
              if (!item) return null
              const stockOk = item.quantityOnHand >= row.quantityPlanned
              const consumed = consumedMap.get(row.stockItemId)
              const qty = consumeQty[row.stockItemId] ?? row.quantityPlanned
              const isBusy = busyId === row.stockItemId

              return (
                <tr
                  key={row.stockItemId}
                  className={`border-b border-slate-100 ${consumed ? "bg-green-50/50" : "hover:bg-slate-50"}`}
                >
                  {/* Article name */}
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-800">{item.name}</p>
                    <p className="text-xs text-slate-400 font-mono">{item.reference}</p>
                  </td>

                  {/* Planned qty — editable if not yet consumed and not readOnly */}
                  <td className="px-4 py-3 text-right">
                    {!isReadOnly && !consumed ? (
                      <Input
                        type="number"
                        min={1}
                        max={9999}
                        value={row.quantityPlanned}
                        onChange={(e) => updatePlannedQty(row.stockItemId, Math.max(1, parseInt(e.target.value) || 1))}
                        className="h-7 w-16 text-center text-xs ml-auto"
                      />
                    ) : (
                      <span className="font-medium text-slate-700">{row.quantityPlanned} {item.unit}</span>
                    )}
                  </td>

                  {/* Current stock */}
                  <td className="px-4 py-3 text-right">
                    <span className={`text-xs font-medium ${stockOk ? "text-green-600" : "text-red-500"}`}>
                      {item.quantityOnHand} {item.unit}
                      {!stockOk && " ⚠"}
                    </span>
                  </td>

                  {/* Consumed qty or input */}
                  <td className="px-4 py-3 text-right">
                    {consumed ? (
                      <span className="text-xs text-green-600 font-medium flex items-center justify-end gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {consumed.quantity} {item.unit}
                      </span>
                    ) : isReadOnly ? (
                      <span className="text-xs text-slate-400">—</span>
                    ) : (
                      <Input
                        type="number"
                        min={1}
                        max={item.quantityOnHand > 0 ? item.quantityOnHand : 9999}
                        value={qty}
                        onChange={(e) =>
                          setConsumeQty((prev) => ({
                            ...prev,
                            [row.stockItemId]: Math.max(1, parseInt(e.target.value) || 1),
                          }))
                        }
                        className="h-7 w-16 text-center text-xs ml-auto"
                      />
                    )}
                  </td>

                  {/* Actions — only in edit mode */}
                  {!isReadOnly && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {isBusy ? (
                          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                        ) : consumed ? (
                          // Already consumed: show undo button
                          <button
                            onClick={() => { void unconsume(row.stockItemId) }}
                            className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1 border border-amber-200 rounded px-2 py-0.5 hover:bg-amber-50 transition-colors"
                            title="Annuler la consommation pour modifier"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Modifier
                          </button>
                        ) : (
                          // Not consumed: show consume button
                          <Button
                            size="sm"
                            onClick={() => { void consumeOne(row.stockItemId) }}
                            disabled={consumingAll || item.quantityOnHand === 0}
                            className="h-7 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            Consommer
                          </Button>
                        )}
                        <button
                          onClick={() => { void removeRow(row.stockItemId) }}
                          disabled={isBusy}
                          className="text-slate-300 hover:text-red-500 transition-colors disabled:opacity-40"
                          title="Retirer de la liste prévue"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
        </div>
      )}

      {/* Add form */}
      {!isReadOnly && availableItems.length > 0 && (
        <div className="px-5 py-4 border-t border-slate-100 flex flex-wrap items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs text-slate-500 mb-1">Article / outil</label>
            <Select value={newItemId} onValueChange={setNewItemId}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                {availableItems.map((si) => (
                  <SelectItem key={si.id} value={si.id}>
                    <span>{si.name}</span>
                    <span className="ml-2 text-xs text-slate-400">({si.quantityOnHand} {si.unit})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-20">
            <label className="block text-xs text-slate-500 mb-1">Qté prévue</label>
            <Input
              type="number"
              min={1}
              max={9999}
              value={newQty}
              onChange={(e) => setNewQty(Math.max(1, parseInt(e.target.value) || 1))}
              className="h-9 text-center"
            />
          </div>
          <Button size="sm" onClick={addRow} disabled={!newItemId} className="h-9">
            <Plus className="w-4 h-4 mr-1" />
            Ajouter
          </Button>
        </div>
      )}

      {!isReadOnly && availableItems.length === 0 && rows.length === 0 && (
        <p className="px-5 py-3 text-xs text-slate-400 border-t border-slate-100">
          Aucune pièce disponible sur ce site
        </p>
      )}
    </div>
  )
}
