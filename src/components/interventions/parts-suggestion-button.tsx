"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, Plus, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { actionSuggestParts } from "@/server/actions/ai/action-suggest-parts"
import { actionConsumeStockPart } from "@/server/actions/interventions/action-consume-stock-part"
import type { SuggestedPart } from "@/server/actions/ai/action-suggest-parts"
import { toast } from "sonner"

export function PartsSuggestionButton({ interventionId }: { interventionId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<SuggestedPart[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isFetching, startFetch] = useTransition()
  const [addingId, setAddingId] = useState<string | null>(null)

  function handleOpen() {
    setError(null)
    setSuggestions([])
    setOpen(true)

    startFetch(async () => {
      const res = await actionSuggestParts({ interventionId })
      if (!res.success) {
        setError(res.error ?? "Erreur inconnue")
        return
      }
      if ("data" in res) setSuggestions(res.data as SuggestedPart[])
    })
  }

  async function handleAdd(part: SuggestedPart) {
    setAddingId(part.stockItemId)
    const res = await actionConsumeStockPart({
      interventionId,
      stockItemId: part.stockItemId,
      quantity: 1,
    })
    setAddingId(null)

    if (!res.success) {
      toast.error(res.error ?? "Erreur lors de l'ajout")
      return
    }

    toast.success(`${part.name} ajouté`)
    router.refresh()
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpen}
        disabled={isFetching}
        className="text-purple-700 border-purple-200 hover:bg-purple-50 hover:border-purple-300"
      >
        <Sparkles className="w-3.5 h-3.5 mr-1.5" />
        Suggérer pièces IA
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              Suggestions de pièces
            </DialogTitle>
          </DialogHeader>

          {isFetching && (
            <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
              <span className="animate-bounce">·</span>
              <span className="animate-bounce [animation-delay:0.15s]">·</span>
              <span className="animate-bounce [animation-delay:0.3s]">·</span>
              <span className="ml-2 text-sm">Analyse en cours…</span>
            </div>
          )}

          {error && !isFetching && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded px-3 py-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">{error}</p>
            </div>
          )}

          {suggestions.length > 0 && !isFetching && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                L&apos;IA a identifié ces pièces comme probablement nécessaires. Cliquez sur <strong>Ajouter</strong> pour les consommer depuis le stock.
              </p>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                {suggestions.map((part) => (
                  <div key={part.stockItemId} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-slate-900">{part.name}</div>
                      <div className="text-xs text-slate-500">
                        {part.reference}
                        {" · "}
                        <span className={part.quantityOnHand === 0 ? "text-red-600 font-medium" : "text-slate-500"}>
                          {part.quantityOnHand} en stock
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={addingId === part.stockItemId || part.quantityOnHand === 0}
                      onClick={() => void handleAdd(part)}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      {addingId === part.stockItemId ? "Ajout…" : "Ajouter"}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-slate-400 text-center">Généré par Llama 3.3 via Groq · À titre indicatif</p>
        </DialogContent>
      </Dialog>
    </>
  )
}
