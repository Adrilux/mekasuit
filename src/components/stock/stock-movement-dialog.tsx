"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { StockMovementForm } from "@/components/stock/stock-movement-form"

type StockMovementDialogProps = {
  stockItemId: string
  itemName: string
  currentQuantity: number
  unit: string
}

export function StockMovementDialog({ stockItemId, itemName, currentQuantity, unit }: StockMovementDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4 mr-1" />
        Mouvement de stock
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Mouvement de stock</DialogTitle>
          </DialogHeader>
          <StockMovementForm
            stockItemId={stockItemId}
            itemName={itemName}
            currentQuantity={currentQuantity}
            unit={unit}
            onSuccess={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
