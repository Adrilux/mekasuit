"use client"

import { useState } from "react"
import { Timer, Plus, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/feedback/confirm-dialog"
import { toast } from "sonner"
import { actionAddTimeEntry } from "@/server/actions/interventions/action-add-time-entry"
import { actionDeleteTimeEntry } from "@/server/actions/interventions/action-delete-time-entry"

type TimeEntry = {
  id: string
  userId: string
  startedAt: Date
  endedAt: Date | null
  durationMinutes: number | null
  note: string | null
}

type Props = {
  interventionId: string
  entries: TimeEntry[]
  currentUserId: string
  userNameMap: Map<string, string>
  canEdit: boolean
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h${m.toString().padStart(2, "0")}` : `${h}h`
}

function todayString() {
  return new Date().toISOString().slice(0, 10)
}

function nowTimeString() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

export function InterventionTimeTracking({
  interventionId,
  entries: initial,
  currentUserId,
  userNameMap,
  canEdit,
}: Props) {
  const [entries, setEntries] = useState<TimeEntry[]>(initial)
  const [formOpen, setFormOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [date, setDate] = useState(todayString)
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [note, setNote] = useState("")
  const [formError, setFormError] = useState<string | null>(null)

  const totalMinutes = entries
    .filter((e) => e.durationMinutes != null)
    .reduce((acc, e) => acc + (e.durationMinutes ?? 0), 0)

  function openForm() {
    setDate(todayString())
    setStartTime("")
    setEndTime("")
    setNote("")
    setFormError(null)
    setFormOpen(true)
  }

  async function handleSubmit() {
    if (!startTime || !endTime) { setFormError("Heure début et fin requises"); return }
    setFormError(null)
    setLoading(true)
    const result = await actionAddTimeEntry({ interventionId, date, startTime, endTime, note: note || undefined })
    setLoading(false)

    if (!result.success) {
      setFormError(result.error ?? "Erreur inconnue")
      return
    }

    const entry = result.data as TimeEntry
    setEntries((prev) => [
      ...prev,
      {
        ...entry,
        startedAt: new Date(entry.startedAt),
        endedAt: entry.endedAt ? new Date(entry.endedAt) : null,
      },
    ])
    toast.success("Session ajoutée")
    setFormOpen(false)
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleteLoading(true)
    const result = await actionDeleteTimeEntry({ entryId: deleteId })
    setDeleteLoading(false)
    if (!result.success) { toast.error(result.error); return }
    toast.success("Session supprimée")
    setDeleteId(null)
    setEntries((prev) => prev.filter((e) => e.id !== deleteId))
  }

  // Durée prévisualisée en temps réel
  const previewMinutes = (() => {
    if (!startTime || !endTime) return null
    const start = new Date(`${date}T${startTime}:00`).getTime()
    const end = new Date(`${date}T${endTime}:00`).getTime()
    const m = Math.round((end - start) / 60000)
    return m > 0 ? m : null
  })()

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      {/* En-tête */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
        <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Timer className="w-4 h-4 text-slate-400" />
          Pointage heures
          {totalMinutes > 0 && (
            <span className="text-xs font-normal text-slate-400">
              — total : {formatDuration(totalMinutes)}
            </span>
          )}
        </h2>
        {canEdit && !formOpen && (
          <Button size="sm" variant="outline" onClick={openForm}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            Ajouter
          </Button>
        )}
      </div>

      {/* Formulaire inline de saisie */}
      {formOpen && (
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-700">Nouvelle session</p>
            <button onClick={() => { setFormOpen(false) }} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {/* Date */}
            <div>
              <label className="block text-xs text-slate-500 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => { setDate(e.target.value) }}
                className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Heures */}
            <div className="flex items-end gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Début</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => { setStartTime(e.target.value) }}
                  className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <span className="text-slate-400 pb-2">→</span>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Fin</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => { setEndTime(e.target.value) }}
                  className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {previewMinutes && (
                <span className="text-sm font-semibold text-slate-700 pb-2">
                  = {formatDuration(previewMinutes)}
                </span>
              )}
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs text-slate-500 mb-1">Note (optionnel)</label>
              <input
                type="text"
                placeholder="Ex : déplacement inclus, attente pièces..."
                value={note}
                onChange={(e) => { setNote(e.target.value) }}
                maxLength={500}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {formError && <p className="text-xs text-red-600">{formError}</p>}

            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={handleSubmit} disabled={loading}>
                {loading ? "Enregistrement…" : "Enregistrer"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setFormOpen(false) }}>
                Annuler
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Liste des sessions */}
      {entries.length === 0 ? (
        <p className="px-5 py-6 text-sm text-slate-400 text-center">Aucune session enregistrée</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {[...entries].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()).map((entry) => {
            const isOpen = !entry.endedAt
            return (
              <li key={entry.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700">
                    {userNameMap.get(entry.userId) ?? "Utilisateur inconnu"}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(entry.startedAt).toLocaleDateString("fr-FR", {
                      day: "numeric", month: "short",
                    })}
                    {" · "}
                    {new Date(entry.startedAt).toLocaleTimeString("fr-FR", {
                      hour: "2-digit", minute: "2-digit",
                    })}
                    {entry.endedAt && (
                      <> → {new Date(entry.endedAt).toLocaleTimeString("fr-FR", {
                        hour: "2-digit", minute: "2-digit",
                      })}</>
                    )}
                    {isOpen && " · en cours"}
                    {entry.note && ` · ${entry.note}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-semibold text-slate-700">
                    {entry.durationMinutes != null ? formatDuration(entry.durationMinutes) : "—"}
                  </span>
                  {canEdit && (
                    <button
                      onClick={() => { setDeleteId(entry.id) }}
                      className="p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => { if (!o) setDeleteId(null) }}
        title="Supprimer cette session ?"
        description="Cette action est irréversible."
        confirmLabel={deleteLoading ? "Suppression…" : "Supprimer"}
        onConfirm={handleDelete}
      />
    </div>
  )
}
