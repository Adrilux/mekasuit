"use client"

import { useState, useTransition } from "react"
import { Link2, Link2Off, Cpu } from "lucide-react"
import Link from "next/link"
import { actionLinkStockItemToMachine } from "@/server/actions/stock/action-link-stock-item-to-machine"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"

type Machine = { id: string; name: string }

interface Props {
  stockItemId: string
  currentMachine: Machine | null
  availableMachines: Machine[]
  canEdit: boolean
}

export function StockMachineLinkPanel({
  stockItemId,
  currentMachine,
  availableMachines,
  canEdit,
}: Props) {
  const [selected, setSelected] = useState<string>(currentMachine?.id ?? "__none__")
  const [saved, setSaved] = useState<Machine | null>(currentMachine)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const isDirty = selected !== (saved?.id ?? "__none__")

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const machineId = selected === "__none__" ? null : selected
      const result = await actionLinkStockItemToMachine({ stockItemId, machineId })
      if (!result.success) {
        setError(result.error ?? "Erreur inconnue")
        return
      }
      const machine = availableMachines.find((m) => m.id === selected) ?? null
      setSaved(machine)
    })
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Cpu className="w-4 h-4 text-slate-500" />
        <h2 className="text-sm font-semibold text-slate-700">Machine associée</h2>
      </div>

      {canEdit ? (
        <div className="flex items-center gap-3">
          <Select value={selected} onValueChange={setSelected} disabled={isPending}>
            <SelectTrigger className="w-60 h-8 text-sm">
              <SelectValue placeholder="Aucune machine" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Link2Off className="w-3.5 h-3.5" />
                  Aucune machine
                </span>
              </SelectItem>
              {availableMachines.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isDirty && (
            <Button size="sm" onClick={handleSave} disabled={isPending}>
              {isPending ? "Sauvegarde…" : "Enregistrer"}
            </Button>
          )}
          {!isDirty && saved && (
            <Link href={`/machines/${saved.id}`} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              <Link2 className="w-3 h-3" />
              Voir la machine
            </Link>
          )}
        </div>
      ) : (
        <div className="text-sm text-slate-600">
          {saved ? (
            <Link href={`/machines/${saved.id}`} className="text-blue-600 hover:underline flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5" />
              {saved.name}
            </Link>
          ) : (
            <span className="text-slate-400">Aucune machine associée</span>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
