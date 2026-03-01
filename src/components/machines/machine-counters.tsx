"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Gauge, Plus, Pencil, Trash2, TrendingUp, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/feedback/confirm-dialog"
import { toast } from "sonner"
import { actionCreateCounter } from "@/server/actions/counters/action-create-counter"
import { actionUpdateCounter } from "@/server/actions/counters/action-update-counter"
import { actionDeleteCounter } from "@/server/actions/counters/action-delete-counter"
import { actionAddCounterReading } from "@/server/actions/counters/action-add-counter-reading"
import type { MachineCounterWithReadings } from "@/server/queries/machines/query-get-machine-counters"

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Basse" },
  { value: "MEDIUM", label: "Moyenne" },
  { value: "HIGH", label: "Haute" },
  { value: "CRITICAL", label: "Critique" },
]

type Props = {
  machineId: string
  counters: MachineCounterWithReadings[]
  canEdit: boolean
}

// ─── Formulaire compteur (création / édition) ───────────────────────────────

type CounterFormState = {
  name: string
  unit: string
  thresholdValue: string
  thresholdInterval: string
  triggerTitle: string
  triggerDescription: string
  triggerPriority: string
}

const EMPTY_FORM: CounterFormState = {
  name: "",
  unit: "",
  thresholdValue: "",
  thresholdInterval: "",
  triggerTitle: "",
  triggerDescription: "",
  triggerPriority: "MEDIUM",
}

function counterToForm(c: MachineCounterWithReadings): CounterFormState {
  return {
    name: c.name,
    unit: c.unit,
    thresholdValue: c.thresholdValue !== null ? String(c.thresholdValue) : "",
    thresholdInterval: c.thresholdInterval !== null ? String(c.thresholdInterval) : "",
    triggerTitle: c.triggerTitle ?? "",
    triggerDescription: c.triggerDescription ?? "",
    triggerPriority: c.triggerPriority ?? "MEDIUM",
  }
}

// ─── Composant principal ─────────────────────────────────────────────────────

export function MachineCounters({ machineId, counters: initial, canEdit }: Props) {
  const router = useRouter()
  const [counters, setCounters] = useState(initial)

  // Dialog compteur (create/edit)
  const [counterDialog, setCounterDialog] = useState(false)
  const [editingCounter, setEditingCounter] = useState<MachineCounterWithReadings | null>(null)
  const [form, setForm] = useState<CounterFormState>(EMPTY_FORM)
  const [formLoading, setFormLoading] = useState(false)

  // Dialog relevé
  const [readingDialog, setReadingDialog] = useState(false)
  const [readingCounterId, setReadingCounterId] = useState<string | null>(null)
  const [readingValue, setReadingValue] = useState("")
  const [readingNote, setReadingNote] = useState("")
  const [readingLoading, setReadingLoading] = useState(false)

  // Dialog suppression
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Affichage historique par compteur
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  function openCreate() {
    setEditingCounter(null)
    setForm(EMPTY_FORM)
    setCounterDialog(true)
  }

  function openEdit(c: MachineCounterWithReadings) {
    setEditingCounter(c)
    setForm(counterToForm(c))
    setCounterDialog(true)
  }

  async function handleCounterSubmit() {
    setFormLoading(true)
    const payload = {
      machineId,
      name: form.name,
      unit: form.unit,
      thresholdValue: form.thresholdValue ? Number(form.thresholdValue) : undefined,
      thresholdInterval: form.thresholdInterval ? Number(form.thresholdInterval) : undefined,
      triggerTitle: form.triggerTitle || undefined,
      triggerDescription: form.triggerDescription || undefined,
      triggerPriority: form.triggerPriority || undefined,
    }

    const result = editingCounter
      ? await actionUpdateCounter({ counterId: editingCounter.id, ...payload })
      : await actionCreateCounter(payload)

    setFormLoading(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success(editingCounter ? "Compteur modifié" : "Compteur créé")
    setCounterDialog(false)
    router.refresh()
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleteLoading(true)
    const result = await actionDeleteCounter({ counterId: deleteId })
    setDeleteLoading(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success("Compteur supprimé")
    setDeleteId(null)
    setCounters((prev) => prev.filter((c) => c.id !== deleteId))
  }

  function openReading(counterId: string) {
    setReadingCounterId(counterId)
    const counter = counters.find((c) => c.id === counterId)
    setReadingValue(counter ? String(counter.currentValue) : "")
    setReadingNote("")
    setReadingDialog(true)
  }

  async function handleReadingSubmit() {
    if (!readingCounterId) return
    setReadingLoading(true)
    const result = await actionAddCounterReading({
      counterId: readingCounterId,
      value: Number(readingValue),
      note: readingNote || undefined,
    })
    setReadingLoading(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    const { triggeredIntervention } = result.data
    if (triggeredIntervention) {
      toast.success(
        `Relevé enregistré — intervention préventive créée : "${triggeredIntervention.title}"`,
        { duration: 6000 }
      )
    } else {
      toast.success("Relevé enregistré")
    }

    setReadingDialog(false)
    router.refresh()
  }

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
        <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Gauge className="w-4 h-4 text-slate-400" />
          Compteurs machine
          {counters.length > 0 && (
            <span className="text-xs font-normal text-slate-400">({counters.length})</span>
          )}
        </h2>
        {canEdit && (
          <Button variant="outline" size="sm" onClick={openCreate}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            Ajouter
          </Button>
        )}
      </div>

      {counters.length === 0 ? (
        <p className="px-5 py-6 text-sm text-slate-400 text-center">
          Aucun compteur — heures moteur, cycles, km…
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {counters.map((counter) => {
            const isExpanded = expandedIds.has(counter.id)
            const nearThreshold =
              counter.thresholdValue !== null &&
              counter.currentValue >= counter.thresholdValue * 0.9 &&
              counter.currentValue < counter.thresholdValue
            const overThreshold =
              counter.thresholdValue !== null && counter.currentValue >= counter.thresholdValue

            return (
              <li key={counter.id}>
                <div className="flex items-start gap-3 px-5 py-4 hover:bg-slate-50">
                  {/* Icône état */}
                  <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    overThreshold ? "bg-red-50" : nearThreshold ? "bg-amber-50" : "bg-blue-50"
                  }`}>
                    {overThreshold || nearThreshold ? (
                      <AlertTriangle className={`w-4 h-4 ${overThreshold ? "text-red-500" : "text-amber-500"}`} />
                    ) : (
                      <TrendingUp className="w-4 h-4 text-blue-400" />
                    )}
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <p className="text-sm font-semibold text-slate-800">{counter.name}</p>
                      <span className={`text-lg font-bold ${
                        overThreshold ? "text-red-600" : nearThreshold ? "text-amber-600" : "text-blue-600"
                      }`}>
                        {counter.currentValue.toLocaleString("fr-FR")} {counter.unit}
                      </span>
                    </div>
                    {counter.thresholdValue !== null && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        Seuil : {counter.thresholdValue.toLocaleString("fr-FR")} {counter.unit}
                        {counter.thresholdInterval !== null && (
                          <> · Intervalle : {counter.thresholdInterval.toLocaleString("fr-FR")} {counter.unit}</>
                        )}
                        {overThreshold && <span className="ml-1 text-red-500 font-medium">— seuil dépassé</span>}
                        {nearThreshold && <span className="ml-1 text-amber-500 font-medium">— proche du seuil</span>}
                      </p>
                    )}
                    {counter.readings.length > 0 && (
                      <button
                        onClick={() => toggleExpand(counter.id)}
                        className="text-xs text-slate-400 hover:text-slate-700 mt-1 flex items-center gap-0.5"
                      >
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        {counter.readings.length} relevé{counter.readings.length > 1 ? "s" : ""}
                      </button>
                    )}
                  </div>

                  {/* Actions */}
                  {canEdit && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button variant="outline" size="sm" onClick={() => openReading(counter.id)}>
                        + Relevé
                      </Button>
                      <button
                        onClick={() => openEdit(counter)}
                        className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteId(counter.id)}
                        className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Historique relevés */}
                {isExpanded && counter.readings.length > 0 && (
                  <div className="mx-5 mb-3 border border-slate-100 rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="text-left px-3 py-2 font-medium text-slate-500">Valeur</th>
                          <th className="text-left px-3 py-2 font-medium text-slate-500">Date</th>
                          <th className="text-left px-3 py-2 font-medium text-slate-500">Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {counter.readings.map((r) => (
                          <tr key={r.id} className="border-b border-slate-100 last:border-0">
                            <td className="px-3 py-2 font-medium text-slate-700">
                              {r.value.toLocaleString("fr-FR")} {counter.unit}
                            </td>
                            <td className="px-3 py-2 text-slate-500">
                              {new Date(r.recordedAt).toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </td>
                            <td className="px-3 py-2 text-slate-400">{r.note ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {/* ── Dialog création / édition compteur ── */}
      <Dialog open={counterDialog} onOpenChange={setCounterDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCounter ? "Modifier le compteur" : "Nouveau compteur"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nom *</Label>
                <Input
                  className="mt-1"
                  placeholder="Heures moteur"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <Label>Unité *</Label>
                <Input
                  className="mt-1"
                  placeholder="h / cycles / km"
                  value={form.unit}
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                />
              </div>
            </div>

            <p className="text-xs font-medium text-slate-500 pt-1">Déclenchement d'intervention (optionnel)</p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Seuil de déclenchement</Label>
                <Input
                  type="number"
                  min="0"
                  className="mt-1"
                  placeholder="500"
                  value={form.thresholdValue}
                  onChange={(e) => setForm((f) => ({ ...f, thresholdValue: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-xs">Intervalle de répétition</Label>
                <Input
                  type="number"
                  min="0"
                  className="mt-1"
                  placeholder="500"
                  value={form.thresholdInterval}
                  onChange={(e) => setForm((f) => ({ ...f, thresholdInterval: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Titre de l'intervention à créer</Label>
              <Input
                className="mt-1"
                placeholder="Vidange moteur toutes les 500h"
                value={form.triggerTitle}
                onChange={(e) => setForm((f) => ({ ...f, triggerTitle: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Priorité</Label>
                <select
                  className="mt-1 w-full h-9 rounded-md border border-slate-200 bg-white px-2 text-sm"
                  value={form.triggerPriority}
                  onChange={(e) => setForm((f) => ({ ...f, triggerPriority: e.target.value }))}
                >
                  {PRIORITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div />
            </div>

            <div>
              <Label className="text-xs">Description de l'intervention</Label>
              <Textarea
                className="mt-1 resize-none"
                rows={2}
                placeholder="Instructions pour le technicien…"
                value={form.triggerDescription}
                onChange={(e) => setForm((f) => ({ ...f, triggerDescription: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCounterDialog(false)}>Annuler</Button>
            <Button
              onClick={handleCounterSubmit}
              disabled={formLoading || !form.name || !form.unit}
            >
              {formLoading ? "Enregistrement…" : editingCounter ? "Modifier" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog saisie relevé ── */}
      <Dialog open={readingDialog} onOpenChange={setReadingDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Saisir un relevé —{" "}
              {counters.find((c) => c.id === readingCounterId)?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>
                Valeur ({counters.find((c) => c.id === readingCounterId)?.unit})
              </Label>
              <Input
                type="number"
                min="0"
                step="0.1"
                className="mt-1"
                value={readingValue}
                onChange={(e) => setReadingValue(e.target.value)}
                autoFocus
              />
              {(() => {
                const counter = counters.find((c) => c.id === readingCounterId)
                if (!counter) return null
                return (
                  <p className="text-xs text-slate-400 mt-1">
                    Valeur actuelle : {counter.currentValue.toLocaleString("fr-FR")} {counter.unit}
                    {counter.thresholdValue !== null && (
                      <> · Prochain seuil : {counter.thresholdValue.toLocaleString("fr-FR")} {counter.unit}</>
                    )}
                  </p>
                )
              })()}
            </div>
            <div>
              <Label>Note (optionnel)</Label>
              <Input
                className="mt-1"
                placeholder="Relevé mensuel, compteur remplacé…"
                value={readingNote}
                onChange={(e) => setReadingNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReadingDialog(false)}>Annuler</Button>
            <Button
              onClick={handleReadingSubmit}
              disabled={readingLoading || !readingValue}
            >
              {readingLoading ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog suppression ── */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => { if (!o) setDeleteId(null) }}
        title="Supprimer ce compteur ?"
        description="Tous les relevés associés seront supprimés définitivement."
        confirmLabel={deleteLoading ? "Suppression…" : "Supprimer"}
        onConfirm={handleDelete}
      />
    </div>
  )
}
