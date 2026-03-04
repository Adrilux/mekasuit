"use client"

import { useState, useTransition } from "react"
import { Truck, Plus, Trash2, Pencil, ExternalLink, X } from "lucide-react"
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
  productUrls: string[]
  newUrlInput: string
}

const EMPTY_FORM: LinkFormState = {
  mode: "existing",
  supplierId: "",
  newSupplierName: "",
  supplierReference: "",
  purchasePriceEur: "",
  leadTimeDays: "",
  productUrls: [],
  newUrlInput: "",
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
      productUrls: link.productUrls,
      newUrlInput: "",
    })
    setError(null)
    setDialogOpen(true)
  }

  function addUrl() {
    const url = form.newUrlInput.trim()
    if (!url) return
    if (!/^https?:\/\/.+/.test(url)) { setError("URL invalide (doit commencer par http:// ou https://)"); return }
    if (form.productUrls.length >= 10) { setError("Maximum 10 URLs par fournisseur"); return }
    setError(null)
    setForm((f) => ({ ...f, productUrls: [...f.productUrls, url], newUrlInput: "" }))
  }

  function removeUrl(index: number) {
    setForm((f) => ({ ...f, productUrls: f.productUrls.filter((_, i) => i !== index) }))
  }

  function handleSubmit() {
    setError(null)
    startTransition(async () => {
      let supplierId = form.supplierId

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
        productUrls: form.productUrls,
      })

      if (!res.success) { setError(res.error ?? "Erreur inconnue"); return }

      const supplierName = form.mode === "new"
        ? form.newSupplierName.trim()
        : (allSuppliers.find((s) => s.id === supplierId)?.name ?? "")

      const newLink: StockItemSupplierDetail = {
        id: editingLink?.id ?? supplierId,
        supplierId,
        supplierName,
        supplierReference: form.supplierReference || null,
        purchasePriceCents: isNaN(purchasePriceCents) ? 0 : purchasePriceCents,
        leadTimeDays: leadTimeDays && !isNaN(leadTimeDays) ? leadTimeDays : null,
        productUrls: form.productUrls,
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

  const linkedIds = new Set(links.map((l) => l.supplierId))
  const availableSuppliers = allSuppliers.filter((s) => {
    if (editingLink) return true
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
        <div className="space-y-2">
          {links.map((link) => (
            <div key={link.id} className="border border-slate-100 rounded-lg p-3 hover:bg-slate-50">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{link.supplierName}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                    {link.supplierReference && (
                      <span className="font-mono">{link.supplierReference}</span>
                    )}
                    {link.purchasePriceCents > 0 && (
                      <span>{(link.purchasePriceCents / 100).toFixed(2)} €</span>
                    )}
                    {link.leadTimeDays != null && (
                      <span>{link.leadTimeDays} j délai</span>
                    )}
                  </div>
                  {link.productUrls.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {link.productUrls.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => { e.stopPropagation() }}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {new URL(url).hostname.replace("www.", "")}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                {canEdit && (
                  <div className="flex items-center gap-1 shrink-0">
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
                )}
              </div>
            </div>
          ))}
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

            {/* URLs produit */}
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">
                Liens produit ({form.productUrls.length}/10)
              </label>
              {form.productUrls.length > 0 && (
                <div className="space-y-1 mb-2">
                  {form.productUrls.map((url, i) => (
                    <div key={i} className="flex items-center gap-2 bg-slate-50 rounded px-2 py-1.5">
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-xs text-blue-600 hover:underline truncate"
                      >
                        {url}
                      </a>
                      <button
                        onClick={() => { removeUrl(i) }}
                        className="text-slate-400 hover:text-red-500 shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {form.productUrls.length < 10 && (
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://..."
                    value={form.newUrlInput}
                    onChange={(e) => { setForm((f) => ({ ...f, newUrlInput: e.target.value })); setError(null) }}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addUrl() } }}
                    className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addUrl}>
                    Ajouter
                  </Button>
                </div>
              )}
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
