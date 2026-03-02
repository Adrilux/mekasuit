"use client"

import { useState, useTransition } from "react"
import { Sparkles, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { actionGenerateInterventionSummary } from "@/server/actions/ai/action-generate-intervention-summary"

export function InterventionSummaryButton({ interventionId }: { interventionId: string }) {
  const [open, setOpen] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleGenerate() {
    setError(null)
    setSummary(null)
    setOpen(true)

    startTransition(async () => {
      const res = await actionGenerateInterventionSummary({ interventionId })
      if (!res.success) {
        setError(res.error ?? "Erreur inconnue")
        return
      }
      if ("data" in res) setSummary(res.data as string)
    })
  }

  function handleCopy() {
    if (!summary) return
    void navigator.clipboard.writeText(summary).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleGenerate}
        disabled={isPending}
        className="text-purple-700 border-purple-200 hover:bg-purple-50 hover:border-purple-300"
      >
        <Sparkles className="w-3.5 h-3.5 mr-1.5" />
        Résumé IA
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              Résumé de l&apos;intervention
            </DialogTitle>
          </DialogHeader>

          {isPending && (
            <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
              <span className="animate-bounce">·</span>
              <span className="animate-bounce [animation-delay:0.15s]">·</span>
              <span className="animate-bounce [animation-delay:0.3s]">·</span>
              <span className="ml-2 text-sm">Génération en cours…</span>
            </div>
          )}

          {error && !isPending && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
          )}

          {summary && !isPending && (
            <div className="space-y-3">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                {summary}
              </div>
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1.5 text-green-600" />
                      Copié !
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 mr-1.5" />
                      Copier
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          <p className="text-xs text-slate-400 text-center">Généré par Llama 3.3 via Groq · À titre indicatif</p>
        </DialogContent>
      </Dialog>
    </>
  )
}
