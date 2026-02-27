"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { actionCreateStockTransfer } from "@/server/actions/stock/action-create-stock-transfer"
import { toast } from "sonner"
import type { SiteListItem } from "@/server/queries/sites/query-get-sites-by-tenant"

type Props = {
  sites: Pick<SiteListItem, "id" | "name">[]
  userSiteIds: string[]
}

export function StockTransferForm({ sites, userSiteIds }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [fromSiteId, setFromSiteId] = useState(userSiteIds[0] ?? "")
  const [toSiteId, setToSiteId]     = useState("")
  const [stockItemId, setStockItemId] = useState("")
  const [stockItems, setStockItems]   = useState<{ id: string; name: string; reference: string; quantityOnHand: number; unit: string }[]>([])
  const [quantity, setQuantity]       = useState(1)
  const [reason, setReason]           = useState("")
  const [loadingItems, setLoadingItems] = useState(false)

  // Charger les articles du site source
  useEffect(() => {
    if (!fromSiteId) return
    setStockItemId("")
    setStockItems([])
    setLoadingItems(true)
    fetch(`/api/stock-items?siteId=${fromSiteId}`)
      .then((r) => r.json())
      .then((data) => { setStockItems(data); setLoadingItems(false) })
      .catch(() => setLoadingItems(false))
  }, [fromSiteId])

  const destinationSites = sites.filter((s) => s.id !== fromSiteId)
  const selectedItem = stockItems.find((i) => i.id === stockItemId)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fromSiteId || !toSiteId || !stockItemId || quantity < 1) return

    startTransition(async () => {
      const res = await actionCreateStockTransfer({
        fromSiteId,
        toSiteId,
        stockItemId,
        quantity,
        reason: reason.trim() || undefined,
      })
      if (!res.success) {
        toast.error(res.error)
        return
      }
      toast.success("Demande de transfert créée")
      router.push("/stock/transfers")
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-5 space-y-5">
      {/* Site source */}
      <div className="space-y-1.5">
        <Label htmlFor="fromSite">Site source</Label>
        <Select value={fromSiteId} onValueChange={setFromSiteId}>
          <SelectTrigger id="fromSite">
            <SelectValue placeholder="Choisir le site source" />
          </SelectTrigger>
          <SelectContent>
            {sites.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Article */}
      <div className="space-y-1.5">
        <Label htmlFor="stockItem">Article à transférer</Label>
        <Select value={stockItemId} onValueChange={setStockItemId} disabled={!fromSiteId || loadingItems}>
          <SelectTrigger id="stockItem">
            <SelectValue placeholder={loadingItems ? "Chargement…" : "Choisir un article"} />
          </SelectTrigger>
          <SelectContent>
            {stockItems.map((i) => (
              <SelectItem key={i.id} value={i.id}>
                {i.name} — {i.quantityOnHand} {i.unit} disponible(s)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedItem && (
          <p className="text-xs text-slate-500">
            Réf. {selectedItem.reference} · Stock actuel : {selectedItem.quantityOnHand} {selectedItem.unit}
          </p>
        )}
      </div>

      {/* Quantité */}
      <div className="space-y-1.5">
        <Label htmlFor="quantity">Quantité</Label>
        <Input
          id="quantity"
          type="number"
          min={1}
          max={selectedItem?.quantityOnHand ?? undefined}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          required
        />
      </div>

      {/* Site destination */}
      <div className="space-y-1.5">
        <Label htmlFor="toSite">Site destination</Label>
        <Select value={toSiteId} onValueChange={setToSiteId} disabled={!fromSiteId}>
          <SelectTrigger id="toSite">
            <SelectValue placeholder="Choisir le site destination" />
          </SelectTrigger>
          <SelectContent>
            {destinationSites.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Motif */}
      <div className="space-y-1.5">
        <Label htmlFor="reason">Motif <span className="text-slate-400 font-normal">(optionnel)</span></Label>
        <Textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ex : Renfort temporaire pour chantier nord"
          rows={2}
        />
      </div>

      <div className="flex gap-3 pt-1">
        <Button type="submit" disabled={isPending || !fromSiteId || !toSiteId || !stockItemId}>
          {isPending ? "Envoi en cours…" : "Envoyer la demande"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Annuler
        </Button>
      </div>
    </form>
  )
}
