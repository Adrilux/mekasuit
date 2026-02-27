"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { actionCreateStockItem } from "@/server/actions/stock/action-create-stock-item"
import { actionUpdateStockItem } from "@/server/actions/stock/action-update-stock-item"
import { toast } from "sonner"
import type { SiteListItem } from "@/server/queries/sites/query-get-sites-by-tenant"

const UNIT_OPTIONS = ["pièce", "litre", "kg", "mètre", "rouleau", "boîte", "paire", "set"]

type StockItemFormProps = {
  sites: Pick<SiteListItem, "id" | "name">[]
  defaultSiteId?: string
  stockItem?: {
    id: string
    siteId: string
    reference: string
    name: string
    unit: string
    quantityOnHand: number
    minimumLevel: number
    unitCostCents: number
  }
}

export function StockItemForm({ sites, defaultSiteId, stockItem }: StockItemFormProps) {
  const router = useRouter()
  const isEdit = !!stockItem
  const [loading, setLoading] = useState(false)
  const [unit, setUnit] = useState(stockItem?.unit ?? "pièce")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)

    const payload = {
      siteId: form.get("siteId") as string,
      reference: form.get("reference") as string,
      name: form.get("name") as string,
      unit,
      quantityOnHand: form.get("quantityOnHand") as string,
      minimumLevel: form.get("minimumLevel") as string,
      unitCostCents: form.get("unitCostCents") as string,
    }

    const result = isEdit
      ? await actionUpdateStockItem({ stockItemId: stockItem.id, ...payload })
      : await actionCreateStockItem(payload)

    setLoading(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success(isEdit ? "Article modifié" : "Article créé")
    if (isEdit) {
      router.push(`/stock/${stockItem.id}`)
    } else {
      router.push("/stock")
    }
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
      {/* Site */}
      <div>
        <Label htmlFor="siteId">Site *</Label>
        {isEdit ? (
          <input type="hidden" name="siteId" value={stockItem.siteId} />
        ) : (
          <Select name="siteId" defaultValue={defaultSiteId ?? sites[0]?.id} required>
            <SelectTrigger id="siteId" className="mt-1">
              <SelectValue placeholder="Sélectionner un site" />
            </SelectTrigger>
            <SelectContent>
              {sites.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Référence */}
      <div>
        <Label htmlFor="reference">Référence *</Label>
        <Input id="reference" name="reference" required maxLength={100}
          defaultValue={stockItem?.reference}
          className="mt-1" placeholder="Ex: RLT-6205-2RS, HUI-46-5L" />
        <p className="text-xs text-slate-500 mt-1">Utilisée pour la recherche par code-barre / scanner</p>
      </div>

      {/* Nom */}
      <div>
        <Label htmlFor="name">Désignation *</Label>
        <Input id="name" name="name" required maxLength={200}
          defaultValue={stockItem?.name}
          className="mt-1" placeholder="Ex: Roulement 6205-2RS" />
      </div>

      {/* Unité + quantités */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="unit">Unité</Label>
          <Select value={unit} onValueChange={setUnit}>
            <SelectTrigger id="unit" className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UNIT_OPTIONS.map((u) => (
                <SelectItem key={u} value={u}>{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!isEdit && (
          <div>
            <Label htmlFor="quantityOnHand">Stock initial</Label>
            <Input id="quantityOnHand" name="quantityOnHand" type="number"
              min={0} defaultValue={0} className="mt-1" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="minimumLevel">Seuil d'alerte</Label>
          <Input id="minimumLevel" name="minimumLevel" type="number"
            min={0} defaultValue={stockItem?.minimumLevel ?? 0} className="mt-1" />
          <p className="text-xs text-slate-500 mt-1">Alerte en rouge sous ce seuil</p>
        </div>
        <div>
          <Label htmlFor="unitCostCents">Coût unitaire (€)</Label>
          <Input id="unitCostCents" name="unitCostCents" type="number"
            min={0} step={0.01}
            defaultValue={stockItem ? (stockItem.unitCostCents / 100).toFixed(2) : "0.00"}
            className="mt-1" placeholder="0.00" />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Enregistrement..." : isEdit ? "Enregistrer" : "Créer l'article"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Annuler
        </Button>
      </div>
    </form>
  )
}
