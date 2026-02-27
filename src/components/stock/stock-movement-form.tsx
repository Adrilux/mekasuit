"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { actionStockMovement } from "@/server/actions/stock/action-stock-movement"
import { toast } from "sonner"

type StockMovementFormProps = {
  stockItemId: string
  itemName: string
  currentQuantity: number
  unit: string
  onSuccess?: () => void
}

export function StockMovementForm({ stockItemId, itemName, currentQuantity, unit, onSuccess }: StockMovementFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState<"IN" | "ADJUSTMENT">("IN")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)

    const result = await actionStockMovement({
      stockItemId,
      type,
      quantity: form.get("quantity") as string,
      reason: form.get("reason") as string || undefined,
    })

    setLoading(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success(type === "IN" ? "Entrée de stock enregistrée" : "Ajustement de stock enregistré")
    router.refresh()
    if (onSuccess) onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-slate-50 rounded-lg p-3 text-sm">
        <span className="text-slate-500">Stock actuel :</span>{" "}
        <span className="font-semibold">{currentQuantity} {unit}</span>
      </div>

      <div>
        <Label>Type de mouvement</Label>
        <Select value={type} onValueChange={(v) => setType(v as "IN" | "ADJUSTMENT")}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="IN">Entrée (réception commande / livraison)</SelectItem>
            <SelectItem value="ADJUSTMENT">Ajustement d'inventaire</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="quantity">Quantité *</Label>
        <Input id="quantity" name="quantity" type="number" min={1} required
          defaultValue={1} className="mt-1" />
        <p className="text-xs text-slate-500 mt-1">
          {type === "IN" ? "Quantité à ajouter au stock" : "Quantité à corriger (ajout)"}
        </p>
      </div>

      <div>
        <Label htmlFor="reason">Motif</Label>
        <Textarea id="reason" name="reason" rows={2} maxLength={300}
          className="mt-1" placeholder="Ex: Réception BL 2024-001, Inventaire physique..." />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Enregistrement..." : "Valider le mouvement"}
      </Button>
    </form>
  )
}
