"use client"

import { useState, useTransition } from "react"
import { Truck, Plus, Trash2, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { actionCreateSupplier } from "@/server/actions/stock/action-create-supplier"
import { actionUpsertStockItemSupplier } from "@/server/actions/stock/action-upsert-stock-item-supplier"
import { actionUnlinkStockItemSupplier } from "@/server/actions/stock/action-unlink-stock-item-supplier"
import type { SupplierOption } from "@/server/queries/stock/query-get-suppliers"
import type { StockItemSupplierDetail } from "@/server/queries/stock/query-get-stock-item-suppliers"

type Props = {
  stockItemId: string
  initialLinks: StockItemSupplierDetail[]
  suppliers: SupplierOption[]
  canEdit: boolean
}

type LinkFormState = {
  mode: "existing" | "new"
  supplierId: string
  newSupplierName: string
  supplierReference: string
  purchasePriceEur: string
  leadTimeDays: string
}

const EMPTY_FORM: LinkFormState = {
  mode: "existing",
  supplierId: "",
  newSupplierName: "",
  supplierReference: "",
  purchasePriceEur: "",
  leadTimeDays: "",
}

export function StockSuppliersPanel({ stockItemId, initialLinks, suppliers: initialSuppliers, canEdit }: Props) {
  const [links, setLinks] = useState<StockItemSupplierDetail[]>(initialLinks)
  const [allSuppliers, setAllSuppliers] = useState<SupplierOption[]>(initialSuppliers)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLink, setEditingLink] = useState<StockItemSupplierDetail | null>(null)
  const [form, setForm] = useState<LinkFormState>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function openAdd() {
    setEditingLink(null)
    setForm(EMPTY_FORM)
    setError(null)
    setDialogOpen(true)
  }

  function openEdit(link: StockItemSupplierDetail) {
    setEditingLink(link)
    setForm({
      mode: "existing",
      supplierId: link.supplierId,
      newSupplierName: "",
      supplierReference: link.supplierReference ?? "",
      purchasePriceEur: link.purchasePriceCents > 0 ? (link.purchasePriceCents / 100).toFixed(2) : "",
      leadTimeDays: link.leadTimeDays != null ? String(link.leadTimeDays) : "",
    })
    setError(null)
    setDialogOpen(true)
  }

  function handleSubmit() {
    setError(null)
    startTransition(async () => {
      let supplierId = form.supplierId

      // Créer fournisseur si mode "new"
      if (form.mode === "new") {
        if (!form.newSupplierName.trim()) {
          setError("Le nom du fournisseur est requis")
          return
        }
        const res = await actionCreateSupplier({ name: form.newSupplierName.trim() })
        if (!res.success) { setError(res.error ?? "Erreur inconnue"); return }
        supplierId = (res.data as { id: string }).id
        setAllSuppliers((prev) => [...prev, { id: supplierId, name: form.newSupplierName.trim(), email: null, phone: null }])
      }

      if (!supplierId) { setError("Veuillez sélectionner un fournisseur"); return }

      const purchasePriceCents = form.purchasePriceEur
        ? Math.round(parseFloat(form.purchasePriceEur.replace(",", ".")) * 100)
        : 0

      const leadTimeDays = form.leadTimeDays ? parseInt(form.leadTimeDays, 10) : null

      const res = await actionUpsertStockItemSupplier({
        stockItemId,
        supplierId,
        supplierReference: form.supplierReference || undefined,
        purchasePriceCents: isNaN(purchasePriceCents) ? 0 : purchasePriceCents,
        leadTimeDays: leadTimeDays && !isNaN(leadTimeDays) ? leadTimeDays : null,
      })

      if (!res.success) { setError(res.error ?? "Erreur inconnue"); return }

      // Rafraîchir la liste locale
      const supplierName = form.mode === "new"
        ? form.newSupplierName.trim()
        : (allSuppliers.find((s) => s.id === supplierId)?.name ?? "")

      const newLink: StockItemSupplierDetail = {
        id: editingLink?.id ?? supplierId, // temporaire si nouveau
        supplierId,
        supplierName,
        supplierReference: form.supplierReference || null,
        purchasePriceCents: isNaN(purchasePriceCents) ? 0 : purchasePriceCents,
        leadTimeDays: leadTimeDays && !isNaN(leadTimeDays) ? leadTimeDays : null,
      }

      if (editingLink) {
        setLinks((prev) => prev.map((l) => l.id === editingLink.id ? newLink : l))
      } else {
        setLinks((prev) => {
          const existing = prev.find((l) => l.supplierId === supplierId)
          if (existing) return prev.map((l) => l.supplierId === supplierId ? newLink : l)
          return [...prev, newLink]
        })
      }

      setDialogOpen(false)
    })
  }

  function handleDelete(link: StockItemSupplierDetail) {
    startTransition(async () => {
      const res = await actionUnlinkStockItemSupplier({ linkId: link.id })
      if (!res.success) return
      setLinks((prev) => prev.filter((l) => l.id !== link.id))
    })
  }

  // Fournisseurs non encore liés (pour éviter les doublons dans le select)
  const linkedIds = new Set(links.map((l) => l.supplierId))
  const availableSuppliers = allSuppliers.filter((s) => {
    if (editingLink) return true // en mode édition, tout afficher
    return !linkedIds.has(s.id)
  })

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-700">Fournisseurs</h2>
          {links.length > 0 && (
            <span className="text-xs text-slate-400">({links.length})</span>
          )}
        </div>
        {canEdit && (
          <Button variant="outline" size="sm" onClick={openAdd}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            Ajouter
          </Button>
        )}
      </div>

      {links.length === 0 ? (
        <p className="text-sm text-slate-400">Aucun fournisseur lié</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 pr-4 font-medium text-slate-600">Fournisseur</th>
                <th className="text-left py-2 pr-4 font-medium text-slate-600">Réf. fournisseur</th>
                <th className="text-left py-2 pr-4 font-medium text-slate-600">Prix achat</th>
                <th className="text-left py-2 pr-4 font-medium text-slate-600">Délai réappro</th>
                {canEdit && <th className="py-2 w-16" />}
              </tr>
            </thead>
            <tbody>
              {links.map((link) => (
                <tr key={link.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-2.5 pr-4 font-medium text-slate-800">{link.supplierName}</td>
                  <td className="py-2.5 pr-4 font-mono text-xs text-slate-600">
                    {link.supplierReference ?? <span className="text-slate-300">—</span>}
                  </td>
                  <td className="py-2.5 pr-4 text-slate-700">
                    {link.purchasePriceCents > 0
                      ? `${(link.purchasePriceCents / 100).toFixed(2)} €`
                      : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="py-2.5 pr-4 text-slate-700">
                    {link.leadTimeDays != null
                      ? `${link.leadTimeDays} j`
                      : <span className="text-slate-300">—</span>}
                  </td>
                  {canEdit && (
                    <td className="py-2.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { openEdit(link) }}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded"
                          title="Modifier"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { handleDelete(link) }}
                          disabled={isPending}
                          className="p-1 text-slate-400 hover:text-red-600 rounded"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialog ajouter / modifier */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>
              {editingLink ? "Modifier le fournisseur" : "Lier un fournisseur"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Sélection fournisseur (seulement en mode ajout) */}
            {!editingLink && (
              <div className="space-y-2">
                <div className="flex gap-3 text-sm">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      checked={form.mode === "existing"}
                      onChange={() => { setForm((f) => ({ ...f, mode: "existing", supplierId: "" })) }}
                    />
                    Fournisseur existant
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      checked={form.mode === "new"}
                      onChange={() => { setForm((f) => ({ ...f, mode: "new", supplierId: "" })) }}
                    />
                    Nouveau fournisseur
                  </label>
                </div>

                {form.mode === "existing" ? (
                  <select
                    value={form.supplierId}
                    onChange={(e) => { setForm((f) => ({ ...f, supplierId: e.target.value })) }}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">— Choisir un fournisseur</option>
                    {availableSuppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Nom du fournisseur *"
                    value={form.newSupplierName}
                    onChange={(e) => { setForm((f) => ({ ...f, newSupplierName: e.target.value })) }}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            )}

            {editingLink && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Fournisseur</p>
                <p className="text-sm font-medium text-slate-800">{editingLink.supplierName}</p>
              </div>
            )}

            <div>
              <label className="block text-xs text-slate-500 mb-1">Référence fournisseur</label>
              <input
                type="text"
                placeholder="Ex: REF-12345"
                value={form.supplierReference}
                onChange={(e) => { setForm((f) => ({ ...f, supplierReference: e.target.value })) }}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Prix d&apos;achat (€)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.purchasePriceEur}
                  onChange={(e) => { setForm((f) => ({ ...f, purchasePriceEur: e.target.value })) }}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Délai réappro (jours)</label>
                <input
                  type="number"
                  min="1"
                  max="999"
                  placeholder="Ex: 5"
                  value={form.leadTimeDays}
                  onChange={(e) => { setForm((f) => ({ ...f, leadTimeDays: e.target.value })) }}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setDialogOpen(false) }}>
              Annuler
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Enregistrement…" : editingLink ? "Modifier" : "Lier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
